'use client';

import { ColumnDef } from '@tanstack/react-table';
import { User } from '../hooks/useUsers';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserTableProps {
  users: User[];
  loading: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function buildColumns(
  onToggle: (id: number) => void,
  onDelete: (id: number) => void,
): ColumnDef<User, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-900">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'uid',
      header: 'UID',
      cell: ({ getValue }) => (
        <span className="font-mono text-gray-500">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ getValue }) => {
        const active = getValue() as boolean;
        return (
          <Badge variant={active ? 'active' : 'inactive'}>
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Registrado',
      cell: ({ getValue }) => (
        <span className="text-gray-400">
          {new Date(getValue() as string).toLocaleDateString('es')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onToggle(user.id)}>
              {user.active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`¿Eliminar a ${user.name}?`)) onDelete(user.id);
              }}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];
}

export function UserTable({ users, loading, onToggle, onDelete }: UserTableProps) {
  const columns = buildColumns(onToggle, onDelete);

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={loading}
      emptyMessage="Sin usuarios registrados aún."
      pageSize={8}
    />
  );
}
