'use client';

import posthog from 'posthog-js';

let initialized = false;

/**
 * Lazily initializes the PostHog client. No-ops if
 * NEXT_PUBLIC_POSTHOG_KEY isn't set — analytics is for the team's
 * visibility (funnels, drop-off, session replay), never something the
 * app depends on to function, so a missing key must never break anything.
 */
export function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
  });
  initialized = true;
}

export { posthog };
