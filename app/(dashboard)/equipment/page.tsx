'use client';

import { useQuery } from '@tanstack/react-query';
import { Equipment, EquipmentFormData, PaginatedResponse, Client } from '@/types';
import { api } from '@/lib/api';
import { CrudListPage } from '@/components/shared/crud-list-page';
import { getEquipmentColumns } from './_components/equipment-columns';
import { EquipmentForm } from './_components/equipment-form';

export default function EquipmentPage() {
  const { data: clientsData } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients-select'],
    queryFn: () => api.get<PaginatedResponse<Client>>('/clients?active=true&per_page=100'),
  });

  const clientOptions = (clientsData?.data || []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return (
    <CrudListPage<Equipment, EquipmentFormData>
      endpoint="/equipment"
      queryKey="equipment"
      title="Equipos"
      description="Gestiona los equipos registrados"
      createLabel="Nuevo Equipo"
      searchPlaceholder="Buscar equipos..."
      filters={[
        {
          key: 'client_id',
          placeholder: 'Todos los clientes',
          options: clientOptions,
          widthClass: 'sm:w-64',
        },
      ]}
      columns={({ edit, remove }) => getEquipmentColumns(edit, remove)}
      renderForm={(props) => <EquipmentForm {...props} />}
      modalTitle={(editing) => (editing ? 'Editar Equipo' : 'Nuevo Equipo')}
      deleteConfirm={{
        title: 'Eliminar Equipo',
        message: (e) =>
          `Esta seguro que desea eliminar el equipo "${e.name}"? Esta accion no se puede deshacer.`,
      }}
      toasts={{
        created: 'Equipo creado exitosamente',
        updated: 'Equipo actualizado exitosamente',
        deleted: 'Equipo eliminado exitosamente',
      }}
    />
  );
}
