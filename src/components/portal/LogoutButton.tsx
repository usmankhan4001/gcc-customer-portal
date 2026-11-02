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
      className={className ?? 'btn btn-outline'}
      style={className ? undefined : { width: '100%', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
    >
      <SignOut className="w-4 h-4" />
      {isLoggingOut ? 'Logging out...' : 'Log Out'}
    </button>
  );
}
