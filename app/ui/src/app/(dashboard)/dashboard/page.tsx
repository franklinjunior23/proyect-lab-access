'use client';

import { useAccessLogs } from '@/features/access/hooks/useAccessLogs';
import { LiveFeed } from '@/features/access/components/LiveFeed';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className={`mt-3 text-5xl font-bold tracking-tight ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { logs } = useAccessLogs();

  const hoy = new Date().toDateString();
  const logsHoy = logs.filter((l) => new Date(l.timestamp).toDateString() === hoy);
  const concedidos = logsHoy.filter((l) => l.result === 'ACCESS_GRANTED').length;
  const denegados  = logsHoy.filter((l) => l.result === 'ACCESS_DENIED').length;

  return (
    <div className="flex w-full flex-col gap-8">

      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Panel</h1>
        <p className="mt-1 text-base text-gray-500">Vista general de accesos en tiempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Concedidos hoy" value={concedidos} color="text-green-600" />
        <StatCard label="Denegados hoy"  value={denegados}  color="text-red-500"   />
        <StatCard label="Total hoy"      value={logsHoy.length} color="text-gray-800" />
      </div>

      {/* Live feed */}
      <LiveFeed />
    </div>
  );
}
