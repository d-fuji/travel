import { useAuthStore } from '@/stores/authStore';

export function useAuthGuard() {
  const { isAuthenticated } = useAuthStore();

  return { isAuthenticated };
}