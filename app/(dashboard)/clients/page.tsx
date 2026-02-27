'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Client, ClientFormData } from '@/types';
import { useCrud } from '@/hooks/use-crud';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { PageHeader } from '@/components/shared/page-header';
import { getClientColumns } from './_components/client-columns';
import { ClientForm } from './_components/client-form';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { useList, useCreate, useUpdate, useDelete } = useCrud<Client, ClientFormData>({
    endpoint: '/clients',
    queryKey: 'clients',
  });

  const { data: response, isLoading } = useList({ search, page, per_page: 15 });
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const handleOpenCreate = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const handleOpenDelete = (client: Client) => {
    setDeletingClient(client);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingClient(null);
  };

  const handleSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate(
        { id: editingClient.id, data },
        {
          onSuccess: () => {
            toast.success('Cliente actualizado exitosamente');
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
          toast.success('Cliente creado exitosamente');
          handleCloseModal();
        },
        onError: (err) => {
          toast.error(err.message || 'Error al procesar la solicitud');
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingClient) return;
    deleteMutation.mutate(deletingClient.id, {
      onSuccess: () => {
        toast.success('Cliente eliminado exitosamente');
        setDeletingClient(null);
      },
      onError: (err) => {
        toast.error(err.message || 'Error al procesar la solicitud');
      },
    });
  };

  const handleView = useCallback((client: Client) => {
    router.push(`/clients/${client.id}`);
  }, [router]);

  const columns = useMemo(
    () => getClientColumns(handleOpenEdit, handleOpenDelete, handleView),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleView]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" actionLabel="Nuevo Cliente" onAction={handleOpenCreate} />

      <SearchBar value={search} onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Buscar clientes..." />

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
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="xl"
      >
        <ClientForm
          initialData={editingClient ?? undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Cliente"
        message={`¿Está seguro que desea eliminar al cliente "${deletingClient?.name}"? Esta acción no se puede deshacer.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
