import React, { useState, useCallback, memo, useRef } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import UploadForm from "./ImgUploader/UploadForm";
import SearchBar from './ImgUploader/SearchBar';
import ImageGallery from './ImgUploader/Gallery';
import './App.css';

// Memoized components to prevent unnecessary re-renders
const MemoizedUploadForm = memo(UploadForm);
const MemoizedSearchBar = memo(SearchBar);
const MemoizedImageGallery = memo(ImageGallery);

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const galleryRef = useRef();

  // Memoized callback to prevent unnecessary re-renders
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Callback to refresh gallery after upload
  const handleUploadSuccess = useCallback(() => {
    if (galleryRef.current && galleryRef.current.fetchAllImages) {
      galleryRef.current.fetchAllImages();
    }
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Serverless Image Hosting & Sharing App</h1>
      </header>
      
      <main className="app-main">
        <section className="upload-section">
          <h2>Upload Images</h2>
          <MemoizedUploadForm onUploadSuccess={handleUploadSuccess} />
        </section>
        
        <section className="search-section">
          <h2>Search & Browse Images</h2>
          <MemoizedSearchBar onSearch={handleSearch} />
        </section>
        
        <section className="gallery-section">
          <MemoizedImageGallery ref={galleryRef} searchTerm={searchTerm} />
        </section>
      </main>
    </div>
  );
}

export default withAuthenticator(App);