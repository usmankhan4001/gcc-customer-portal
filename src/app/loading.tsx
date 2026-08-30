'use client';

import React from 'react';

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4 h-[120px] flex flex-col gap-2.5 justify-center">
      <div
        className="w-2/5 h-4 rounded-md bg-gray-200 animate-pulse"
        style={{ animationDelay: `${delay}s` }}
      />
      <div
        className="w-4/5 h-3 rounded-md bg-gray-200 animate-pulse"
        style={{ animationDelay: `${delay + 0.1}s` }}
      />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-5 max-w-4xl mx-auto w-full" aria-busy="true" aria-live="polite">
      <SkeletonCard delay={0} />
      <SkeletonCard delay={0.1} />
      <SkeletonCard delay={0.2} />
    </div>
  );
}
