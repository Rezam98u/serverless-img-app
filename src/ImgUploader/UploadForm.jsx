import React, { useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';

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
      
      console.log('User ID:', userId);

      // Prepare request body with all required fields
      const requestBody = {
        filename: file.name,
        userId: userId,
        contentType: file.type || 'image/jpeg'
      };
      
      console.log('Sending request body:', requestBody);

      // Step 1: Get pre-signed URL
      const presignResponse = await post({
        apiName: 'ImageAPI',
        path: '/presign-url',
        options: {
          body: requestBody,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      }).response;

      console.log('Full presign response:', presignResponse);

      if (presignResponse.statusCode !== 200) {
        const errorText = await presignResponse.body.text();
        throw new Error(`Invalid response from server: ${errorText}`);
      }

      const responseData = await presignResponse.body.json();
      console.log('Response data:', responseData);
      
      const { uploadUrl, imageId } = responseData;

      if (!uploadUrl) {
        throw new Error('No upload URL received from server');
      }

      console.log('Upload URL received:', uploadUrl);

      // Step 2: Upload to S3
      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 
          'Content-Type': file.type || 'image/jpeg'
        },
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
      }

      console.log('S3 upload successful');

      // Step 3: Save metadata
      const imageUrl = uploadUrl.split('?')[0];
      const metadataResponse = await post({
        apiName: 'ImageAPI',
        path: '/save-metadata',
        options: {
          body: { 
            imageUrl, 
            imageId,
            tags: tags.split(',').map(t => t.trim()).filter(t => t), 
            userId, 
            timestamp: new Date().toISOString() 
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      }).response;

      if (metadataResponse.statusCode !== 200) {
        console.warn('Metadata save failed, but image was uploaded successfully');
      }

      setMessage('Image uploaded successfully!');
      setFile(null);
      setTags('');
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error uploading image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Upload Image</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="file-input" style={{ display: 'block', marginBottom: '5px' }}>
          Select Image:
        </label>
        <input 
          id="file-input"
          type="file" 
          accept="image/*"
          onChange={handleFileChange} 
          style={{ width: '100%', padding: '8px' }}
        />
        {file && (
          <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="tags-input" style={{ display: 'block', marginBottom: '5px' }}>
          Tags (comma-separated):
        </label>
        <input 
          id="tags-input"
          type="text" 
          placeholder="nature, landscape, photo" 
          value={tags} 
          onChange={handleTagsChange}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <button 
        onClick={handleUpload} 
        disabled={loading || !file}
        style={{
          backgroundColor: loading || !file ? '#ccc' : '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !file ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default UploadForm;