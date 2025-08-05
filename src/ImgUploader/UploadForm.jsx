import React, { useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import './UploadForm.css';

function UploadForm() {
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleTagsChange = (e) => setTags(e.target.value);

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select an image');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // ✅ Updated for Amplify v6
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
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // Step 3: Save metadata
      const imageUrl = uploadUrl.split('?')[0];
      await post({
        apiName: 'ImageAPI',
        path: '/save-metadata',
        options: {
          body: { 
            imageUrl, 
            tags: tags.split(',').map(t => t.trim()).filter(t => t), 
            userId, 
            timestamp: new Date().toISOString() 
          }
        }
      }).response;

      setMessage('Image uploaded successfully!');
      setFile(null);
      setTags('');
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Error uploading image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-form">
      <div className="form-group">
        <label htmlFor="file-input">Select Image:</label>
        <input 
          id="file-input"
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        {file && (
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
            Selected: {file.name}
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
        />
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={loading || !file}
        className="upload-button"
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
}

export default UploadForm;