import React, { useState, useEffect, useCallback, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import { get, post } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import './Gallery.css';

const ImageCard = memo(({ image, onDelete, isDeleting, onImageClick, onImageError }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback((e) => {
    console.log('Image failed to load:', image.url);
    setImageError(true);
    if (onImageError) {
      onImageError(image.imageId);
    }
    e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
  }, [image.url, image.imageId, onImageError]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    onDelete(image.imageId);
  }, [onDelete, image.imageId]);

  const handleCopyLink = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(image.url);
      alert('Image link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link');
    }
  }, [image.url]);

  const formatDate = useMemo(() => {
    return image.uploadDate ? new Date(image.uploadDate).toLocaleDateString() : '';
  }, [image.uploadDate]);

  return (
    <div className={`image-card ${imageError ? 'image-error' : ''}`} onClick={() => onImageClick(image)}>
      <div className="image-container">
        <img 
          src={image.url} 
          alt={image.tags ? image.tags.join(', ') : 'Image'} 
          className="gallery-image"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
        {imageError && (
          <div className="image-error-overlay">
            <div className="error-message">
              <p>⚠️ Image not found</p>
              <small>File may have been deleted</small>
            </div>
          </div>
        )}
        <div className="image-actions">
          <button
            className="action-button copy-button"
            onClick={handleCopyLink}
            title="Copy image link"
            aria-label="Copy image link"
          >
            📋
          </button>
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
        {imageError && (
          <div className="error-status">
            <span className="error-badge">⚠️ Broken Link</span>
          </div>
        )}
      </div>
    </div>
  );
});

ImageCard.displayName = 'ImageCard';

const Lightbox = memo(({ isOpen, image, onClose }) => {
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(image?.url || '');
      alert('Image link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link');
    }
  }, [image?.url]);

  const formatDate = useMemo(() => {
    return image?.uploadDate ? new Date(image.uploadDate).toLocaleDateString() : '';
  }, [image?.uploadDate]);

  if (!isOpen || !image) return null;

  return (
    <div className="lightbox-overlay" onClick={handleBackdropClick}>
      <div className="lightbox-content">
        <button className="lightbox-close" onClick={onClose}>×</button>
        <div className="lightbox-image-container">
          <img 
            src={image.url} 
            alt={image.tags ? image.tags.join(', ') : 'Image'} 
            className="lightbox-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
            }}
          />
        </div>
        <div className="lightbox-info">
          <div className="lightbox-actions">
            <button onClick={handleCopyLink} className="lightbox-copy-btn">
              📋 Copy Link
            </button>
          </div>
          <div className="lightbox-details">
            <p><strong>ID:</strong> {image.imageId}</p>
            {image.tags && image.tags.length > 0 && (
              <p><strong>Tags:</strong> {image.tags.join(', ')}</p>
            )}
            {formatDate && (
              <p><strong>Uploaded:</strong> {formatDate}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Lightbox.displayName = 'Lightbox';

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
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

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

  const handleImageClick = useCallback((image) => {
    setLightboxImage(image);
    setShowLightbox(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setShowLightbox(false);
    setLightboxImage(null);
  }, []);

  const handleImageError = useCallback((imageId) => {
    console.log('Image error detected for:', imageId);
    // You could optionally remove broken images from the list
    // setAllImages(prev => prev.filter(img => img.imageId !== imageId));
  }, []);

  const cleanupBrokenImages = useCallback(async () => {
    if (!window.confirm('This will remove all broken image entries from your gallery. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const user = await getCurrentUser();
      const userId = user.username;

      // Get all images and check which ones are broken
      const brokenImages = [];
      
      for (const image of allImages) {
        try {
          const response = await fetch(image.url, { method: 'HEAD' });
          if (!response.ok) {
            brokenImages.push(image.imageId);
          }
        } catch (error) {
          brokenImages.push(image.imageId);
        }
      }

      if (brokenImages.length === 0) {
        alert('No broken images found!');
        return;
      }

      // Delete broken images from database
      for (const imageId of brokenImages) {
        try {
          const deleteRequest = {
            apiName: 'ImageAPI',
            path: '/delete-image',
            options: {
              body: { imageId, userId }
            }
          };
          
          await post(deleteRequest).response;
        } catch (error) {
          console.error('Failed to delete broken image:', imageId, error);
        }
      }

      // Remove broken images from local state
      setAllImages(prev => prev.filter(img => !brokenImages.includes(img.imageId)));
      
      alert(`Cleaned up ${brokenImages.length} broken images!`);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('Error during cleanup. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [allImages]);

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
        {!searchTerm && allImages.length > 0 && (
          <button 
            onClick={cleanupBrokenImages}
            className="cleanup-button"
            disabled={loading}
          >
            🧹 Cleanup Broken Images
          </button>
        )}
      </div>
      
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        imageId={imageToDelete}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <Lightbox
        isOpen={showLightbox}
        image={lightboxImage}
        onClose={handleCloseLightbox}
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
              onImageClick={handleImageClick}
              onImageError={handleImageError}
            />
          ))}
        </div>
      )}
    </div>
  );
}));

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;