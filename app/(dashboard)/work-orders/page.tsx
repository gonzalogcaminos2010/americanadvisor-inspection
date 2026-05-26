'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { WorkOrder, WorkOrderFormData, ApiResponse, User } from '@/types';
import { api } from '@/lib/api';
import { CrudListPage } from '@/components/shared/crud-list-page';
import { getWorkOrderColumns } from './_components/work-order-columns';
import { WorkOrderForm } from './_components/work-order-form';

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En Progreso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export default function WorkOrdersPage() {
  const router = useRouter();

  const { data: usersResponse } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get<ApiResponse<User[]>>('/users'),
  });

  const inspectorOptions = (usersResponse?.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.name,
  }));

  return (
    <CrudListPage<WorkOrder, WorkOrderFormData>
      endpoint="/work-orders"
      queryKey="work-orders"
      title="Ordenes de Trabajo"
      createLabel="Nueva Orden"
      searchPlaceholder="Buscar ordenes..."
      filters={[
        { key: 'status', placeholder: 'Todos los estados', options: statusOptions },
        { key: 'inspector_id', placeholder: 'Todos los inspectores', options: inspectorOptions },
      ]}
      columns={({ edit, remove }) =>
        getWorkOrderColumns(edit, remove, (o) => router.push(`/work-orders/${o.id}`))
      }
      renderForm={(props) => <WorkOrderForm {...props} />}
      modalTitle={(editing) => (editing ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo')}
      deleteConfirm={{
        title: 'Eliminar Orden de Trabajo',
        message: (o) =>
          `¿Está seguro que desea eliminar la orden "${o.order_number}"? Esta acción no se puede deshacer.`,
      }}
      toasts={{
        created: 'Orden creada exitosamente',
        updated: 'Orden actualizada exitosamente',
        deleted: 'Orden eliminada exitosamente',
      }}
      onCreated={(created) => router.push(`/work-orders/${created.id}`)}
    />
  );
}
