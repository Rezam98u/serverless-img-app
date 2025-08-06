import React, { useState, useCallback, memo, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = memo(({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // Immediate search on form submit
    if (onSearch) {
      onSearch(inputValue.trim());
    }
  }, [onSearch, inputValue]);

  const handleClear = useCallback(() => {
    setInputValue('');
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
            placeholder="Filter images by tag..." 
            value={inputValue} 
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="search-input"
            aria-label="Filter images by tag"
          />
          <button 
            type="submit" 
            className="search-button"
            aria-label="Filter images"
          >
            Filter
          </button>
          {inputValue && (
            <button 
              type="button" 
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear filter"
            >
              Clear
            </button>
          )}
        </div>
      </form>
      {inputValue && (
        <div className="current-search">
          <span>Filtering by: <strong>"{inputValue}"</strong></span>
          {inputValue !== debouncedValue && (
            <span className="searching-indicator"> (searching...)</span>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;