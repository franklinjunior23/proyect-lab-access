'use client';

import { useEffect, useState } from 'react';
import { subscribeSSE, type AccessEvent } from '@/lib/socket';

export function useLiveFeed() {
  const [events, setEvents] = useState<AccessEvent[]>([]);

  useEffect(() => {
    return subscribeSSE((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });
  }, []);

  return events;
}
