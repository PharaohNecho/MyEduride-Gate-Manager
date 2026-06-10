'use client';

import { useEffect } from 'react';
import { logout, getSession } from '@/lib/api';

// Auto logout after 30 minutes of complete inactivity
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function SessionIdleGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const session = getSession();
        if (session) {
          console.log('[IdleGuard] Session idle for 30 minutes. Auto-logout initiated.');
          logout();
        }
      }, IDLE_TIMEOUT_MS);
    };

    // Events that signify user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return null;
}
