'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse, Role } from '@/types';

interface LoginData { email: string; password: string }
interface RegisterData { email: string; password: string; firstName: string; lastName: string; role: Role }

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginData) => api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: RegisterData) => api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/dashboard');
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return () => {
    clearAuth();
    router.push('/login');
  };
}
