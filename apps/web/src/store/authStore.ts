import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        const secure = process.env.NODE_ENV === 'production';
        Cookies.set('accessToken', accessToken, { expires: 1, secure, sameSite: 'strict' });
        Cookies.set('refreshToken', refreshToken, { expires: 7, secure, sameSite: 'strict' });
        set({ user, isAuthenticated: true });
      },

      clearAuth: () => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'nexhire-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
