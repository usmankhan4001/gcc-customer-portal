'use client';

import React from 'react';
import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 text-gray-500 mb-4">
          <MapPinOff size={28} />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Page Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
