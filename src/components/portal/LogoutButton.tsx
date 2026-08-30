'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/auth');
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={
        className ??
        'flex items-center justify-center gap-2 w-full p-4 text-destructive bg-white border border-destructive/20 hover:bg-destructive/5 rounded-md font-bold transition-colors shadow-sm disabled:opacity-60'
      }
    >
      <SignOut className="w-4 h-4" />
      {isLoggingOut ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
