'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ApiResponse, TemplateCategory, TemplateCategoryFormData } from '@/types';
import { useCrud } from '@/hooks/use-crud';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { getCategoryColumns } from './_components/category-columns';
import { CategoryForm } from './_components/category-form';

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<TemplateCategory | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useList, useCreate, useDelete } = useCrud<TemplateCategory, TemplateCategoryFormData>({
    endpoint: '/template-categories',
    queryKey: 'template-categories',
  });

  const { data: response, isLoading } = useList({ page, per_page: 50 });
  const createMutation = useCreate();
  const deleteMutation = useDelete();

  // Backend exposes PATCH (not PUT) for updates, so we don't use useCrud.useUpdate.
  const updateMutation = useMutation<
    ApiResponse<TemplateCategory>,
    Error,
    { id: number; data: Partial<TemplateCategoryFormData> }
  >({
    mutationFn: ({ id, data }) => api.patch(`/template-categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-categories'] });
      queryClient.invalidateQueries({ queryKey: ['template-categories-active'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (category: TemplateCategory) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleOpenDelete = (category: TemplateCategory) => {
    setDeletingCategory(category);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const refreshActiveList = () => {
    queryClient.invalidateQueries({ queryKey: ['template-categories-active'] });
  };

  const handleSubmit = (data: TemplateCategoryFormData) => {
    if (editingCategory) {
      // code is immutable on the backend: only send name + is_active
      updateMutation.mutate(
        { id: editingCategory.id, data: { name: data.name, is_active: data.is_active } },
        {
          onSuccess: () => {
            toast.success('Categoria actualizada');
            refreshActiveList();
            handleCloseModal();
          },
          onError: (err) => toast.error(err.message || 'Error al procesar la solicitud'),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Categoria creada');
          refreshActiveList();
          handleCloseModal();
        },
        onError: (err) => toast.error(err.message || 'Error al procesar la solicitud'),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    deleteMutation.mutate(deletingCategory.id, {
      onSuccess: () => {
        toast.success('Categoria eliminada');
        refreshActiveList();
        setDeletingCategory(null);
      },
      onError: (err) => toast.error(err.message || 'Error al procesar la solicitud'),
    });
  };

  const columns = useMemo(() => getCategoryColumns(handleOpenEdit, handleOpenDelete), []);

  return (
    <div className="space-y-6">
      <PageHeader title="Categorias" actionLabel="Nueva Categoria" onAction={handleOpenCreate} />

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
        title={editingCategory ? 'Editar Categoria' : 'Nueva Categoria'}
        size="md"
      >
        <CategoryForm
          initialData={editingCategory ?? undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Categoria"
        message={`Eliminar la categoria "${deletingCategory?.name}"? Si hay plantillas usandola, se desactivara (soft delete). Si no, se eliminara definitivamente.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
