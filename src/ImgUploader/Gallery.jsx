import React, { useState, useEffect, useCallback } from 'react';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import './Gallery.css';

function ImageGallery({ searchTerm = null }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);

  const fetchImages = useCallback(async () => {
    console.log('🔄 Starting fetchImages...');
    setLoading(true);
    setError(null);
    
    try {
      let options = {};
      
      if (searchTerm && searchTerm.trim() !== '') {
        options = {
          queryStringParameters: { 
            tag: searchTerm.trim() 
          }
        };
      }
        
      console.log('📡 Making API request with options:', options);
        
      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options
      }).response;

      const data = await response.body.json();
      console.log('📥 Raw response data:', data);
      
      // Simple parsing - the data.body contains the actual response
      let images = [];
      if (data.body) {
        try {
          const parsedBody = JSON.parse(data.body);
          images = parsedBody.images || [];
          console.log('✅ Successfully parsed images:', images.length);
        } catch (parseError) {
          console.error('❌ Parse error:', parseError);
          setError('Error parsing response');
          return;
        }
      }
      
      console.log('🖼️ Setting images to state:', images);
      setImages(images);
      
    } catch (error) {
      console.error('❌ Error fetching images:', error);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
      console.log('✅ fetchImages completed');
    }
  }, [searchTerm]);

  const handleDeleteImage = async (imageId) => {
    console.log('🗑️ === DELETE OPERATION STARTED ===');
    console.log('🗑️ Image ID to delete:', imageId);
    
    if (!imageId) {
      console.error('❌ No imageId provided for deletion');
      return;
    }

    // Confirm deletion
    console.log('❓ Showing confirmation dialog...');
    const confirmed = window.confirm('Are you sure you want to delete this image? This action cannot be undone.');
    if (!confirmed) {
      console.log('❌ User cancelled deletion');
      return;
    }

    console.log('✅ User confirmed deletion, setting deleting state...');
    setDeletingImageId(imageId);

    try {
      // Get current user
      console.log('👤 Getting current user...');
      const user = await getCurrentUser();
      const userId = user.username;
      console.log('👤 Current user ID:', userId);

      console.log('📤 Preparing delete request for image:', imageId, 'user:', userId);

      const deleteRequest = {
        apiName: 'ImageAPI',
        path: '/delete-image',
        options: {
          body: { imageId, userId }
        }
      };
      
      console.log('📤 Delete request config:', deleteRequest);

      console.log('📡 Sending delete request to API...');
      
      // Add more detailed error handling for the API call
      try {
        const response = await post(deleteRequest).response;
        console.log('📥 Delete response received, parsing...');
        const result = await response.body.json();
        console.log('📥 Delete response:', result);

        if (result.error) {
          console.error('❌ Delete failed with error:', result.error);
          throw new Error(result.error);
        }

        console.log('✅ Delete successful, updating local state...');
        // Remove the image from the local state
        setImages(prevImages => {
          const newImages = prevImages.filter(img => img.imageId !== imageId);
          console.log('🔄 Removed image from state. Previous count:', prevImages.length, 'New count:', newImages.length);
          return newImages;
        });
        
        console.log('✅ Showing success message...');
        alert('Image deleted successfully!');

      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        console.error('❌ API error type:', apiError.name);
        console.error('❌ API error stack:', apiError.stack);
        
        // Check if it's a 404 (endpoint not found)
        if (apiError.message && apiError.message.includes('404')) {
          console.error('❌ Delete endpoint not found. You need to create the /delete-image API endpoint.');
          alert('Delete endpoint not found. Please create the API endpoint first.');
        } else {
          throw apiError; // Re-throw to be caught by outer catch
        }
      }

    } catch (error) {
      console.error('❌ ERROR in delete operation:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Failed to delete image: ${error.message}`);
    } finally {
      console.log('🔄 Clearing deleting state...');
      setDeletingImageId(null);
      console.log('✅ === DELETE OPERATION COMPLETED ===');
    }
  };

  useEffect(() => {
    console.log('🚀 Gallery component mounted, fetching images...');
    fetchImages();
  }, [fetchImages]);

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="loading">Loading images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-container">
        <div className="error">{error}</div>
        <button onClick={fetchImages} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <h2>{searchTerm ? `Search Results for: "${searchTerm}"` : 'Image Gallery'}</h2>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Debug Info:</strong> Found {images.length} images
      </div>
      
      {images.length === 0 ? (
        <div className="no-images">
          {searchTerm ? 'No images found for this search term.' : 'No images available.'}
        </div>
      ) : (
        <div className="image-grid">
          {images.map((img, index) => (
            <div key={img.imageId || index} className="image-card">
              <div className="image-container">
                <img 
                  src={img.url} 
                  alt={img.tags ? img.tags.join(', ') : 'Image'} 
                  className="gallery-image"
                  onError={(e) => {
                    console.log('❌ Image failed to load:', img.url);
                    e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded successfully:', img.url);
                  }}
                />
                {/* Delete button overlay */}
                <button
                  className="delete-button"
                  onClick={() => {
                    console.log('🖱️ Delete button clicked for image:', img.imageId);
                    handleDeleteImage(img.imageId);
                  }}
                  disabled={deletingImageId === img.imageId}
                  title="Delete image"
                >
                  {deletingImageId === img.imageId ? 'Deleting...' : '×'}
                </button>
              </div>
              <div className="image-info">
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
                  ID: {img.imageId}
                </div>
                {img.tags && img.tags.length > 0 && (
                  <div className="tags">
                    {img.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                {img.uploadDate && (
                  <div className="upload-date">
                    Uploaded: {new Date(img.uploadDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;