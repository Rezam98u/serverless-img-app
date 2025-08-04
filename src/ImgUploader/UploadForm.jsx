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
            tags: tags.split(',').map(t => t.trim()), 
            userId, 
            timestamp: new Date().toISOString() 
          }
        }
      }).response;

      setMessage('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Error uploading image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <input type="file" onChange={handleFileChange} />
      <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={handleTagsChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default UploadForm;