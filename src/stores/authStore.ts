import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (_email: string, _password: string) => Promise<void>;
  register: (_email: string, _password: string, _name: string) => Promise<void>;
  logout: () => void;
  setUser: (_user: User) => void;
  initializeAuth: () => void;
  checkAuthStatus: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { user, access_token } = response;

          localStorage.setItem('access_token', access_token);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(email, password, name);
          const { user, access_token } = response;

          localStorage.setItem('access_token', access_token);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      initializeAuth: () => {
        const token = localStorage.getItem('access_token');
        const { user } = get();
        if (token && user) {
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false, user: null });
        }
      },

      checkAuthStatus: () => {
        const token = localStorage.getItem('access_token');
        const { user, isAuthenticated } = get();

        // If we think we're authenticated but missing token or user, logout
        if (isAuthenticated && (!token || !user)) {
          get().logout();
          window.location.href = '/';
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
