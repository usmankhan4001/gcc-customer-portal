'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CaretDown, MagnifyingGlass, Check } from '@phosphor-icons/react';
import { COUNTRIES, Country, findCountryByDialCode } from '@/lib/countries';

interface PhoneInputWithCountryProps {
  id?: string;
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PhoneInputWithCountry({
  id = 'phone-input',
  value,
  onChange,
  placeholder = '50 123 4567',
  disabled = false,
  className = '',
}: PhoneInputWithCountryProps) {
  // Default to UAE (+971)
  const defaultCountry = COUNTRIES.find((c) => c.code === 'AE') || COUNTRIES[0];
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state if value is initialized or modified externally
  useEffect(() => {
    if (!value) {
      setNationalNumber('');
      return;
    }
    const matched = findCountryByDialCode(value);
    if (matched) {
      setSelectedCountry(matched);
      const rawNumber = value.slice(matched.dialCode.length).trim();
      setNationalNumber(rawNumber);
    } else {
      setNationalNumber(value.replace(/^\+/, ''));
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    const full = `${country.dialCode}${nationalNumber.replace(/\D/g, '')}`;
    onChange(full);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^\d\s-]/g, '');
    setNationalNumber(clean);
    const digitsOnly = clean.replace(/\D/g, '');
    const full = digitsOnly ? `${selectedCountry.dialCode}${digitsOnly}` : '';
    onChange(full);
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative flex items-center ${className}`} ref={dropdownRef}>
      {/* Country Code Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-xs font-semibold text-gray-800 transition-colors focus:outline-none disabled:opacity-60 shrink-0 h-[38px]"
        aria-label="Select Country Code"
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="font-mono text-gray-700">{selectedCountry.dialCode}</span>
        <CaretDown className="w-3 h-3 text-gray-400" />
      </button>

      {/* National Phone Number Input */}
      <input
        id={id}
        type="tel"
        value={nationalNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono text-gray-900 h-[38px]"
      />

      {/* Searchable Country Code Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 max-h-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <MagnifyingGlass className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or code..."
              className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
              autoFocus
            />
          </div>

          {/* List of Countries */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-primary/5 transition-colors text-xs ${
                      isSelected ? 'bg-primary/10 font-bold text-primary' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="font-mono text-gray-500 text-[11px]">{country.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">No country found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
