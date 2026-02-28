'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export default function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Search or type...',
  disabled = false,
  label,
  required = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sync searchTerm with value prop
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // If the input is not empty but doesn't match, keep the typed value
        if (searchTerm && searchTerm !== value) {
          onChange(searchTerm);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchTerm, value, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    // Update value as user types
    onChange(newValue);
  };

  const handleOptionClick = (option: string) => {
    setSearchTerm(option);
    onChange(option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault();
      handleOptionClick(filteredOptions[0]);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#dc2626] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-gray-600"
            disabled={disabled}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionClick(option)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                  option.toLowerCase() === searchTerm.toLowerCase()
                    ? 'bg-red-50 text-[#dc2626]'
                    : 'text-gray-900'
                }`}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? (
                <span>
                  No matches found. Press Enter to use &quot;{searchTerm}&quot;
                </span>
              ) : (
                'Start typing to search...'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
