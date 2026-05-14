'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { User, UserFormData } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { UserForm } from './_components/user-form';
import { ResetPasswordModal } from './_components/reset-password-modal';

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  // Fetch users — endpoint returns array directly or wrapped in { data: [...] }
  const { data: usersRaw, isLoading } = useQuery<unknown>({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
    enabled: currentUser?.role === 'admin',
  });

  // Normalise: backend may return an array or { data: [...] }
  const users: User[] = useMemo(() => {
    if (!usersRaw) return [];
    if (Array.isArray(usersRaw)) return usersRaw as User[];
    const wrapped = usersRaw as { data?: User[] };
    if (Array.isArray(wrapped.data)) return wrapped.data;
    return [];
  }, [usersRaw]);

  // Check whether any user in the list has the is_active field
  const hasIsActive = users.length > 0 && users[0].is_active !== undefined;

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado exitosamente');
      setCreateModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al crear el usuario');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) =>
      api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado exitosamente');
      setEditingUser(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al actualizar el usuario');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/users/${id}`, { is_active }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(vars.is_active ? 'Usuario activado' : 'Usuario desactivado');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al cambiar el estado del usuario');
    },
  });

  const handleCreate = (data: UserFormData) => createMutation.mutate(data);
  const handleEdit = (data: UserFormData) => {
    if (!editingUser) return;
    editMutation.mutate({ id: editingUser.id, data });
  };

  // Role badge helpers
  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      supervisor: 'bg-blue-100 text-blue-800',
      inspector: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      supervisor: 'Supervisor',
      inspector: 'Inspector',
      admin: 'Admin',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[role] ?? 'bg-gray-100 text-gray-800'
        }`}
      >
        {labels[role] ?? role}
      </span>
    );
  };

  const statusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );

  const columns = useMemo(() => {
    const cols = [
      {
        key: 'name',
        header: 'Nombre',
        render: (u: User) => (
          <span className="font-medium text-gray-900">{u.name}</span>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        render: (u: User) => <span className="text-gray-600">{u.email}</span>,
      },
      {
        key: 'role',
        header: 'Rol',
        render: (u: User) => roleBadge(u.role),
      },
      ...(hasIsActive
        ? [
            {
              key: 'is_active',
              header: 'Estado',
              render: (u: User) => statusBadge(u.is_active ?? true),
            },
          ]
        : []),
      {
        key: 'actions',
        header: 'Acciones',
        render: (u: User) => (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingUser(u)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Editar
            </button>
            {hasIsActive && (
              <button
                onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                className={`text-sm font-medium transition-colors ${
                  u.is_active
                    ? 'text-gray-500 hover:text-red-600'
                    : 'text-gray-500 hover:text-green-600'
                }`}
              >
                {u.is_active ? 'Desactivar' : 'Activar'}
              </button>
            )}
            <button
              onClick={() => setResetPasswordUser(u)}
              className="text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors"
            >
              Resetear clave
            </button>
          </div>
        ),
      },
    ];
    return cols;
  }, [hasIsActive]);

  // Guard: only admins can access this page
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios del sistema"
        actionLabel="Nuevo Usuario"
        onAction={() => setCreateModalOpen(true)}
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
      />

      {/* Create user modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Nuevo Usuario"
        size="md"
      >
        <UserForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit user modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Usuario"
        size="md"
      >
        {editingUser && (
          <UserForm
            initialData={editingUser}
            onSubmit={handleEdit}
            isLoading={editMutation.isPending}
          />
        )}
      </Modal>

      {/* Reset password modal */}
      {resetPasswordUser && (
        <ResetPasswordModal
          isOpen={!!resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          userId={resetPasswordUser.id}
          userName={resetPasswordUser.name}
        />
      )}
    </div>
  );
}
