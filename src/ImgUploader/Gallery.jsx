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
        
      console.log('Making API request with options:', options);
        
      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options
      }).response;

      const data = await response.body.json();
      console.log('Raw response data:', data);
      
      // Simple parsing - the data.body contains the actual response
      let images = [];
      if (data.body) {
        try {
          const parsedBody = JSON.parse(data.body);
          images = parsedBody.images || [];
          console.log('Successfully parsed images:', images.length);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          setError('Error parsing response');
          return;
        }
      }
      
      console.log('Setting images:', images);
      setImages(images);
      
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleDeleteImage = async (imageId) => {
    if (!imageId) {
      console.error('No imageId provided for deletion');
      return;
    }

    // Confirm deletion
    const confirmed = window.confirm('Are you sure you want to delete this image? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingImageId(imageId);

    try {
      // Get current user
      const user = await getCurrentUser();
      const userId = user.username;

      console.log('Deleting image:', { imageId, userId });

      const response = await post({
        apiName: 'ImageAPI',
        path: '/delete-image',
        options: {
          body: { imageId, userId }
        }
      }).response;

      const result = await response.body.json();
      console.log('Delete response:', result);

      if (result.error) {
        throw new Error(result.error);
      }

      // Remove the image from the local state
      setImages(prevImages => prevImages.filter(img => img.imageId !== imageId));
      
      // Show success message
      alert('Image deleted successfully!');

    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Failed to delete image: ${error.message}`);
    } finally {
      setDeletingImageId(null);
    }
  };

  useEffect(() => {
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
                    console.log('Image failed to load:', img.url);
                    e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', img.url);
                  }}
                />
                {/* Delete button overlay */}
                <button
                  className="delete-button"
                  onClick={() => handleDeleteImage(img.imageId)}
                  disabled={deletingImageId === img.imageId}
                  title="Delete image"
                >
                  {deletingImageId === img.imageId ? 'Deleting...' : '×'}
                </button>
              </div>
              <div className="image-info">
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