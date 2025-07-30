import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, GuestUser } from '@/types';
import { authApi } from '@/services/api';

// Generate a comprehensive device fingerprint
function generateDeviceFingerprint(): string {
  try {
    // Canvas fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 200;
    canvas.height = 50;
    
    // Canvas content for fingerprinting
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('🌸 Device fingerprint test 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('🌸 Device fingerprint test 🔒', 4, 17);
    
    const canvasData = canvas.toDataURL();
    
    // WebGL fingerprinting
    let webglData = '';
    try {
      const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || 
                 canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          webglData = [
            gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
            gl.getParameter(gl.VERSION),
            gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
          ].join('|');
        }
      }
    } catch (e) {
      // WebGL not supported or blocked
    }
    
    // Audio context fingerprinting
    let audioData = '';
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const analyser = audioCtx.createAnalyser();
      const gain = audioCtx.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      oscillator.connect(analyser);
      analyser.connect(gain);
      gain.connect(audioCtx.destination);
      
      oscillator.start(0);
      
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData);
      
      audioData = Array.from(frequencyData.slice(0, 10)).join(',');
      audioCtx.close();
    } catch (e) {
      // Audio context not supported
    }
    
    // Comprehensive fingerprint components
    const components = [
      // Basic browser info
      navigator.userAgent,
      navigator.language,
      navigator.languages ? navigator.languages.join(',') : '',
      (navigator as any).platform || '',
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
      navigator.maxTouchPoints || 0,
      
      // Screen info
      screen.width,
      screen.height,
      screen.colorDepth,
      screen.pixelDepth,
      window.devicePixelRatio || 1,
      
      // Timezone and locale
      new Date().getTimezoneOffset(),
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      Intl.DateTimeFormat().resolvedOptions().locale || '',
      
      // Available fonts (basic detection)
      (() => {
        const testFonts = ['Arial', 'Times', 'Courier', 'Helvetica', 'Georgia', 'Verdana'];
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        context.textBaseline = 'top';
        context.font = testSize + ' monospace';
        const baseWidth = context.measureText(testString).width;
        
        return testFonts.filter(font => {
          context.font = testSize + ' ' + font + ', monospace';
          return context.measureText(testString).width !== baseWidth;
        }).join(',');
      })(),
      
      // Plugins (basic detection)
      Array.from((navigator as any).plugins || []).map((p: any) => p.name || '').join(','),
      
      // WebRTC local IPs (if available)
      (() => {
        // This is complex and async, so we'll skip for now
        return '';
      })(),
      
      // Canvas and WebGL data
      canvasData,
      webglData,
      audioData,
      
      // Storage support
      typeof(Storage) !== "undefined" ? '1' : '0',
      typeof(indexedDB) !== "undefined" ? '1' : '0',
      typeof(navigator.serviceWorker) !== "undefined" ? '1' : '0',
      
      // CPU class (IE specific, but doesn't hurt)
      (navigator as any).cpuClass || '',
      
      // Do Not Track
      navigator.doNotTrack || (navigator as any).msDoNotTrack || (window as any).doNotTrack || '',
      
      // Battery API (deprecated but some browsers still support)
      (() => {
        try {
          return (navigator as any).getBattery ? '1' : '0';
        } catch (e) {
          return '0';
        }
      })()
    ];
    
    const fingerprint = components.filter(c => c !== null && c !== undefined).join('|');
    
    // Enhanced hash function (FNV-1a variant)
    let hash = 2166136261;
    for (let i = 0; i < fingerprint.length; i++) {
      hash ^= fingerprint.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    
    // Convert to positive number and base36
    return (hash >>> 0).toString(36);
    
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback to simple fingerprint
    return 'fallback_' + Date.now().toString(36);
  }
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
  quickGuestLogin: () => Promise<{ success: boolean; guestUser?: GuestUser; message?: string }>;
  getStoredGuestInfo: () => { nickname: string; deviceFingerprint: string; groupId: string; lastLoginAt: string } | null;
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
          
          // Save guest login info for future use
          const guestLoginInfo = {
            nickname,
            deviceFingerprint,
            groupId,
            lastLoginAt: new Date().toISOString()
          };
          localStorage.setItem('guest-login-info', JSON.stringify(guestLoginInfo));
          
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

      quickGuestLogin: async () => {
        set({ isLoading: true });
        try {
          const guestInfo = JSON.parse(localStorage.getItem('guest-login-info') || 'null');
          if (!guestInfo) {
            set({ isLoading: false });
            return { success: false, message: '保存されたゲスト情報がありません' };
          }

          const { nickname, deviceFingerprint, groupId } = guestInfo;
          const response = await authApi.guestLogin(nickname, deviceFingerprint, groupId);
          const { guestUser, access_token } = response;

          localStorage.setItem('access_token', access_token);
          
          // Update last login time
          const updatedGuestInfo = {
            ...guestInfo,
            lastLoginAt: new Date().toISOString()
          };
          localStorage.setItem('guest-login-info', JSON.stringify(updatedGuestInfo));
          
          set({ 
            guestUser, 
            isGuest: true, 
            isAuthenticated: true, 
            user: null, 
            isLoading: false 
          });
          
          return { success: true, guestUser };
        } catch (error) {
          console.error('Quick guest login failed:', error);
          set({ isLoading: false });
          return { success: false, message: 'ゲストログインに失敗しました' };
        }
      },

      getStoredGuestInfo: () => {
        try {
          const guestInfo = localStorage.getItem('guest-login-info');
          return guestInfo ? JSON.parse(guestInfo) : null;
        } catch (error) {
          console.error('Failed to get stored guest info:', error);
          return null;
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
