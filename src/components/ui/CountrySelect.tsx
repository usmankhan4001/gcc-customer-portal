'use client';

import React from 'react';
import { COUNTRIES } from '@/lib/countries';

interface CountrySelectProps {
  id?: string;
  value: string;
  onChange: (countryName: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function CountrySelect({
  id = 'country-select',
  value,
  onChange,
  disabled = false,
  className = '',
}: CountrySelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-900"
      >
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.name}>
            {country.flag} {country.name}
          </option>
        ))}
      </select>
    </div>
  );
}
