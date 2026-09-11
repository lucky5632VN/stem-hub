'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Bỏ qua cảnh báo false positive và lỗi QuotaExceeded của Firestore multi-tab trong Dev
if (typeof window !== 'undefined') {
  // Bắt unhandled rejection để không làm sập dev server / overlay khi Firestore gặp key cũ
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('QuotaExceededError') ||
      reason.includes('b815') ||
      reason.includes('firestore_online_state') ||
      reason.includes('FIRESTORE')
    ) {
      event.preventDefault();
      try {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const k = window.localStorage.key(i);
          if (k && (k.startsWith('firestore_') || k.includes('firestore'))) {
            window.localStorage.removeItem(k);
          }
        }
      } catch (_) {}
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = (...args) => {
      const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
      if (
        msg.includes('Encountered a script tag') ||
        msg.includes('Missing or insufficient permissions') ||
        msg.includes('permission-denied') ||
        msg.includes('getLeaderboard') ||
        msg.includes('auth/operation-not-allowed') ||
        msg.includes('QuotaExceededError') ||
        msg.includes('b815') ||
        msg.includes('firestore_online_state') ||
        msg.includes('INTERNAL ASSERTION FAILED')
      ) {
        return;
      }
      originalError.apply(console, args);
    };
  }
}

export function ThemeProvider({ children, ...props }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const k = window.localStorage.key(i);
          if (k && (k.startsWith('firestore_') || k.includes('firestore'))) {
            window.localStorage.removeItem(k);
          }
        }
      }
    } catch (_) {}
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister().then(function(success) {
            if (success) {
              console.log('Legacy Service Worker unregistered successfully!');
              window.location.reload();
            }
          });
        }
      });
    }
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
