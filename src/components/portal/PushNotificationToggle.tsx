'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer as BufferSource;
}

export default function PushNotificationToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    setSupported(true);
    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  const handleToggle = async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
        setSubscribed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors disabled:opacity-60 ${
        subscribed ? 'bg-primary' : 'bg-gray-300'
      }`}
      aria-pressed={subscribed}
      aria-label="Toggle push notifications"
    >
      <div
        className={`absolute top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
          subscribed ? 'right-1' : 'left-1'
        }`}
      />
    </button>
  );
}
