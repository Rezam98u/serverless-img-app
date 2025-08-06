import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import UploadForm from "./ImgUploader/UploadForm";
import SearchBar from './ImgUploader/SearchBar';
import ImageGallery from './ImgUploader/Gallery';
import AuthForm from './AuthForm';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import './App.css';

const MemoizedUploadForm = memo(UploadForm);
const MemoizedSearchBar = memo(SearchBar);
const MemoizedImageGallery = memo(ImageGallery);

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const galleryRef = useRef();

  useEffect(() => {
    async function checkAuth() {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    if (galleryRef.current && galleryRef.current.fetchAllImages) {
      galleryRef.current.fetchAllImages();
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  if (checkingAuth) return null;
  if (!user) return <AuthForm />;

  return (
    <div className="App">
      <header className="app-header">
        <h1>Serverless Image Hosting & Sharing App</h1>
        <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
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

export default App;