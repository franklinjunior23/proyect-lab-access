'use client';

import { useUsers } from '@/features/users/hooks/useUsers';
import { UserTable } from '@/features/users/components/UserTable';
import { UserForm } from '@/features/users/components/UserForm';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/lib/export';

interface StatProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function Stat({ label, value, icon }: StatProps) {
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

export default function UsersPage() {
  const { users, loading, create, toggle, remove } = useUsers();

  const activos   = users.filter((u) => u.active).length;
  const inactivos = users.filter((u) => !u.active).length;

  return (
    <div className="flex w-full flex-col gap-8">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Usuarios</h1>
          <p className="mt-1 text-base text-gray-500">Gestión de tarjetas RFID autorizadas</p>
        </div>
        <Button
          variant="tonal"
          onClick={() =>
            exportToCSV(
              users,
              [
                { header: 'Nombre',     accessor: (u) => u.name },
                { header: 'UID',        accessor: (u) => u.uid },
                { header: 'Estado',     accessor: (u) => (u.active ? 'Activo' : 'Inactivo') },
                { header: 'Registrado', accessor: (u) => new Date(u.createdAt).toLocaleDateString('es') },
              ],
              'usuarios',
            )
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat
          label="Total registrados"
          value={users.length}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          }
        />
        <Stat
          label="Activos"
          value={activos}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-green-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <Stat
          label="Inactivos"
          value={inactivos}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-gray-400">
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Registrar nuevo usuario</h2>
          <p className="mt-0.5 text-sm text-gray-400">Ingresa el nombre y el UID de la tarjeta RFID</p>
        </CardHeader>
        <CardContent>
          <UserForm onSubmit={create} />
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Usuarios registrados</h2>
        </CardHeader>
        <UserTable users={users} loading={loading} onToggle={toggle} onDelete={remove} />
      </Card>
    </div>
  );
}
