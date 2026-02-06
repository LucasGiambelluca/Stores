import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../atoms/Input';

export interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  image?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  results?: SearchResult[];
  onSearch: (query: string) => void;
  onSelect?: (result: SearchResult) => void;
  onClear?: () => void;
  isLoading?: boolean;
  showResults?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar...',
  results = [],
  onSearch,
  onSelect,
  onClear,
  isLoading = false,
  showResults = true,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
    setIsOpen(value.length > 0);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    setIsOpen(false);
    onClear?.();
  };

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    onSelect?.(result);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <Input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => query.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        leftIcon={<Search size={18} />}
        rightIcon={
          query.length > 0 ? (
            <button
              onClick={handleClear}
              className="hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          ) : undefined
        }
      />

      {/* Results Dropdown */}
      {showResults && isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Buscando...
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                {result.image && (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </p>
                  {result.subtitle && (
                    <p className="text-xs text-gray-500 truncate">
                      {result.subtitle}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
