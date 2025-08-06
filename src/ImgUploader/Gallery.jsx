import React, { useState, useEffect, useCallback, useMemo, memo, forwardRef, useImperativeHandle } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { get, post } from 'aws-amplify/api';
import './Gallery.css';

// Confirmation Dialog Component
const ConfirmationDialog = memo(({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirmation-actions">
          <button onClick={onCancel} className="cancel-btn">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="confirm-btn">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});

// Lightbox Component
const Lightbox = memo(({ isOpen, image, onClose, onCopyLink }) => {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !image) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>×</button>
        <div className="lightbox-image-container">
          <img 
            src={image.url} 
            alt={image.tags ? image.tags.join(', ') : 'Image'} 
            className="lightbox-image"
            loading="eager"
          />
        </div>
        <div className="lightbox-info">
          <div className="lightbox-details">
            <p><strong>Uploaded:</strong> {new Date(image.uploadDate).toLocaleDateString()}</p>
            {image.tags && image.tags.length > 0 && (
              <p><strong>Tags:</strong> {image.tags.join(', ')}</p>
            )}
            {image.fileName && (
              <p><strong>File:</strong> {image.fileName}</p>
            )}
            {image.fileSize && (
              <p><strong>Size:</strong> {(image.fileSize / 1024 / 1024).toFixed(2)} MB</p>
            )}
          </div>
          <div className="lightbox-actions">
            <button onClick={() => onCopyLink(image.url)} className="lightbox-copy-btn">
              📋 Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Image Card Component
const ImageCard = memo(({ image, onDelete, isDeleting, onImageClick, onImageError }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, [image.url]);

  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    onDelete(image);
  }, [onDelete, image]);

  return (
    <div 
      className={`image-card ${imageError ? 'image-error' : ''}`} 
      onClick={() => onImageClick(image)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            onClick={handleCopyLink}
            className="action-button copy-button"
            title="Copy link"
          >
            📋
          </button>
          <button 
            onClick={handleDeleteClick}
            className="action-button delete-button"
            disabled={isDeleting}
            title="Delete image"
          >
            {isDeleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>
      <div className="image-info">
        <div className="image-tags">
          {image.tags && image.tags.length > 0 ? (
            image.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))
          ) : (
            <span className="no-tags">No tags</span>
          )}
          {image.tags && image.tags.length > 3 && (
            <span className="more-tags">+{image.tags.length - 3}</span>
          )}
        </div>
        <div className="image-date">
          {new Date(image.uploadDate).toLocaleDateString()}
        </div>
        {imageError && (
          <div className="error-status">
            <span className="error-badge">⚠️ Broken Link</span>
          </div>
        )}
      </div>
    </div>
  );
});

// Main Gallery Component
const ImageGallery = memo(forwardRef(({ searchTerm = '' }, ref) => {
  const [allImages, setAllImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingImages, setDeletingImages] = useState(new Set());
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // Filtered images based on search term
  const filteredImages = useMemo(() => {
    if (!searchTerm.trim()) {
      return allImages;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return allImages.filter(image => 
      image.tags && image.tags.some(tag => 
        tag.toLowerCase().includes(searchLower)
      )
    );
  }, [allImages, searchTerm]);

  // Fetch all images for current user
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Defensive: Only proceed if user is authenticated
      const user = await getCurrentUser().catch(() => null);
      if (!user) {
        setLoading(false);
        setAllImages([]);
        setError('You must be signed in to view images.');
        return;
      }
      const userId = user.username;
      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options: {
          queryParams: { userId }
        }
      }).response;
      const data = await response.body.json();
      if (data.images) {
        // Parse body if it's a string
        const images = typeof data.images === 'string' 
          ? JSON.parse(data.images) 
          : data.images;
        // Filter out invalid entries and ensure proper structure
        const validImages = images.filter(img => 
          img && 
          img.imageId && 
          img.imageId !== 'timestamp' && 
          img.imageId !== 'tags' && 
          img.imageId !== 'url' && 
          img.imageId !== 'userId' &&
          img.url &&
          img.uploadDate
        );
        setAllImages(validImages);
      } else {
        setAllImages([]);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images. Please try again.');
      setAllImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete image
  const handleDeleteImage = useCallback(async (image) => {
    setDeletingImages(prev => new Set(prev).add(image.imageId));
    
    try {
      const user = await getCurrentUser();
      const userId = user.username;

      await post({
        apiName: 'ImageAPI',
        path: '/delete-image',
        options: {
          body: { imageId: image.imageId, userId }
        }
      }).response;

      setAllImages(prev => prev.filter(img => img.imageId !== image.imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image. Please try again.');
    } finally {
      setDeletingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.imageId);
        return newSet;
      });
    }
  }, []);

  // Handle delete click
  const handleDeleteClick = useCallback((image) => {
    setImageToDelete(image);
    setShowConfirmation(true);
  }, []);

  // Confirm delete
  const confirmDelete = useCallback(() => {
    if (imageToDelete) {
      handleDeleteImage(imageToDelete);
    }
    setShowConfirmation(false);
    setImageToDelete(null);
  }, [imageToDelete, handleDeleteImage]);

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setShowConfirmation(false);
    setImageToDelete(null);
  }, []);

  // Handle image click
  const handleImageClick = useCallback((image) => {
    setSelectedImage(image);
    setShowLightbox(true);
  }, []);

  // Close lightbox
  const handleCloseLightbox = useCallback(() => {
    setShowLightbox(false);
    setSelectedImage(null);
  }, []);

  // Handle image error
  const handleImageError = useCallback((imageId) => {
    console.log('Image error for:', imageId);
    // Could implement automatic cleanup here
  }, []);

  // Copy link
  const handleCopyLink = useCallback(async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }, []);

  // Cleanup broken images
  const cleanupBrokenImages = useCallback(async () => {
    if (!window.confirm('This will remove all broken image entries from your gallery. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      const user = await getCurrentUser();
      const userId = user.username;

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

      for (const imageId of brokenImages) {
        try {
          await post({
            apiName: 'ImageAPI',
            path: '/delete-image',
            options: { body: { imageId, userId } }
          }).response;
        } catch (error) {
          console.error('Failed to delete broken image:', imageId, error);
        }
      }

      setAllImages(prev => prev.filter(img => !brokenImages.includes(img.imageId)));
      alert(`Cleaned up ${brokenImages.length} broken images!`);
    } catch (error) {
      console.error('Error during cleanup:', error);
      setError('Error during cleanup. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [allImages]);

  // Expose fetchAllImages to parent
  useImperativeHandle(ref, () => ({
    fetchAllImages: fetchImages
  }), [fetchImages]);

  // Load images on mount
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h3>Your Images</h3>
        <div className="gallery-stats">
          <span className="image-count">
            {searchTerm ? `${filteredImages.length} of ${allImages.length}` : allImages.length} images
          </span>
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
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchImages} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-message">
          Loading images...
        </div>
      )}

      {!loading && !error && filteredImages.length === 0 && (
        <div className="no-images">
          {searchTerm ? (
            <p>No images found for "{searchTerm}"</p>
          ) : (
            <p>No images uploaded yet. Start by uploading your first image!</p>
          )}
        </div>
      )}

      <div className="image-grid">
        {filteredImages.map((image) => (
          <ImageCard
            key={image.imageId}
            image={image}
            onDelete={handleDeleteClick}
            isDeleting={deletingImages.has(image.imageId)}
            onImageClick={handleImageClick}
            onImageError={handleImageError}
          />
        ))}
      </div>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <Lightbox
        isOpen={showLightbox}
        image={selectedImage}
        onClose={handleCloseLightbox}
        onCopyLink={handleCopyLink}
      />
    </div>
  );
}));

ImageGallery.displayName = 'ImageGallery';

export default ImageGallery;