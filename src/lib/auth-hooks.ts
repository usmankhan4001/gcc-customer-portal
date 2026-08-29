'use client';

import { useState, useEffect } from 'react';

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { user, isLoading };
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function isAuthenticated(): boolean {
  return !!getCookie('gcc_session');
}

export function isAdmin(): boolean {
  const token = getCookie('gcc_session');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'admin' || payload.role === 'super_admin';
  } catch {
    return false;
  }
}
