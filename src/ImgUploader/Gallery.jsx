import React, { useState, useEffect } from 'react';
import { API } from '../aws-exports';

function ImageGallery() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await API.get('ImageAPI', '/search-images', {});
      setImages(response.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  return (
    <div>
      <h2>Image Gallery</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {images.map((img) => (
          <div key={img.imageId}>
            <a href={img.url} target="_blank" rel="noopener noreferrer">
              <img src={img.url} alt={img.tags.join(', ')} style={{ width: '100%', height: 'auto' }} />
            </a>
            <p>Tags: {img.tags.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageGallery;