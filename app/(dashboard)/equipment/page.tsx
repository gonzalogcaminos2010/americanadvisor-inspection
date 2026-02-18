'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCrud } from '@/hooks/use-crud';
import { Equipment, EquipmentFormData, PaginatedResponse, Client } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/shared/page-header';
import { SearchBar } from '@/components/shared/search-bar';
import { DataTable } from '@/components/shared/data-table';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { getEquipmentColumns } from './_components/equipment-columns';
import { EquipmentForm } from './_components/equipment-form';

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [clientFilter, setClientFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);

  const { toast } = useToast();
  const { useList, useCreate, useUpdate, useDelete } = useCrud<Equipment, EquipmentFormData>({
    endpoint: '/equipment',
    queryKey: 'equipment',
  });

  const { data, isLoading } = useList({ search, page, per_page: 15, client_id: clientFilter || undefined });
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const { data: clientsData } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients-select'],
    queryFn: () => api.get<PaginatedResponse<Client>>('/clients?active=true&per_page=100'),
  });

  const clientOptions = [
    { value: '', label: 'Todos los clientes' },
    ...(clientsData?.data || []).map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
  ];

  const handleCreate = (formData: EquipmentFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Equipo creado exitosamente');
        setModalOpen(false);
      },
      onError: () => {
        toast.error('Error al crear el equipo');
      },
    });
  };

  const handleUpdate = (formData: EquipmentFormData) => {
    if (!editingEquipment) return;
    updateMutation.mutate(
      { id: editingEquipment.id, data: formData },
      {
        onSuccess: () => {
          toast.success('Equipo actualizado exitosamente');
          setEditingEquipment(null);
          setModalOpen(false);
        },
        onError: () => {
          toast.error('Error al actualizar el equipo');
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingEquipment) return;
    deleteMutation.mutate(deletingEquipment.id, {
      onSuccess: () => {
        toast.success('Equipo eliminado exitosamente');
        setDeletingEquipment(null);
      },
      onError: () => {
        toast.error('Error al eliminar el equipo');
      },
    });
  };

  const openCreateModal = () => {
    setEditingEquipment(null);
    setModalOpen(true);
  };

  const openEditModal = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setModalOpen(true);
  };

  const columns = getEquipmentColumns(openEditModal, (eq) => setDeletingEquipment(eq));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipos"
        description="Gestiona los equipos registrados"
        actionLabel="Nuevo Equipo"
        onAction={openCreateModal}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar equipos..." />
        </div>
        <div className="w-full sm:w-64">
          <Select
            options={clientOptions}
            value={clientFilter}
            onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
            placeholder="Filtrar por cliente"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pagination={data?.meta}
        onPageChange={setPage}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEquipment(null); }}
        title={editingEquipment ? 'Editar Equipo' : 'Nuevo Equipo'}
        size="xl"
      >
        <EquipmentForm
          key={editingEquipment?.id ?? 'new'}
          initialData={editingEquipment ?? undefined}
          onSubmit={editingEquipment ? handleUpdate : handleCreate}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingEquipment}
        onClose={() => setDeletingEquipment(null)}
        onConfirm={handleDelete}
        title="Eliminar Equipo"
        message={`Esta seguro que desea eliminar el equipo "${deletingEquipment?.name}"? Esta accion no se puede deshacer.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
