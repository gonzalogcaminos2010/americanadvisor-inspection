'use client';

import { useRouter } from 'next/navigation';
import { Client, ClientFormData } from '@/types';
import { CrudListPage } from '@/components/shared/crud-list-page';
import { getClientColumns } from './_components/client-columns';
import { ClientForm } from './_components/client-form';

export default function ClientsPage() {
  const router = useRouter();

  return (
    <CrudListPage<Client, ClientFormData>
      endpoint="/clients"
      queryKey="clients"
      title="Clientes"
      createLabel="Nuevo Cliente"
      searchPlaceholder="Buscar clientes..."
      columns={({ edit, remove }) =>
        getClientColumns(edit, remove, (c) => router.push(`/clients/${c.id}`))
      }
      renderForm={(props) => <ClientForm {...props} />}
      modalTitle={(editing) => (editing ? 'Editar Cliente' : 'Nuevo Cliente')}
      deleteConfirm={{
        title: 'Eliminar Cliente',
        message: (c) =>
          `¿Está seguro que desea eliminar al cliente "${c.name}"? Esta acción no se puede deshacer.`,
      }}
      toasts={{
        created: 'Cliente creado exitosamente',
        updated: 'Cliente actualizado exitosamente',
        deleted: 'Cliente eliminado exitosamente',
      }}
    />
  );
}
