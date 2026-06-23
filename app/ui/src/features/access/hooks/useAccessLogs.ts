'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { subscribeSSE } from '@/lib/socket';

export interface AccessLog {
  id: number;
  uid: string;
  result: 'ACCESS_GRANTED' | 'ACCESS_DENIED';
  description: string | null;
  timestamp: string;
  user: { name: string } | null;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export function useAccessLogs(range?: DateRange) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLogs(r?: DateRange) {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (r?.from) params.from = r.from.toISOString();
      if (r?.to)   params.to   = r.to.toISOString();

      const data = await api.get<AccessLog[]>('/access/logs', params);
      setLogs(data);
    } catch {
      // sin conexión — muestra estado vacío
    } finally {
      setLoading(false);
    }
  }

  // Re-fetch cuando cambia el rango
  useEffect(() => {
    fetchLogs(range);
  }, [range?.from?.toISOString(), range?.to?.toISOString()]);

  // Nuevos eventos SSE solo se agregan si caen dentro del rango activo
  useEffect(() => {
    return subscribeSSE((event) => {
      const ts = new Date(event.timestamp);
      const dentroDelRango =
        (!range?.from || ts >= range.from) &&
        (!range?.to   || ts <= range.to);

      if (!dentroDelRango) return;

      const nuevoLog: AccessLog = {
        id: Date.now(),
        uid: event.uid,
        result: event.granted ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
        description: event.description,
        timestamp: event.timestamp,
        user: event.userName ? { name: event.userName } : null,
      };
      setLogs((prev) => [nuevoLog, ...prev]);
    });
  }, [range?.from?.toISOString(), range?.to?.toISOString()]);

  return { logs, loading, refresh: () => fetchLogs(range) };
}
