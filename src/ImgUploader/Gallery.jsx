import React, { useState, useEffect, useCallback, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import './Gallery.css';

const ImageCard = memo(({ image, onDelete, isDeleting }) => {
  const handleImageError = useCallback((e) => {
    e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
  }, []);

  const handleDeleteClick = useCallback(() => {
    onDelete(image.imageId);
  }, [onDelete, image.imageId]);

  const formatDate = useMemo(() => {
    return image.uploadDate ? new Date(image.uploadDate).toLocaleDateString() : '';
  }, [image.uploadDate]);

  return (
    <div className="image-card">
      <div className="image-container">
        <img 
          src={image.url} 
          alt={image.tags ? image.tags.join(', ') : 'Image'} 
          className="gallery-image"
          onError={handleImageError}
          loading="lazy"
        />
        <button
          className="delete-button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          title="Delete image"
          aria-label="Delete image"
        >
          {isDeleting ? 'Deleting...' : '×'}
        </button>
      </div>
      <div className="image-info">
        <div className="image-id">ID: {image.imageId}</div>
        {image.tags && image.tags.length > 0 && (
          <div className="tags">
            {image.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
        {formatDate && (
          <div className="upload-date">
            Uploaded: {formatDate}
          </div>
        )}
      </div>
    </div>
  );
});

ImageCard.displayName = 'ImageCard';

const ConfirmationDialog = memo(({ isOpen, imageId, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete this image?</p>
        <p className="image-id">Image ID: {imageId}</p>
        <p className="warning">This action cannot be undone.</p>
        <div className="dialog-buttons">
          <button 
            onClick={onConfirm}
            className="confirm-button"
          >
            Yes, Delete
          </button>
          <button 
            onClick={onCancel}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmationDialog.displayName = 'ConfirmationDialog';

const ImageGallery = memo(forwardRef(({ searchTerm = '' }, ref) => {
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  const fetchAllImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user ID
      const user = await getCurrentUser();
      const userId = user.username;

      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options: {
          queryStringParameters: { userId }
        }
      }).response;

      const data = await response.body.json();
      
      let images = [];
      if (data.body) {
        try {
          const parsedBody = JSON.parse(data.body);
          images = parsedBody.images || [];
        } catch (parseError) {
          console.error('Parse error:', parseError);
          setError('Error parsing response');
          return;
        }
      }
      
      setAllImages(images);
      
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to fetch images. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Expose fetchAllImages method to parent component
  useImperativeHandle(ref, () => ({
    fetchAllImages
  }), [fetchAllImages]);

  const handleDeleteClick = useCallback((imageId) => {
    setImageToDelete(imageId);
    setShowConfirmDialog(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!imageToDelete) return;
    
    setShowConfirmDialog(false);
    setDeletingImageId(imageToDelete);

    try {
      const user = await getCurrentUser();
      const userId = user.username;

      const deleteRequest = {
        apiName: 'ImageAPI',
        path: '/delete-image',
        options: {
          body: { imageId: imageToDelete, userId }
        }
      };
      
      const response = await post(deleteRequest).response;
      const result = await response.body.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setAllImages(prevImages => 
        prevImages.filter(img => img.imageId !== imageToDelete)
      );
      
      alert('Image deleted successfully!');

    } catch (error) {
      console.error('Error deleting image:', error);
      alert(`Failed to delete image: ${error.message}`);
    } finally {
      setDeletingImageId(null);
      setImageToDelete(null);
    }
  }, [imageToDelete]);

  const cancelDelete = useCallback(() => {
    setShowConfirmDialog(false);
    setImageToDelete(null);
  }, []);

  // Load all images on component mount
  useEffect(() => {
    fetchAllImages();
  }, [fetchAllImages]);

  // Filter images based on search term
  const filteredImages = useMemo(() => {
    let images = allImages.filter(img => 
      img.url && 
      img.url.trim() !== '' && 
      img.imageId && 
      img.imageId !== 'timestamp' && 
      img.imageId !== 'tags' && 
      img.imageId !== 'url' && 
      img.imageId !== 'userId'
    );

    // If there's a search term, filter by tag
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.trim().toLowerCase();
      images = images.filter(img => 
        img.tags && 
        img.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        )
      );
    }

    return images;
  }, [allImages, searchTerm]);

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
        <button onClick={fetchAllImages} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <h2>
        {searchTerm && searchTerm.trim() !== '' 
          ? `Search Results for: "${searchTerm}"` 
          : 'Your Image Gallery'
        }
      </h2>
      
      <div className="gallery-stats">
        <strong>
          {searchTerm && searchTerm.trim() !== '' 
            ? `Found ${filteredImages.length} images with tag "${searchTerm}"`
            : `Showing ${filteredImages.length} images`
          }
        </strong>
      </div>
      
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        imageId={imageToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      
      {filteredImages.length === 0 ? (
        <div className="no-images">
          {searchTerm && searchTerm.trim() !== '' 
            ? `No images found with tag: "${searchTerm}"` 
            : 'No images uploaded yet. Upload your first image above!'
          }
        </div>
      ) : (
        <div className="image-grid">
          {filteredImages.map((image) => (
            <ImageCard
              key={image.imageId}
              image={image}
              onDelete={handleDeleteClick}
              isDeleting={deletingImageId === image.imageId}
            />
          ))}
        </div>
      )}
    </div>
  );
}));

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;