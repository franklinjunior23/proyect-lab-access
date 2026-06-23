'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { api } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { AccessLog } from '../hooks/useAccessLogs';
import { Button } from '@/components/ui/button';

type PresetKey = 'TODO' | '1H' | '2H' | '6H' | 'HOY' | 'SEMANA' | 'MES';

const PRESETS: [PresetKey, string][] = [
  ['1H',    'Última hora'   ],
  ['2H',    'Últimas 2 h'   ],
  ['6H',    'Últimas 6 h'   ],
  ['HOY',   'Hoy'           ],
  ['SEMANA','Esta semana'   ],
  ['MES',   'Este mes'      ],
  ['TODO',  'Todo'          ],
];

function getFrom(key: PresetKey): Date | undefined {
  if (key === 'TODO') return undefined;
  const now = new Date();
  if (key === '1H') return new Date(now.getTime() - 3600_000);
  if (key === '2H') return new Date(now.getTime() - 2 * 3600_000);
  if (key === '6H') return new Date(now.getTime() - 6 * 3600_000);
  if (key === 'HOY')    { const d = new Date(); d.setHours(0,0,0,0); return d; }
  if (key === 'SEMANA') { const d = new Date(); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d; }
  if (key === 'MES')    { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }
}

export function ExportPopover() {
  const [open, setOpen]         = useState(false);
  const [selected, setSelected] = useState<PresetKey>('HOY');
  const [loading, setLoading]   = useState(false);
  const popoverRef              = useRef<HTMLDivElement>(null);
  const wrapperRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverRef.current || !open) return;
    gsap.fromTo(
      popoverRef.current,
      { opacity: 0, scale: 0.94, y: -6 },
      { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' },
    );
  }, [open]);

  function close() {
    if (!popoverRef.current) { setOpen(false); return; }
    gsap.to(popoverRef.current, {
      opacity: 0, scale: 0.94, y: -6,
      duration: 0.15, ease: 'power2.in',
      onComplete: () => setOpen(false),
    });
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleExport() {
    setLoading(true);
    try {
      const from = getFrom(selected);
      const params: Record<string, string> = {};
      if (from) params.from = from.toISOString();

      const data = await api.get<AccessLog[]>('/access/logs', params);
      exportToCSV(
        data,
        [
          { header: 'Resultado',    accessor: (r) => r.result === 'ACCESS_GRANTED' ? 'Concedido' : r.user ? 'Usuario inactivo' : 'UID desconocido' },
          { header: 'UID',          accessor: (r) => r.uid },
          { header: 'Usuario',      accessor: (r) => r.user?.name ?? '—' },
          { header: 'Descripción',  accessor: (r) => r.description ?? '—' },
          { header: 'Fecha y hora', accessor: (r) => new Date(r.timestamp).toLocaleString('es') },
        ],
        `registros_${selected.toLowerCase()}`,
      );
      close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">

      {/* Trigger */}
      <Button variant="tonal" onClick={() => (open ? close() : setOpen(true))}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Exportar CSV
      </Button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-200"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Período a exportar
          </p>

          {/* Grid 4×2 */}
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map(([key, label]) => {
              const active = selected === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`flex flex-col items-center justify-center rounded-xl py-3 text-center text-xs font-semibold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Botón grande */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Descargando…' : 'Descargar CSV'}
          </button>
        </div>
      )}
    </div>
  );
}
