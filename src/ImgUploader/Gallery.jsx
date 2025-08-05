import React, { useState, useEffect, useMemo } from 'react';
import { get } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';

function ImageGallery({ searchTerm = '', showUserImagesOnly = false, onImageSelect = null }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    getCurrentUserInfo();
    fetchImages();
  }, []);

  useEffect(() => {
    if (searchTerm || showUserImagesOnly) {
      handleSearch();
    } else {
      fetchImages();
    }
  }, [searchTerm, showUserImagesOnly, currentUser]);

  const getCurrentUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.log('No authenticated user');
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = {};
      if (showUserImagesOnly && currentUser) {
        queryParams.userId = currentUser.username;
      }

      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options: {
          queryStringParameters: queryParams
        }
      }).response;

      if (response.statusCode !== 200) {
        throw new Error(`Server error: ${response.statusCode}`);
      }

      const data = await response.body.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm && !showUserImagesOnly) {
      fetchImages();
      return;
    }

    setLoading(true);
    setError('');
    try {
      const queryParams = {};
      if (searchTerm) {
        queryParams.tag = searchTerm;
      }
      if (showUserImagesOnly && currentUser) {
        queryParams.userId = currentUser.username;
      }

      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options: {
          queryStringParameters: queryParams
        }
      }).response;

      if (response.statusCode !== 200) {
        throw new Error(`Server error: ${response.statusCode}`);
      }

      const data = await response.body.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter images on the frontend as well for instant feedback
  const filteredImages = useMemo(() => {
    if (!searchTerm) return images;
    
    return images.filter(image => {
      const searchLower = searchTerm.toLowerCase();
      return (
        image.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        image.originalFilename?.toLowerCase().includes(searchLower) ||
        image.imageId?.toLowerCase().includes(searchLower)
      );
    });
  }, [images, searchTerm]);

  const handleImageClick = (image) => {
    if (onImageSelect) {
      onImageSelect(image);
    } else {
      setSelectedImage(image);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-block', 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '10px', color: '#666' }}>Loading images...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '4px',
        margin: '20px 0'
      }}>
        <h3>Error</h3>
        <p>{error}</p>
        <button 
          onClick={fetchImages}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Header with controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h2 style={{ margin: '0', color: '#333' }}>
            {showUserImagesOnly ? 'My Images' : 'Image Gallery'}
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
            {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} found
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {viewMode === 'grid' ? '📋 List' : '🎛️ Grid'}
          </button>
          
          <button
            onClick={fetchImages}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Images display */}
      {filteredImages.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#666'
        }}>
          <h3>No images found</h3>
          <p>
            {searchTerm 
              ? `No images match "${searchTerm}". Try a different search term.`
              : 'No images have been uploaded yet.'
            }
          </p>
        </div>
      ) : (
        <div style={viewMode === 'grid' ? gridStyles : listStyles}>
          {filteredImages.map((image) => (
            <div 
              key={image.imageId} 
              style={viewMode === 'grid' ? imageCardStyles : listItemStyles}
              onClick={() => handleImageClick(image)}
            >
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={image.url} 
                  alt={image.tags?.join(', ') || 'Uploaded image'}
                  style={viewMode === 'grid' ? imageStyles : listImageStyles}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8f9fa',
                  color: '#666',
                  fontSize: '14px',
                  height: viewMode === 'grid' ? '200px' : '80px',
                  border: '2px dashed #dee2e6'
                }}>
                  🖼️ Image not available
                </div>
              </div>
              
              <div style={{ padding: viewMode === 'grid' ? '12px' : '0 12px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#333'
                }}>
                  {image.originalFilename || image.imageId}
                </div>
                
                {image.tags && image.tags.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    {image.tags.map((tag, index) => (
                      <span 
                        key={index}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#e9ecef',
                          color: '#495057',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          marginRight: '4px',
                          marginBottom: '4px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6c757d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  <span>{formatDate(image.timestamp)}</span>
                  {image.size && <span>{formatFileSize(image.size)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid #dee2e6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{selectedImage.originalFilename}</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '30px',
                    height: '30px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <img 
                src={selectedImage.url} 
                alt={selectedImage.tags?.join(', ') || 'Full size image'}
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  maxHeight: '60vh',
                  objectFit: 'contain'
                }}
              />
              <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                <p><strong>Upload Date:</strong> {formatDate(selectedImage.timestamp)}</p>
                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <p><strong>Tags:</strong> {selectedImage.tags.join(', ')}</p>
                )}
                {selectedImage.size && (
                  <p><strong>File Size:</strong> {formatFileSize(selectedImage.size)}</p>
                )}
                <p><strong>Image ID:</strong> {selectedImage.imageId}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const gridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '20px'
};

const listStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const imageCardStyles = {
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
  }
};

const listItemStyles = {
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  transition: 'box-shadow 0.2s ease'
};

const imageStyles = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  transition: 'transform 0.2s ease'
};

const listImageStyles = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '4px',
  margin: '12px'
};

export default ImageGallery;