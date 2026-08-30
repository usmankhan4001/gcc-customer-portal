'use client';

import { useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribePush(registration: ServiceWorkerRegistration) {
  if (!VAPID_PUBLIC_KEY) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const stored = localStorage.getItem('gccstartup-push-subscription');
    if (stored === JSON.stringify(subscription)) return;

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    localStorage.setItem('gccstartup-push-subscription', JSON.stringify(subscription));
  } catch {
    // Push subscription failed silently
  }
}

export default function ServiceWorkerRegistration() {
  const registerSW = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('SW registered:', registration.scope);

      if ('pushManager' in registration && VAPID_PUBLIC_KEY) {
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          localStorage.setItem('gccstartup-push-subscription', JSON.stringify(existing));
        } else {
          subscribePush(registration);
        }
      }

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  }, []);

  useEffect(() => {
    registerSW();
  }, [registerSW]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return null;
}
