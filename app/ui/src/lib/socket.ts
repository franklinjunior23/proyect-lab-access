const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface AccessEvent {
  uid: string;
  granted: boolean;
  description: string;
  timestamp: string;
  userName?: string;
}

type Listener = (event: AccessEvent) => void;

const listeners = new Set<Listener>();
let source: EventSource | null = null;

function connect() {
  if (source) return;
  source = new EventSource(`${BASE}/events`);
  source.onmessage = (e: MessageEvent) => {
    try {
      const event = JSON.parse(e.data as string) as AccessEvent;
      listeners.forEach((cb) => cb(event));
    } catch {
      // evento malformado — ignorar
    }
  };
  source.onerror = () => {
    source?.close();
    source = null;
    // reintentar en 3 segundos si aún hay suscriptores
    if (listeners.size > 0) setTimeout(connect, 3000);
  };
}

export function subscribeSSE(callback: Listener): () => void {
  listeners.add(callback);
  connect();
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      source?.close();
      source = null;
    }
  };
}
