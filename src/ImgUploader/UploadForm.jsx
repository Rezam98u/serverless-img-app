import React, { useState, useCallback, useRef, memo } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import './UploadForm.css';

const UploadForm = memo(({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const fileInputRef = useRef(null);

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp'
  ];

  const validateFile = useCallback((selectedFile) => {
    const errors = [];
    
    // File type validation
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      errors.push(`File type not supported. Allowed: ${ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}`);
    }
    
    // File size validation
    if (selectedFile.size > MAX_FILE_SIZE) {
      errors.push(`File size must be less than ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // File name validation
    if (selectedFile.name.length > 100) {
      errors.push('File name too long (max 100 characters)');
    }
    
    // Check for potentially malicious file names
    const dangerousPatterns = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousPatterns.test(selectedFile.name)) {
      errors.push('File name contains invalid characters');
    }
    
    return errors;
  }, []);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const errors = validateFile(selectedFile);
      
      if (errors.length > 0) {
        setMessage(`Validation errors: ${errors.join(', ')}`);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setFile(selectedFile);
      setMessage('');
      setUploadProgress(0);
      setUploadStage('');
    }
  }, [validateFile]);

  const handleTagsChange = useCallback((e) => {
    const value = e.target.value;
    // Limit tag input length
    if (value.length <= 200) {
      setTags(value);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFile(null);
    setTags('');
    setMessage('');
    setUploadProgress(0);
    setUploadStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Normalize tags: lowercase, trim, remove duplicates, limit count
  const normalizeTags = useCallback((tagString) => {
    return tagString
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length <= 20) // Max 20 chars per tag
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, 10); // Max 10 tags
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      setMessage('Please select an image');
      return;
    }

    setLoading(true);
    setMessage('');
    setUploadProgress(0);
    setUploadStage('Preparing upload...');

    try {
      const user = await getCurrentUser();
      const userId = user.username;

      // Step 1: Get pre-signed URL
      setUploadStage('Getting upload URL...');
      setUploadProgress(10);
      
      const presignResponse = await post({
        apiName: 'ImageAPI',
        path: '/presign-url',
        options: {
          body: { 
            filename: file.name, 
            userId,
            contentType: file.type,
            fileSize: file.size
          }
        }
      }).response;

      const { uploadUrl } = await presignResponse.body.json();

      // Step 2: Upload to S3 with progress tracking
      setUploadStage('Uploading to cloud...');
      setUploadProgress(30);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 
          'Content-Type': file.type,
          'Content-Length': file.size
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      setUploadProgress(70);
      setUploadStage('Saving metadata...');

      // Step 3: Save metadata with normalized tags
      const imageUrl = uploadUrl.split('?')[0];
      const normalizedTags = normalizeTags(tags);
      
      await post({
        apiName: 'ImageAPI',
        path: '/save-metadata',
        options: {
          body: { 
            imageUrl, 
            tags: normalizedTags, 
            userId, 
            timestamp: new Date().toISOString(),
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type
          }
        }
      }).response;

      setUploadProgress(100);
      setUploadStage('Upload complete!');
      
      setMessage('Image uploaded successfully!');
      resetForm();
      
      // Notify parent component to refresh gallery
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStage('');
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error uploading image: ${error.message}`);
      setUploadProgress(0);
      setUploadStage('');
    } finally {
      setLoading(false);
    }
  }, [file, tags, resetForm, onUploadSuccess, normalizeTags]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !loading && file) {
      e.preventDefault();
      handleUpload();
    }
  }, [handleUpload, loading, file]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const errors = validateFile(droppedFile);
      
      if (errors.length > 0) {
        setMessage(`Validation errors: ${errors.join(', ')}`);
        return;
      }
      
      setFile(droppedFile);
      setMessage('');
      setUploadProgress(0);
      setUploadStage('');
    }
  }, [validateFile]);

  return (
    <div className="upload-form">
      <div className="form-group">
        <label htmlFor="file-input">Select Image:</label>
        <div 
          className="file-drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            id="file-input"
            type="file" 
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
            aria-label="Select image file"
          />
          <div className="drop-zone-text">
            <p>📁 Drag & drop an image here or click to browse</p>
            <small>Supported: JPG, PNG, GIF, WebP, BMP (max 10MB)</small>
          </div>
        </div>
        {file && (
          <div className="file-info">
            <p>📎 Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            <p>📋 Type: {file.type}</p>
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="tags-input">Tags (comma-separated):</label>
        <input 
          id="tags-input"
          type="text" 
          placeholder="e.g., nature, landscape, sunset" 
          value={tags} 
          onChange={handleTagsChange}
          onKeyPress={handleKeyPress}
          aria-label="Enter image tags"
          maxLength="200"
        />
        <small style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
          Tags will be automatically converted to lowercase for better search (max 10 tags, 20 chars each)
        </small>
        {tags && (
          <div className="tag-preview">
            <small>Preview: {normalizeTags(tags).join(', ')}</small>
          </div>
        )}
      </div>
      
      {uploadProgress > 0 && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="progress-text">{uploadStage}</p>
        </div>
      )}
      
      <button 
        onClick={handleUpload} 
        disabled={loading || !file}
        className="upload-button"
        aria-label={loading ? 'Uploading image...' : 'Upload image'}
      >
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>
      
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
});

UploadForm.displayName = 'UploadForm';

export default UploadForm;