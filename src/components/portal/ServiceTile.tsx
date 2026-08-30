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
      className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-[var(--radius-tile)] hover:border-primary-200 hover:shadow-sm transition-all aspect-square text-center"
    >
      <div className="w-10 h-10 rounded-[var(--radius-tile)] bg-primary-50 flex items-center justify-center mb-2.5 text-gray-700">
        {icon}
      </div>
      <span className="text-xs font-bold text-gray-900 leading-tight">
        {title}
      </span>
    </Link>
  );
}
