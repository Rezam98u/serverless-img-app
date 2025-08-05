import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import ImageGallery from './Gallery';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserImagesOnly, setShowUserImagesOnly] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    getCurrentUserInfo();
    loadSearchHistory();
  }, []);

  const getCurrentUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('No authenticated user');
      setIsAuthenticated(false);
    }
  };

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('imageSearchHistory') || '[]');
      setSearchHistory(history.slice(0, 5)); // Keep only last 5 searches
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToSearchHistory = useCallback((term) => {
    if (!term.trim() || term.length < 2) return;

    const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 5);
    setSearchHistory(newHistory);
    
    try {
      localStorage.setItem('imageSearchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory]);

  const handleSearch = (term = searchTerm) => {
    const trimmedTerm = term.trim();
    setSearchTerm(trimmedTerm);
    if (trimmedTerm) {
      saveToSearchHistory(trimmedTerm);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('imageSearchHistory');
  };

  const toggleUserFilter = () => {
    if (!isAuthenticated) {
      alert('Please log in to filter your images');
      return;
    }
    setShowUserImagesOnly(!showUserImagesOnly);
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Search Header */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🔍 Search Images
        </h2>

        {/* Main Search Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '15px',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            position: 'relative', 
            flex: '1', 
            minWidth: '250px'
          }}>
            <input
              type="text"
              placeholder="Search by tags, filename, or image ID..."
              value={searchTerm}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
              style={{
                width: '100%',
                padding: '12px 40px 12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            
            {searchTerm && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '4px',
                  borderRadius: '50%'
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => handleSearch()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '15px'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: isAuthenticated ? 'pointer' : 'not-allowed',
            opacity: isAuthenticated ? 1 : 0.5
          }}>
            <input
              type="checkbox"
              checked={showUserImagesOnly}
              onChange={toggleUserFilter}
              disabled={!isAuthenticated}
              style={{ 
                transform: 'scale(1.2)',
                cursor: isAuthenticated ? 'pointer' : 'not-allowed'
              }}
            />
            <span style={{ fontSize: '14px', color: '#495057' }}>
              My images only
            </span>
          </label>

          {isAuthenticated && currentUser && (
            <span style={{ 
              fontSize: '12px', 
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              👤 {currentUser.username}
            </span>
          )}

          {!isAuthenticated && (
            <span style={{ 
              fontSize: '12px', 
              color: '#dc3545',
              fontStyle: 'italic'
            }}>
              Log in to filter your images
            </span>
          )}
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '15px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ 
                fontSize: '14px', 
                color: '#6c757d',
                fontWeight: '500'
              }}>
                Recent searches:
              </span>
              <button
                onClick={clearSearchHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Clear history
              </button>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap'
            }}>
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(term)}
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    color: '#495057',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#e9ecef';
                    e.target.style.borderColor = '#adb5bd';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.borderColor = '#dee2e6';
                  }}
                >
                  🔍 {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Tips */}
        <div style={{ 
          borderTop: '1px solid #e9ecef', 
          paddingTop: '15px',
          fontSize: '12px',
          color: '#6c757d'
        }}>
          <strong>💡 Search tips:</strong> 
          <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
            <li>Search by tags (e.g., "nature", "portrait")</li>
            <li>Search by filename (e.g., "vacation")</li>
            <li>Use multiple words to narrow results</li>
            <li>Toggle "My images only" to see just your uploads</li>
          </ul>
        </div>
      </div>

      {/* Search Results */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {debouncedSearchTerm && (
          <div style={{ 
            padding: '12px 20px',
            backgroundColor: '#e7f3ff',
            borderBottom: '1px solid #b3d9ff',
            fontSize: '14px',
            color: '#0066cc'
          }}>
            🔍 Searching for: "<strong>{debouncedSearchTerm}</strong>"
            {showUserImagesOnly && ' in your images'}
          </div>
        )}
        
        <ImageGallery 
          searchTerm={debouncedSearchTerm}
          showUserImagesOnly={showUserImagesOnly}
        />
      </div>
    </div>
  );
}

export default SearchBar;