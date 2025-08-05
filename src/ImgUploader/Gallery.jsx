import React, { useState, useEffect } from 'react';
import { get } from 'aws-amplify/api';
import './Gallery.css';

function ImageGallery({ searchTerm = null }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, [searchTerm]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options = searchTerm 
        ? { queryStringParameters: { tag: searchTerm } }
        : {};
        
      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options
      }).response;

      const data = await response.body.json();
      console.log('Fetched images:', data);
      
      // Check if the response contains an error
      if (data.errorType || data.errorMessage) {
        console.error('Lambda function error:', data);
        setError('Server error: Please try again later or contact support.');
        return;
      }
      
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      
      {/* Debug button for testing */}
      <button 
        onClick={() => {
          console.log('Testing Lambda function...');
          fetchImages();
        }}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          backgroundColor: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test Lambda Function
      </button>
      
      {images.length === 0 ? (
        <div className="no-images">
          {searchTerm ? 'No images found for this search term.' : 'No images available.'}
        </div>
      ) : (
        <div className="image-grid">
          {images.map((img) => (
            <div key={img.imageId || img.id} className="image-card">
              <div className="image-container">
                <img 
                  src={img.url} 
                  alt={img.tags ? img.tags.join(', ') : 'Image'} 
                  className="gallery-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                  }}
                />
              </div>
              <div className="image-info">
                {img.tags && img.tags.length > 0 && (
                  <div className="tags">
                    {img.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
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