'use client';

import { ColumnDef } from '@tanstack/react-table';
import { AccessLog } from '../hooks/useAccessLogs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

function ResultBadge({ row }: { row: AccessLog }) {
  if (row.result === 'ACCESS_GRANTED') {
    return <Badge variant="granted">Concedido</Badge>;
  }
  // Denegado con usuario conocido → el usuario existe pero está inactivo
  if (row.user !== null) {
    return <Badge variant="denied-inactive">Usuario inactivo</Badge>;
  }
  // Denegado sin usuario → UID desconocido
  return <Badge variant="denied">UID desconocido</Badge>;
}

const columns: ColumnDef<AccessLog, unknown>[] = [
  {
    id: 'result',
    header: 'Resultado',
    cell: ({ row }) => <ResultBadge row={row.original} />,
  },
  {
    accessorKey: 'uid',
    header: 'UID',
    cell: ({ getValue }) => (
      <span className="font-mono text-sm text-gray-500">{getValue() as string}</span>
    ),
  },
  {
    accessorFn: (row) => row.user?.name ?? '—',
    id: 'user',
    header: 'Usuario',
    cell: ({ getValue }) => {
      const name = getValue() as string;
      return (
        <span className={name === '—' ? 'text-gray-300' : 'font-medium text-gray-700'}>
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ getValue }) => (
      <span className="text-sm text-gray-400">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'timestamp',
    header: 'Fecha y hora',
    cell: ({ getValue }) => (
      <span className="text-sm text-gray-400">
        {new Date(getValue() as string).toLocaleString('es')}
      </span>
    ),
  },
];

interface LogTableProps {
  logs: AccessLog[];
  loading: boolean;
}

export function LogTable({ logs, loading }: LogTableProps) {
  return (
    <DataTable
      data={logs}
      columns={columns}
      loading={loading}
      emptyMessage="Sin registros de acceso aún."
      pageSize={8}
    />
  );
}
