'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'gccstartup-install-dismissed';
const VISIT_KEY = 'gccstartup-visit-count';

function getVisitCount(): number {
  if (typeof window === 'undefined') return 0;
  const count = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10);
  return count;
}

function incrementVisitCount() {
  const count = getVisitCount();
  localStorage.setItem(VISIT_KEY, String(count + 1));
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    incrementVisitCount();

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const visitCount = getVisitCount();
    if (visitCount < 2) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <div className="rounded-xl border border-[var(--color-border,#E5E7EB)] bg-white p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#14204A]">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#14204A]">Install GCCStartup</p>
              <p className="text-xs text-gray-500">
                Add to your home screen for quick access
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-lg bg-[#F26522] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a1b]"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
