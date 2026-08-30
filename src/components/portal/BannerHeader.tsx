import React from 'react';

interface BannerHeaderProps {
  title: string;
  subtitle?: string;
}

export default function BannerHeader({ title, subtitle }: BannerHeaderProps) {
  return (
    <div 
      className="bg-red-600 w-full px-6 pt-10 pb-16 text-white"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-lg md:text-xl font-medium opacity-90">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
