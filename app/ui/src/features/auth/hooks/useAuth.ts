'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function login(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ accessToken: string }>('/auth/login', { username, password });
      localStorage.setItem('labgate_token', res.accessToken);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('labgate_token');
    router.push('/login');
  }

  return { login, logout, loading, error };
}
