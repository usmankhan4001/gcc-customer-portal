'use client';

import React from 'react';

export type CountryCode = 'uae' | 'hk' | 'singapore' | 'bahrain' | 'ireland' | 'oman';

interface CountryFlagProps {
  country: CountryCode | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 20,
  md: 28,
  lg: 36,
  xl: 48,
};

export default function CountryFlag({
  country,
  size = 'md',
  className = '',
}: CountryFlagProps) {
  const dimension = sizeMap[size] || 28;
  const normalized = country.toLowerCase();

  const renderSvg = () => {
    switch (normalized) {
      case 'uae':
      case 'ae':
        return (
          <svg viewBox="0 0 64 64" width={dimension} height={dimension} className={className}>
            <circle cx="32" cy="32" r="30" fill="#00732F" />
            <path d="M22 2h40v60H22z" fill="#000000" />
            <path d="M22 2h40v40H22z" fill="#FFFFFF" />
            <path d="M22 2h40v20H22z" fill="#00732F" />
            <path d="M2 2h20v60H2z" fill="#FF0000" />
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
          </svg>
        );

      case 'hk':
      case 'hong-kong':
      case 'hong_kong':
        return (
          <svg viewBox="0 0 64 64" width={dimension} height={dimension} className={className}>
            <circle cx="32" cy="32" r="30" fill="#EE1C25" />
            {/* 5-petaled Bauhinia flower stylized */}
            <g fill="#FFFFFF" transform="translate(32, 32) scale(0.65) translate(-32, -32)">
              <path d="M32 14c2 6-2 10-2 14s6-2 10-2c-4 4-4 8-2 12s-8 0-10 4c-1-6 2-10 2-14s-6 2-10 2c4-4 4-8 2-12s8 0 10-4z" />
              <circle cx="32" cy="22" r="1.5" fill="#EE1C25" />
              <circle cx="40" cy="28" r="1.5" fill="#EE1C25" />
              <circle cx="37" cy="38" r="1.5" fill="#EE1C25" />
              <circle cx="27" cy="38" r="1.5" fill="#EE1C25" />
              <circle cx="24" cy="28" r="1.5" fill="#EE1C25" />
            </g>
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
          </svg>
        );

      case 'singapore':
      case 'sg':
        return (
          <svg viewBox="0 0 64 64" width={dimension} height={dimension} className={className}>
            <circle cx="32" cy="32" r="30" fill="#FFFFFF" />
            <path d="M2 32A30 30 0 0 1 62 32H2z" fill="#ED2939" />
            {/* Crescent & stars */}
            <g fill="#FFFFFF" transform="translate(18, 14) scale(0.45)">
              <path d="M16 2A14 14 0 1 0 30 16 11 11 0 1 1 16 2z" />
              <polygon points="26,6 27,9 30,9 28,11 29,14 26,12 23,14 24,11 22,9 25,9" />
              <polygon points="34,10 35,13 38,13 36,15 37,18 34,16 31,18 32,15 30,13 33,13" />
              <polygon points="34,22 35,25 38,25 36,27 37,30 34,28 31,30 32,27 30,25 33,25" />
              <polygon points="26,26 27,29 30,29 28,31 29,34 26,32 23,34 24,31 22,29 25,29" />
              <polygon points="21,16 22,19 25,19 23,21 24,24 21,22 18,24 19,21 17,19 20,19" />
            </g>
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
          </svg>
        );

      case 'bahrain':
      case 'bh':
        return (
          <svg viewBox="0 0 64 64" width={dimension} height={dimension} className={className}>
            <circle cx="32" cy="32" r="30" fill="#CE1126" />
            <path d="M2 32a30 30 0 0 1 20-28.3v56.6A30 30 0 0 1 2 32z" fill="#FFFFFF" />
            <polygon points="22,3.7 28,9 22,15 28,21 22,27 28,32 22,37 28,43 22,49 28,55 22,60.3" fill="#FFFFFF" />
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
          </svg>
        );

      case 'ireland':
      case 'ie':
        return (
          <svg viewBox="0 0 64 64" width={dimension} height={dimension} className={className}>
            <circle cx="32" cy="32" r="30" fill="#FFFFFF" />
            <path d="M2 32A30 30 0 0 1 22 3.7v56.6A30 30 0 0 1 2 32z" fill="#169B62" />
            <path d="M62 32A30 30 0 0 1 42 60.3V3.7A30 30 0 0 1 62 32z" fill="#FF883E" />
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
          </svg>
        );

      case 'oman':
      case 'om':
        return (
          <svg viewBox="0 0 64 64" width={dimension} height={dimension} className={className}>
            <circle cx="32" cy="32" r="30" fill="#FFFFFF" />
            <path d="M2 32A30 30 0 0 0 62 32H2z" fill="#008000" />
            <path d="M2 32a30 30 0 0 1 60 0H2z" fill="#FFFFFF" />
            <rect x="2" y="22" width="60" height="20" fill="#DB161B" />
            <rect x="2" y="2" width="18" height="60" fill="#DB161B" />
            {/* Khanjar emblem */}
            <g fill="#FFFFFF" transform="translate(6, 6) scale(0.22)">
              <path d="M12 2l4 8-4 8 4 8-8 12-8-12 4-8-4-8z" />
            </g>
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 64 64" width={dimension} height={dimension} className={className}>
            <circle cx="32" cy="32" r="30" fill="#14204A" />
            <text x="32" y="38" fill="#FFFFFF" fontSize="18" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
              {normalized.slice(0, 2).toUpperCase()}
            </text>
            <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2" />
          </svg>
        );
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {renderSvg()}
    </span>
  );
}
