'use client';

import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { AuthUser, LoginResponse } from '@chess/shared';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  async function login(email: string, password: string): Promise<void> {
    const data = await api.post<LoginResponse>('/auth/login', { email, password });

    // Store access token in cookie for Next.js middleware to read
    document.cookie = `access_token=${data.accessToken}; path=/; max-age=${15 * 60}; samesite=strict`;

    setAuth(data.user as AuthUser, data.accessToken);

    const dashboardMap: Record<string, string> = {
      ADMIN: '/admin/dashboard',
      TEACHER: '/teacher/dashboard',
      STUDENT: '/student/dashboard',
    };
    router.push(dashboardMap[data.user.role] ?? '/');
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      document.cookie = 'access_token=; path=/; max-age=0';
      clearAuth();
      router.push('/login');
    }
  }

  return { user, accessToken, isAuthenticated: !!user, login, logout };
}
