import React, { useState } from 'react';
import { get } from 'aws-amplify/api';
import ImageGallery from './Gallery';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await get({
        apiName: 'ImageAPI',
        path: '/search-images',
        options: {
          queryStringParameters: { tag: searchTerm }
        }
      }).response;

      const data = await response.body.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div>
      <h2>Search Images</h2>
      <input 
        type="text" 
        placeholder="Search by tag" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      <button onClick={handleSearch}>Search</button>
      <ImageGallery images={images} />
    </div>
  );
}

export default SearchBar;