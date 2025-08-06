import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import './SearchBar.css';

const SearchBar = memo(({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

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
      setIsSearching(true);
      onSearch(debouncedValue);
      // Simulate search completion
      setTimeout(() => setIsSearching(false), 500);
    }
  }, [debouncedValue, onSearch]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // Immediate search on form submit
    if (onSearch) {
      setIsSearching(true);
      onSearch(inputValue.trim());
      // Add to search history
      if (inputValue.trim()) {
        setSearchHistory(prev => {
          const newHistory = [inputValue.trim(), ...prev.filter(item => item !== inputValue.trim())];
          return newHistory.slice(0, 5); // Keep only last 5 searches
        });
      }
      setTimeout(() => setIsSearching(false), 500);
    }
  }, [onSearch, inputValue]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setInputValue('');
    setDebouncedValue('');
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  const handleHistoryItemClick = useCallback((item) => {
    setInputValue(item);
    setDebouncedValue(item);
    if (onSearch) {
      onSearch(item);
    }
    setShowHistory(false);
  }, [onSearch]);

  const handleInputFocus = useCallback(() => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  }, [searchHistory.length]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding history to allow clicks
    setTimeout(() => setShowHistory(false), 200);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowHistory(false);
      inputRef.current?.blur();
    }
  }, []);

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <div className="search-icon">
            {isSearching ? '⏳' : '🔍'}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Filter images by tag..."
            className="search-input"
            aria-label="Search images by tag"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="clear-button"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button 
          type="submit" 
          className="search-button"
          disabled={isSearching}
        >
          {isSearching ? 'Searching...' : 'Filter'}
        </button>
      </form>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="search-history">
          <div className="history-header">
            <span>Recent searches</span>
            <button
              type="button"
              onClick={() => setSearchHistory([])}
              className="clear-history-btn"
            >
              Clear all
            </button>
          </div>
          {searchHistory.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleHistoryItemClick(item)}
              className="history-item"
            >
              <span className="history-icon">🔍</span>
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Search Status */}
      {isSearching && (
        <div className="searching-indicator">
          <div className="searching-spinner"></div>
          <span>Searching...</span>
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;