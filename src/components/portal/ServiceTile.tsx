import React from 'react';
import Link from 'next/link';

interface ServiceTileProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

export default function ServiceTile({ title, icon, href }: ServiceTileProps) {
  return (
    <Link 
      href={href} 
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors aspect-square text-center"
    >
      <div className="text-gray-700 mb-3">
        {icon}
      </div>
      <span className="text-sm font-bold text-gray-900 leading-tight">
        {title}
      </span>
    </Link>
  );
}
