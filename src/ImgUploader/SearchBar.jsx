import React, { useState } from 'react';
import { API } from '../aws-exports';
import ImageGallery from './Gallery';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await API.get('ImageAPI', '/search-images', {
        queryStringParameters: { tag: searchTerm },
      });
      setImages(response.images || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div>
      <h2>Search Images</h2>
      <input type="text" placeholder="Search by tag" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <button onClick={handleSearch}>Search</button>
      <ImageGallery images={images} />
    </div>
  );
}

export default SearchBar;