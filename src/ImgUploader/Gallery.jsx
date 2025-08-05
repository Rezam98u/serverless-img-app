import React, { useState, useEffect, useCallback } from 'react';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import './Gallery.css';

function ImageGallery({ searchTerm = null }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

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

  const handleDeleteClick = (imageId) => {
    console.log('🖱️ Delete button clicked for image:', imageId);
    setImageToDelete(imageId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    
    console.log('🗑️ === DELETE OPERATION STARTED ===');
    console.log('🗑️ Image ID to delete:', imageToDelete);
    console.log('🗑️ Current images in state:', images);
    
    setShowConfirmDialog(false);
    setDeletingImageId(imageToDelete);

    try {
      // Get current user
      console.log('👤 Getting current user...');
      const user = await getCurrentUser();
      const userId = user.username;
      console.log('👤 Current user ID:', userId);

      console.log('📤 Preparing delete request for image:', imageToDelete, 'user:', userId);

      const deleteRequest = {
        apiName: 'ImageAPI',
        path: '/delete-image',
        options: {
          body: { imageId: imageToDelete, userId }
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
        console.log('🔄 Current images before removal:', images);
        
        // Remove the image from the local state
        setImages(prevImages => {
          console.log('🔄 setImages callback - prevImages:', prevImages);
          const newImages = prevImages.filter(img => {
            console.log('🔄 Checking image:', img.imageId, 'against:', imageToDelete, 'Match:', img.imageId === imageToDelete);
            return img.imageId !== imageToDelete;
          });
          console.log('🔄 Removed image from state. Previous count:', prevImages.length, 'New count:', newImages.length);
          console.log('🔄 New images array:', newImages);
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
      setImageToDelete(null);
      console.log('✅ === DELETE OPERATION COMPLETED ===');
    }
  };

  const cancelDelete = () => {
    console.log('❌ User cancelled deletion');
    setShowConfirmDialog(false);
    setImageToDelete(null);
  };

  useEffect(() => {
    console.log('🚀 Gallery component mounted, fetching images...');
    fetchImages();
  }, [fetchImages]);

  // Monitor images state changes
  useEffect(() => {
    console.log('🖼️ Images state changed:', images.length, 'images');
    console.log('🖼️ Images IDs:', images.map(img => img.imageId));
  }, [images]);

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
      
      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this image?</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Image ID: {imageToDelete}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>This action cannot be undone.</p>
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={confirmDelete}
                style={{
                  marginRight: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Yes, Delete
              </button>
              <button 
                onClick={cancelDelete}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                  onClick={() => handleDeleteClick(img.imageId)}
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