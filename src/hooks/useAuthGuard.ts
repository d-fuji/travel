import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuthGuard() {
  const { isAuthenticated, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus();

    // Check auth status periodically (every 5 minutes)
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000);

    // Check auth status when window becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuthStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuthStatus]);

  return { isAuthenticated };
}