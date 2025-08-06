import React, { useState, useCallback, memo, useRef, useEffect, Suspense } from 'react';
import UploadForm from "./ImgUploader/UploadForm";
import SearchBar from './ImgUploader/SearchBar';
import ImageGallery from './ImgUploader/Gallery';
import AuthForm from './AuthForm';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

// Memoized components
const MemoizedUploadForm = memo(UploadForm);
const MemoizedSearchBar = memo(SearchBar);
const MemoizedImageGallery = memo(ImageGallery);

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const galleryRef = useRef();

  // Check authentication status
  const checkAuth = useCallback(async () => {
    setCheckingAuth(true);
    setAuthError(null);
    
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // console.log('User not authenticated:', error);
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  // Initialize auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle search
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Handle upload success
  const handleUploadSuccess = useCallback(() => {
    if (galleryRef.current && galleryRef.current.fetchAllImages) {
      galleryRef.current.fetchAllImages();
    }
  }, []);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await signOut();
      setUser(null);
      setSearchTerm('');
      // Clear gallery images if ref is available
      if (galleryRef.current) {
        if (galleryRef.current.fetchAllImages) {
          // Optionally, set gallery to empty state
          galleryRef.current.fetchAllImages = () => {};
        }
        if (galleryRef.current.setAllImages) {
          galleryRef.current.setAllImages([]);
        }
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut]);

  // Handle auth success
  const handleAuthSuccess = useCallback(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading state
  if (checkingAuth) {
    return <LoadingSpinner />;
  }

  // Show auth error
  if (authError) {
    return (
      <div className="auth-error">
        <h2>Authentication Error</h2>
        <p>{authError}</p>
        <button onClick={checkAuth} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user) {
    return (
      <ErrorBoundary>
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </ErrorBoundary>
    );
  }

  // Main app interface
  return (
    <ErrorBoundary>
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1>Serverless Image Hosting & Sharing App</h1>
            <div className="user-info">
              {/* <span className="user-email">{user.username}</span> */}
              <button 
                className="signout-btn" 
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </header>
        
        <main className="app-main">
          <Suspense fallback={<LoadingSpinner />}>
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
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;