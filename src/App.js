import React, { useState } from 'react';
import { withAuthenticator } from '@aws-amplify/ui-react';
import UploadForm from "./ImgUploader/UploadForm";
import SearchBar from './ImgUploader/SearchBar';
import ImageGallery from './ImgUploader/Gallery';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Serverless Image Hosting & Sharing App</h1>
      </header>
      
      <main className="app-main">
        <section className="upload-section">
          <h2>Upload Images</h2>
          <UploadForm />
        </section>
        
        <section className="search-section">
          <h2>Search & Browse Images</h2>
          <SearchBar onSearch={handleSearch} />
        </section>
        
        <section className="gallery-section">
          <ImageGallery searchTerm={searchTerm} />
        </section>
      </main>
    </div>
  );
}

export default withAuthenticator(App);