import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchLocations, type SardegnaLocation } from '../../data/sardegnaLocations';

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: SardegnaLocation) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const TYPE_ICONS: Record<string, string> = {
  airport: '✈',
  port: '⚓',
  city: '●',
  town: '○',
  resort: '◆',
};

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Cerca località...',
  label,
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SardegnaLocation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    const matches = searchLocations(text);
    setResults(matches);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }, []);

  const handleSelect = useCallback((location: SardegnaLocation) => {
    setQuery(location.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange(location);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    const matches = searchLocations(query);
    setResults(matches);
    setIsOpen(true);
  }, [query]);

  const handleBlur = useCallback(() => {
    // Delay to allow click on dropdown item
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [isOpen, results, highlightedIndex, handleSelect]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors text-sm"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      />

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
          role="listbox"
        >
          {results.map((loc, index) => (
            <button
              key={loc.id}
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelect(loc)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-sm ${
                index === highlightedIndex
                  ? 'bg-white/10 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="text-gray-500 text-xs w-4 text-center flex-shrink-0">
                {TYPE_ICONS[loc.type] || '○'}
              </span>
              <span className="flex-1">{loc.label}</span>
              <span className="text-gray-600 text-xs">{loc.province}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
