import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, GuestUser } from '@/types';
import { authApi } from '@/services/api';

interface AuthState {
  user: User | null;
  guestUser: GuestUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (_email: string, _password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (_email: string, _password: string, _name: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  setGuestUser: (_guestUser: GuestUser) => void;
  convertGuestToUser: (_user: User) => void;
  logout: () => void;
  setUser: (_user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      guestUser: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { user, access_token } = response;

          localStorage.setItem('access_token', access_token);
          set({ user, isAuthenticated: true, isGuest: false, guestUser: null, isLoading: false });
          
          return { success: true, user };
        } catch (error) {
          console.error('Login failed:', error);
          set({ isLoading: false });
          return { success: false, message: 'ログインに失敗しました' };
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(email, password, name);
          const { user, access_token } = response;

          localStorage.setItem('access_token', access_token);
          set({ user, isAuthenticated: true, isGuest: false, guestUser: null, isLoading: false });
          
          return { success: true, user };
        } catch (error) {
          console.error('Registration failed:', error);
          set({ isLoading: false });
          return { success: false, message: '登録に失敗しました' };
        }
      },

      setGuestUser: (guestUser: GuestUser) => {
        set({ guestUser, isGuest: true, isAuthenticated: false, user: null });
      },

      convertGuestToUser: (user: User) => {
        set({ user, isAuthenticated: true, isGuest: false, guestUser: null });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, guestUser: null, isAuthenticated: false, isGuest: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true, isGuest: false, guestUser: null });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Sync isAuthenticated with token and user presence
        if (state) {
          const token = localStorage.getItem('access_token');
          state.isAuthenticated = !!(token && state.user?.id);
          state.isGuest = !!(!state.isAuthenticated && state.guestUser?.tempId);
        }
      },
    }
  )
);
