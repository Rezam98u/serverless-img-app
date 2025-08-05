import React, { useState, useEffect, useCallback } from 'react';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import './Gallery.css';

function ImageGallery({ searchTerm = null }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newDebugInfo = `[${timestamp}] ${message}\n`;
    setDebugInfo(prev => prev + newDebugInfo);
    console.log(`[DEBUG] ${message}`);
  };

  const fetchImages = useCallback(async () => {
    addDebugInfo('Starting fetchImages...');
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
        
      addDebugInfo(`Making API request with options: ${JSON.stringify(options)}`);
        
      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options
      }).response;

      const data = await response.body.json();
      addDebugInfo(`Raw response data received: ${JSON.stringify(data).substring(0, 200)}...`);
      
      // Simple parsing - the data.body contains the actual response
      let images = [];
      if (data.body) {
        try {
          const parsedBody = JSON.parse(data.body);
          images = parsedBody.images || [];
          addDebugInfo(`Successfully parsed ${images.length} images from response`);
        } catch (parseError) {
          addDebugInfo(`Parse error: ${parseError.message}`);
          setError('Error parsing response');
          return;
        }
      }
      
      addDebugInfo(`Setting ${images.length} images to state`);
      setImages(images);
      
    } catch (error) {
      addDebugInfo(`Error fetching images: ${error.message}`);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
      addDebugInfo('fetchImages completed');
    }
  }, [searchTerm]);

  const handleDeleteImage = async (imageId) => {
    addDebugInfo(`=== DELETE OPERATION STARTED ===`);
    addDebugInfo(`Image ID to delete: ${imageId}`);
    
    if (!imageId) {
      addDebugInfo('ERROR: No imageId provided for deletion');
      return;
    }

    // Confirm deletion
    addDebugInfo('Showing confirmation dialog...');
    const confirmed = window.confirm('Are you sure you want to delete this image? This action cannot be undone.');
    if (!confirmed) {
      addDebugInfo('User cancelled deletion');
      return;
    }

    addDebugInfo('User confirmed deletion, setting deleting state...');
    setDeletingImageId(imageId);

    try {
      // Get current user
      addDebugInfo('Getting current user...');
      const user = await getCurrentUser();
      const userId = user.username;
      addDebugInfo(`Current user ID: ${userId}`);

      addDebugInfo(`Preparing delete request for image: ${imageId}, user: ${userId}`);

      const deleteRequest = {
        apiName: 'ImageAPI',
        path: '/delete-image',
        options: {
          body: { imageId, userId }
        }
      };
      
      addDebugInfo(`Delete request config: ${JSON.stringify(deleteRequest)}`);

      addDebugInfo('Sending delete request to API...');
      const response = await post(deleteRequest).response;

      addDebugInfo('Delete response received, parsing...');
      const result = await response.body.json();
      addDebugInfo(`Delete response: ${JSON.stringify(result)}`);

      if (result.error) {
        addDebugInfo(`Delete failed with error: ${result.error}`);
        throw new Error(result.error);
      }

      addDebugInfo('Delete successful, updating local state...');
      // Remove the image from the local state
      setImages(prevImages => {
        const newImages = prevImages.filter(img => img.imageId !== imageId);
        addDebugInfo(`Removed image from state. Previous count: ${prevImages.length}, New count: ${newImages.length}`);
        return newImages;
      });
      
      addDebugInfo('Showing success message...');
      alert('Image deleted successfully!');

    } catch (error) {
      addDebugInfo(`ERROR in delete operation: ${error.message}`);
      addDebugInfo(`Error stack: ${error.stack}`);
      alert(`Failed to delete image: ${error.message}`);
    } finally {
      addDebugInfo('Clearing deleting state...');
      setDeletingImageId(null);
      addDebugInfo('=== DELETE OPERATION COMPLETED ===');
    }
  };

  useEffect(() => {
    addDebugInfo('Gallery component mounted, fetching images...');
    fetchImages();
  }, [fetchImages]);

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="loading">Loading images...</div>
        <div className="debug-panel">
          <h3>Debug Info:</h3>
          <pre>{debugInfo}</pre>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-container">
        <div className="error">{error}</div>
        <button onClick={fetchImages} className="retry-button">Retry</button>
        <div className="debug-panel">
          <h3>Debug Info:</h3>
          <pre>{debugInfo}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <h2>{searchTerm ? `Search Results for: "${searchTerm}"` : 'Image Gallery'}</h2>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Debug Info:</strong> Found {images.length} images
      </div>
      
      {/* Debug Panel */}
      <div className="debug-panel">
        <h3>Debug Log:</h3>
        <button 
          onClick={() => setDebugInfo('')} 
          style={{ 
            marginBottom: '10px', 
            padding: '5px 10px', 
            backgroundColor: '#ff9800', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Clear Debug Log
        </button>
        <pre style={{ 
          maxHeight: '200px', 
          overflow: 'auto', 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'pre-wrap'
        }}>
          {debugInfo || 'No debug info yet...'}
        </pre>
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
                    addDebugInfo(`Image failed to load: ${img.url}`);
                    e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                  }}
                  onLoad={() => {
                    addDebugInfo(`Image loaded successfully: ${img.url}`);
                  }}
                />
                {/* Delete button overlay */}
                <button
                  className="delete-button"
                  onClick={() => {
                    addDebugInfo(`Delete button clicked for image: ${img.imageId}`);
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