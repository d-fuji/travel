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
          console.error('Login failed:', error);
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
          console.error('Registration failed:', error);
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
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Sync isAuthenticated with token and user presence
        if (state) {
          const token = localStorage.getItem('access_token');
          state.isAuthenticated = !!(token && state.user?.id);
        }
      },
    }
  )
);
