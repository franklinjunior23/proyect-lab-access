'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { exportToCSV } from '@/lib/export';
import { AccessLog } from '../hooks/useAccessLogs';
import { Button } from '@/components/ui/button';

type PresetKey = 'TODO' | '1H' | '2H' | '6H' | 'HOY' | 'SEMANA' | 'MES';

interface Preset {
  label: string;
  description: string;
  from?: () => Date;
}

const PRESETS: Record<PresetKey, Preset> = {
  TODO:   { label: 'Todo el historial', description: 'Todos los registros disponibles' },
  '1H':   { label: 'Última hora',       description: 'Accesos de los últimos 60 min' },
  '2H':   { label: 'Últimas 2 horas',   description: 'Accesos de las últimas 2 horas' },
  '6H':   { label: 'Últimas 6 horas',   description: 'Accesos de las últimas 6 horas' },
  HOY:    { label: 'Hoy',               description: 'Desde las 00:00 de hoy' },
  SEMANA: { label: 'Esta semana',        description: 'Desde el inicio de la semana' },
  MES:    { label: 'Este mes',           description: 'Desde el día 1 del mes' },
};

function hoursAgo(h: number) { return new Date(Date.now() - h * 60 * 60 * 1000); }
function startOfDay()   { const d = new Date(); d.setHours(0,0,0,0); return d; }
function startOfWeek()  { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }

const FROM_FN: Partial<Record<PresetKey, () => Date>> = {
  '1H': () => hoursAgo(1),
  '2H': () => hoursAgo(2),
  '6H': () => hoursAgo(6),
  HOY:  startOfDay,
  SEMANA: startOfWeek,
  MES:  startOfMonth,
};

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const [selected, setSelected] = useState<PresetKey>('HOY');
  const [loading, setLoading]   = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const fromFn = FROM_FN[selected];
      const params: Record<string, string> = {};
      if (fromFn) params.from = fromFn().toISOString();

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
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">Exportar registros</h2>
        <p className="mt-1 text-sm text-gray-400">Selecciona el período a exportar</p>

        <div className="mt-5 flex flex-col gap-2">
          {(Object.entries(PRESETS) as [PresetKey, Preset][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${
                selected === key
                  ? 'bg-indigo-50 ring-2 ring-indigo-400'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${selected === key ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {p.label}
                </p>
                <p className="text-xs text-gray-400">{p.description}</p>
              </div>
              {selected === key && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth={2.5} className="h-5 w-5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" disabled={loading} onClick={handleExport}>
            {loading ? 'Descargando…' : 'Descargar CSV'}
          </Button>
        </div>
      </div>
    </div>
  );
}
