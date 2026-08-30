'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portal Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4 py-6">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 mb-4">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Something Went Wrong</h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-md transition-colors"
          >
            <Home size={14} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
