import React, { useState, useCallback, memo } from 'react';
import './SearchBar.css';

const SearchBar = memo(({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const searchTerm = inputValue.trim();
    setCurrentSearch(searchTerm);
    if (onSearch) {
      onSearch(searchTerm);
    }
  }, [onSearch, inputValue]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setCurrentSearch('');
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
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
            value={inputValue} 
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
          {(inputValue || currentSearch) && (
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
      {currentSearch && (
        <div className="current-search">
          <span>Current search: <strong>"{currentSearch}"</strong></span>
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;