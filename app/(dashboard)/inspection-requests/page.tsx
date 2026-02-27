'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCrud } from '@/hooks/use-crud';
import { api } from '@/lib/api';
import {
  InspectionRequest,
  InspectionRequestFormData,
  InspectionRequestStatus,
  Client,
  PaginatedResponse,
} from '@/types';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { PageHeader } from '@/components/shared/page-header';
import { getRequestColumns } from './_components/request-columns';
import { RequestForm } from './_components/request-form';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: InspectionRequestStatus.PENDING, label: 'Pendiente' },
  { value: InspectionRequestStatus.APPROVED, label: 'Aprobado' },
  { value: InspectionRequestStatus.IN_PROGRESS, label: 'En Progreso' },
  { value: InspectionRequestStatus.COMPLETED, label: 'Completado' },
  { value: InspectionRequestStatus.CANCELLED, label: 'Cancelado' },
];

export default function InspectionRequestsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<InspectionRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<InspectionRequest | null>(null);

  const { toast } = useToast();
  const { useList, useCreate, useUpdate, useDelete } = useCrud<InspectionRequest, InspectionRequestFormData>({
    endpoint: '/inspection-requests',
    queryKey: 'inspection-requests',
  });

  const { data: listData, isLoading } = useList({
    search,
    page,
    per_page: 15,
    status: statusFilter || undefined,
    client_id: clientFilter || undefined,
  });

  const { data: clientsData } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients-filter'],
    queryFn: () => api.get('/clients?active=true&per_page=100'),
  });

  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const clients = clientsData?.data ?? [];

  const extractError = (err: unknown): string => {
    const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
    const backendMsg = axiosErr?.response?.data?.message;
    const validationErrors = axiosErr?.response?.data?.errors;
    if (validationErrors) {
      const firstError = Object.values(validationErrors).flat()[0];
      if (firstError) return firstError;
    }
    return backendMsg || axiosErr?.message || 'Error al procesar la solicitud';
  };

  const handleCreate = (data: InspectionRequestFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Solicitud creada exitosamente');
        setModalOpen(false);
      },
      onError: (err) => {
        toast.error(extractError(err));
      },
    });
  };

  const handleUpdate = (data: InspectionRequestFormData) => {
    if (!editingRequest) return;
    updateMutation.mutate(
      { id: editingRequest.id, data },
      {
        onSuccess: () => {
          toast.success('Solicitud actualizada exitosamente');
          setEditingRequest(null);
        },
        onError: (err) => {
          toast.error(extractError(err));
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingRequest) return;
    deleteMutation.mutate(deletingRequest.id, {
      onSuccess: () => {
        toast.success('Solicitud eliminada exitosamente');
        setDeletingRequest(null);
      },
      onError: (err) => {
        toast.error(extractError(err));
      },
    });
  };

  const router = useRouter();

  const handleView = useCallback((request: InspectionRequest) => {
    router.push(`/inspection-requests/${request.id}`);
  }, [router]);

  const columns = useMemo(() => getRequestColumns(
    (request) => setEditingRequest(request),
    (request) => setDeletingRequest(request),
    handleView
  ), [handleView]);

  return (
    <div>
      <PageHeader
        title="Solicitudes de Inspecci\u00f3n"
        description="Gestiona las solicitudes de inspecci\u00f3n de tus clientes"
        actionLabel="Nueva Solicitud"
        onAction={() => setModalOpen(true)}
      />

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Buscar por n\u00famero de solicitud..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={clientFilter}
          onChange={(e) => {
            setClientFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos los clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={String(client.id)}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={listData?.data ?? []}
          isLoading={isLoading}
          pagination={listData?.meta}
          onPageChange={setPage}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Solicitud de Inspecci\u00f3n"
        size="xl"
      >
        <RequestForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
      </Modal>

      <Modal
        isOpen={!!editingRequest}
        onClose={() => setEditingRequest(null)}
        title="Editar Solicitud de Inspecci\u00f3n"
        size="xl"
      >
        {editingRequest && (
          <RequestForm
            initialData={editingRequest}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingRequest}
        onClose={() => setDeletingRequest(null)}
        onConfirm={handleDelete}
        title="Eliminar Solicitud"
        message={`\u00bfEst\u00e1 seguro de eliminar la solicitud ${deletingRequest?.number ?? deletingRequest?.request_number ?? ''}? Esta acci\u00f3n no se puede deshacer.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
