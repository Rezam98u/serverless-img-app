import React, { useState, useCallback, memo } from 'react';
import './SearchBar.css';

const SearchBar = memo(({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  }, [onSearch, searchTerm]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  const handleInputChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  }, [handleSearch]);

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input 
            type="text" 
            placeholder="Search images by tag..." 
            value={searchTerm} 
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="search-input"
            aria-label="Search images by tag"
          />
          <button 
            type="submit" 
            className="search-button"
            aria-label="Search images"
          >
            Search
          </button>
          {searchTerm && (
            <button 
              type="button" 
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;