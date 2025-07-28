import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    // Mock login - in real app, this would call your API
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
    };
    
    set({ user: mockUser, isAuthenticated: true });
    localStorage.setItem('user', JSON.stringify(mockUser));
  },
  
  register: async (email: string, password: string, name: string) => {
    // Mock registration - in real app, this would call your API
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
    };
    
    set({ user: mockUser, isAuthenticated: true });
    localStorage.setItem('user', JSON.stringify(mockUser));
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('user');
  },
  
  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },
}));