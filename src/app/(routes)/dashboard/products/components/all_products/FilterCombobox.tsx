'use client';

import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiX, FiSearch } from 'react-icons/fi';

interface FilterComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  allOptionLabel?: string;
}

export default function FilterCombobox({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  allOptionLabel = 'All',
}: FilterComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get display label for current value
  const getDisplayLabel = () => {
    if (value === 'all') return allOptionLabel;
    const option = options.find((opt) => opt.value === value);
    return option?.label || value;
  };

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('all');
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0].value);
    }
  };

  return (
    <div ref={containerRef} className="relative min-w-[180px]">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-full flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm hover:border-gray-400 focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] focus:outline-none"
      >
        <span className={value === 'all' ? 'text-gray-500' : 'text-gray-900'}>
          {getDisplayLabel()}
        </span>
        <div className="flex items-center gap-1">
          {value !== 'all' && (
            <span
              role="button"
              onClick={handleClear}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <FiX className="h-3.5 w-3.5" />
            </span>
          )}
          <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] focus:outline-none"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto py-1">
            {/* All option */}
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                value === 'all' ? 'bg-red-50 text-[#dc2626] font-medium' : 'text-gray-900'
              }`}
            >
              {allOptionLabel}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                    option.value === value ? 'bg-red-50 text-[#dc2626] font-medium' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
