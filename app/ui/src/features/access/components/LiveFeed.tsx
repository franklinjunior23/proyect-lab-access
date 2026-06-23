'use client';

import { useLiveFeed } from '../hooks/useLiveFeed';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function LiveFeed() {
  const events = useLiveFeed();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <h2 className="text-base font-semibold text-gray-900">Accesos en vivo</h2>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">
            Esperando eventos de acceso…
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {events.map((e, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-4 text-sm">
                <Badge variant={e.granted ? 'granted' : 'denied'}>
                  {e.granted ? 'Concedido' : 'Denegado'}
                </Badge>
                <span className="font-mono text-xs text-gray-400">{e.uid}</span>
                {e.userName && (
                  <span className="font-medium text-gray-700">{e.userName}</span>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(e.timestamp).toLocaleTimeString('es')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
