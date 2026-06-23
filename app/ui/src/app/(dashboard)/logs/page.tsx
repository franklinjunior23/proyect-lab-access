'use client';

import { useState } from 'react';
import { useAccessLogs } from '@/features/access/hooks/useAccessLogs';
import { LogTable } from '@/features/access/components/LogTable';
import { ExportPopover } from '@/features/access/components/ExportPopover';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

type ResultFiltro = 'TODOS' | 'ACCESS_GRANTED' | 'ACCESS_DENIED';

const RESULT_FILTROS: { value: ResultFiltro; label: string }[] = [
  { value: 'TODOS',          label: 'Todos'      },
  { value: 'ACCESS_GRANTED', label: 'Concedidos' },
  { value: 'ACCESS_DENIED',  label: 'Denegados'  },
];

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="flex-1">
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">{value}</p>
          </div>
          <div className="rounded-xl bg-gray-100 p-2.5 text-gray-500">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LogsPage() {
  const { logs, loading } = useAccessLogs();
  const [resultFiltro, setResultFiltro] = useState<ResultFiltro>('TODOS');

  const filtrados  = resultFiltro === 'TODOS' ? logs : logs.filter((l) => l.result === resultFiltro);
  const concedidos = logs.filter((l) => l.result === 'ACCESS_GRANTED').length;
  const denegados  = logs.filter((l) => l.result === 'ACCESS_DENIED').length;

  return (
    <div className="flex w-full flex-col gap-8">

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registros de acceso</h1>
          <p className="mt-1 text-base text-gray-500">Historial completo de intentos de acceso</p>
        </div>
        <ExportPopover />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat
          label="Total registros"
          value={logs.length}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <Stat
          label="Concedidos"
          value={concedidos}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-green-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <Stat
          label="Denegados"
          value={denegados}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-red-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Historial</h2>
              <p className="mt-0.5 text-sm text-gray-400">
                {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
              </p>
            </div>
            <div className="flex gap-1 rounded-full bg-gray-100 p-1">
              {RESULT_FILTROS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setResultFiltro(f.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    resultFiltro === f.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <LogTable logs={filtrados} loading={loading} />
        </CardContent>
      </Card>

    </div>
  );
}
