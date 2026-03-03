import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search as SearchIcon, Loader2, X } from 'lucide-react';
import COURSES from '../courses.json';
import Fuse from 'fuse.js';

const Search = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);
  const skipNextSearch = useRef(false);

  const fuse = useMemo(() => new Fuse(COURSES, {
    threshold: 0.4, // Slightly more lenient
    distance: 100,
    minMatchCharLength: 1,
    ignoreLocation: true,
  }), []);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const results = fuse.search(trimmed).slice(0, 6).map(r => r.item);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, [query, fuse]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    skipNextSearch.current = true;
    setQuery(item);
    onSearch(item);
    setShowSuggestions(false);
  };

  const getHighlightedText = (text, highlightQuery) => {
    const trimmed = highlightQuery.trim();
    if (!trimmed) return text;

    const terms = trimmed.split(/\s+/)
      .filter(t => t.length > 0)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    
    if (terms.length === 0) return text;

    // Use capturing group to keep the matches in the split array
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          // In a split with one capturing group, matches are always at odd indices
          const isMatch = i % 2 === 1;
          return isMatch ? (
            <span 
              key={i} 
              className="text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </>
    );
  };

  return (
    <div className="relative max-w-2xl mx-auto" ref={containerRef}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            onSearch(query);
            setShowSuggestions(false);
          }
        }} 
        className="relative group"
      >
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-cyan-400 text-slate-500 transition-colors">
          <div className="relative">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <SearchIcon className="w-5 h-5 relative z-10" />
                <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
              </>
            )}
          </div>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Enter university course (e.g., BS Computer Science)..."
          autoComplete="off"
          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all font-medium backdrop-blur-md shadow-inner"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/90 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-5 py-3 hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-50/90 transition-all border-b border-slate-800 last:border-none font-medium text-sm"
            >
              {getHighlightedText(suggestion, query)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
