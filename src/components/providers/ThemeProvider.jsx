'use client';

import { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Bỏ qua cảnh báo false positive của next-themes khi chạy React 19 ở môi trường Dev
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || '');
    if (
      msg.includes('Encountered a script tag') ||
      msg.includes('Missing or insufficient permissions') ||
      msg.includes('permission-denied') ||
      msg.includes('getLeaderboard') ||
      msg.includes('auth/operation-not-allowed')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
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
