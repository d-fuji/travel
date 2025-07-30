import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, GuestUser } from '@/types';
import { authApi } from '@/services/api';

// Generate a simple device fingerprint
function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

interface AuthState {
  user: User | null;
  guestUser: GuestUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (_email: string, _password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  register: (_email: string, _password: string, _name: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  guestLogin: (_nickname: string, _groupId: string) => Promise<{ success: boolean; guestUser?: GuestUser; message?: string }>;
  refreshGuestSession: (_tempId: string) => Promise<{ success: boolean; guestUser?: GuestUser; message?: string }>;
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

      guestLogin: async (nickname: string, groupId: string) => {
        set({ isLoading: true });
        try {
          // Generate device fingerprint
          const deviceFingerprint = generateDeviceFingerprint();
          
          const response = await authApi.guestLogin(nickname, deviceFingerprint, groupId);
          const { guestUser, access_token } = response;

          localStorage.setItem('access_token', access_token);
          set({ 
            guestUser, 
            isGuest: true, 
            isAuthenticated: true, 
            user: null, 
            isLoading: false 
          });
          
          return { success: true, guestUser };
        } catch (error) {
          console.error('Guest login failed:', error);
          set({ isLoading: false });
          return { success: false, message: 'ゲストログインに失敗しました' };
        }
      },

      refreshGuestSession: async (tempId: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.refreshGuestSession(tempId);
          const { guestUser, access_token } = response;

          localStorage.setItem('access_token', access_token);
          set({ 
            guestUser, 
            isGuest: true, 
            isAuthenticated: true, 
            user: null, 
            isLoading: false 
          });
          
          return { success: true, guestUser };
        } catch (error) {
          console.error('Guest session refresh failed:', error);
          set({ isLoading: false });
          return { success: false, message: 'セッションの更新に失敗しました' };
        }
      },

      setGuestUser: (guestUser: GuestUser) => {
        set({ guestUser, isGuest: true, isAuthenticated: true, user: null });
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
        // Sync authentication state with token and user data
        if (state) {
          const token = localStorage.getItem('access_token');
          
          // 通常ユーザーの認証状態
          const hasValidUser = !!(token && state.user?.id);
          
          // ゲストユーザーの認証状態
          const hasValidGuest = !!(token && state.guestUser?.tempId && !state.user?.id);
          
          state.isAuthenticated = hasValidUser || hasValidGuest;
          state.isGuest = hasValidGuest;
          
          console.log('Auth state rehydrated:', {
            hasToken: !!token,
            hasUser: !!state.user?.id,
            hasGuestUser: !!state.guestUser?.tempId,
            isAuthenticated: state.isAuthenticated,
            isGuest: state.isGuest
          });
        }
      },
    }
  )
);
