'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: number;
  name: string;
  uid: string;
  active: boolean;
  createdAt: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    try {
      const data = await api.get<User[]>('/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function create(name: string, uid: string) {
    const user = await api.post<User>('/users', { name, uid });
    setUsers((prev) => [user, ...prev]);
  }

  async function toggle(id: number) {
    const updated = await api.patch<User>(`/users/${id}/toggle`);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
  }

  async function remove(id: number) {
    await api.delete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return { users, loading, create, toggle, remove, refresh: fetchUsers };
}
