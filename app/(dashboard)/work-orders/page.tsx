'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { WorkOrder, WorkOrderFormData, ApiResponse, User } from '@/types';
import { useCrud } from '@/hooks/use-crud';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { PageHeader } from '@/components/shared/page-header';
import { getWorkOrderColumns } from './_components/work-order-columns';
import { WorkOrderForm } from './_components/work-order-form';

export default function WorkOrdersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [inspectorFilter, setInspectorFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<WorkOrder | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { useList, useCreate, useUpdate, useDelete } = useCrud<WorkOrder, WorkOrderFormData>({
    endpoint: '/work-orders',
    queryKey: 'work-orders',
  });

  const { data: response, isLoading } = useList({
    search,
    page,
    per_page: 15,
    status: statusFilter || undefined,
    assigned_to: inspectorFilter || undefined,
  });
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const { data: usersResponse } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get<ApiResponse<User[]>>('/users'),
  });

  const handleOpenCreate = () => {
    setEditingOrder(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setModalOpen(true);
  };

  const handleOpenDelete = (order: WorkOrder) => {
    setDeletingOrder(order);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingOrder(null);
  };

  const handleSubmit = (data: WorkOrderFormData) => {
    if (editingOrder) {
      updateMutation.mutate(
        { id: editingOrder.id, data },
        {
          onSuccess: () => {
            toast.success('Orden actualizada exitosamente');
            handleCloseModal();
          },
          onError: (err) => {
            toast.error(err.message || 'Error al procesar la solicitud');
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Orden creada exitosamente');
          handleCloseModal();
        },
        onError: (err) => {
          toast.error(err.message || 'Error al procesar la solicitud');
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingOrder) return;
    deleteMutation.mutate(deletingOrder.id, {
      onSuccess: () => {
        toast.success('Orden eliminada exitosamente');
        setDeletingOrder(null);
      },
      onError: (err: unknown) => {
        // Extract backend message from axios error
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const msg = axiosErr?.response?.data?.message || (err as Error)?.message || 'Error al eliminar la orden';
        toast.error(msg);
        setDeletingOrder(null);
      },
    });
  };

  const handleView = useCallback((order: WorkOrder) => {
    router.push(`/work-orders/${order.id}`);
  }, [router]);

  const columns = useMemo(
    () => getWorkOrderColumns(handleOpenEdit, handleOpenDelete, handleView),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleView]
  );

  const users = usersResponse?.data ?? [];

  const statusOptions = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ];

  const inspectorOptions = users.map((u) => ({
    value: String(u.id),
    label: u.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Ordenes de Trabajo" actionLabel="Nueva Orden" onAction={handleOpenCreate} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Buscar ordenes..." />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={inspectorFilter}
            onChange={(e) => { setInspectorFilter(e.target.value); setPage(1); }}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos los inspectores</option>
            {inspectorOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={response?.data ?? []}
        isLoading={isLoading}
        pagination={response?.meta}
        onPageChange={setPage}
      />

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingOrder ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
        size="xl"
      >
        <WorkOrderForm
          initialData={editingOrder ?? undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Orden de Trabajo"
        message={`\u00BFEst\u00E1 seguro que desea eliminar la orden "${deletingOrder?.order_number}"? Esta acci\u00F3n no se puede deshacer.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
