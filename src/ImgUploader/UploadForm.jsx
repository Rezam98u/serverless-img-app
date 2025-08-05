import React, { useState, useCallback, useRef, memo } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import './UploadForm.css';

const UploadForm = memo(() => {
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setMessage('Please select a valid image file');
        return;
      }
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setMessage('');
    }
  }, []);

  const handleTagsChange = useCallback((e) => {
    setTags(e.target.value);
  }, []);

  const resetForm = useCallback(() => {
    setFile(null);
    setTags('');
    setMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      setMessage('Please select an image');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const user = await getCurrentUser();
      const userId = user.username;

      // Step 1: Get pre-signed URL
      const presignResponse = await post({
        apiName: 'ImageAPI',
        path: '/presign-url',
        options: {
          body: { filename: file.name, userId }
        }
      }).response;

      const { uploadUrl } = await presignResponse.body.json();

      // Step 2: Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      // Step 3: Save metadata
      const imageUrl = uploadUrl.split('?')[0];
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      await post({
        apiName: 'ImageAPI',
        path: '/save-metadata',
        options: {
          body: { 
            imageUrl, 
            tags: tagsArray, 
            userId, 
            timestamp: new Date().toISOString() 
          }
        }
      }).response;

      setMessage('Image uploaded successfully!');
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error uploading image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [file, tags, resetForm]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !loading && file) {
      e.preventDefault();
      handleUpload();
    }
  }, [handleUpload, loading, file]);

  return (
    <div className="upload-form">
      <div className="form-group">
        <label htmlFor="file-input">Select Image:</label>
        <input 
          ref={fileInputRef}
          id="file-input"
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
          aria-label="Select image file"
        />
        {file && (
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
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
        />
      </div>
      
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