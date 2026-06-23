'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface UserFormProps {
  onSubmit: (name: string, uid: string) => Promise<void>;
}

export function UserForm({ onSubmit }: UserFormProps) {
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !uid.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(name.trim(), uid.trim().toUpperCase());
      setName('');
      setUid('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ana García"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">UID de tarjeta RFID</label>
        <input
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="A1B2C3D4"
          className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
      <Button type="submit" disabled={loading || !name || !uid}>
        {loading ? 'Agregando…' : 'Agregar usuario'}
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
