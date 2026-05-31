'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import {
  ApiResponse,
  CategoryEquipmentField,
  CategoryEquipmentFieldFormData,
  PaginatedResponse,
  TemplateCategory,
} from '@/types';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { DataTable, Column } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryFieldForm } from './_components/field-form';

const TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Fecha',
  select: 'Selección',
  boolean: 'Sí/No',
};

export default function CategoryFieldsPage() {
  const params = useParams<{ id: string }>();
  const categoryId = Number(params?.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryEquipmentField | null>(null);
  const [deleting, setDeleting] = useState<CategoryEquipmentField | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // No GET-by-id endpoint yet, so locate the category from the list.
  const { data: catsResp } = useQuery<PaginatedResponse<TemplateCategory>>({
    queryKey: ['template-categories', { per_page: 100 }],
    queryFn: () => api.get('/template-categories?per_page=100'),
  });
  const category = catsResp?.data.find((c) => c.id === categoryId);

  const { data: fieldsResp, isLoading: loadingFields } = useQuery<ApiResponse<CategoryEquipmentField[]>>({
    queryKey: ['category-equipment-fields', categoryId],
    queryFn: () => api.get(`/template-categories/${categoryId}/equipment-fields`),
    enabled: !!categoryId,
  });
  const fields = fieldsResp?.data ?? [];

  const invalidateFields = () => {
    queryClient.invalidateQueries({ queryKey: ['category-equipment-fields', categoryId] });
  };

  const createMutation = useMutation<ApiResponse<CategoryEquipmentField>, Error, CategoryEquipmentFieldFormData>({
    mutationFn: (data) => api.post(`/template-categories/${categoryId}/equipment-fields`, data),
    onSuccess: () => {
      toast.success('Campo creado');
      invalidateFields();
      setModalOpen(false);
    },
    onError: (e) => toast.error(e.message || 'Error al crear campo'),
  });

  const updateMutation = useMutation<
    ApiResponse<CategoryEquipmentField>,
    Error,
    { id: number; data: Partial<CategoryEquipmentFieldFormData> }
  >({
    mutationFn: ({ id, data }) => api.patch(`/category-equipment-fields/${id}`, data),
    onSuccess: () => {
      toast.success('Campo actualizado');
      invalidateFields();
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.message || 'Error al actualizar campo'),
  });

  const deleteMutation = useMutation<ApiResponse<void>, Error, number>({
    mutationFn: (id) => api.delete(`/category-equipment-fields/${id}`),
    onSuccess: () => {
      toast.success('Campo eliminado');
      invalidateFields();
      setDeleting(null);
    },
    onError: (e) => toast.error(e.message || 'Error al eliminar campo'),
  });

  const handleSubmit = (data: CategoryEquipmentFieldFormData) => {
    if (editing) {
      // key_name is immutable
      const { key_name: _ignored, ...rest } = data;
      void _ignored;
      updateMutation.mutate({ id: editing.id, data: rest });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns: Column<CategoryEquipmentField>[] = useMemo(
    () => [
      { key: 'sort_order', header: 'Orden' },
      { key: 'key_name', header: 'Identificador' },
      { key: 'label', header: 'Etiqueta' },
      {
        key: 'type',
        header: 'Tipo',
        render: (f) => (
          <span className="text-sm text-gray-600">
            {TYPE_LABELS[f.type] ?? f.type}
            {f.unit && <span className="text-gray-400"> ({f.unit})</span>}
          </span>
        ),
      },
      {
        key: 'is_required',
        header: 'Req.',
        render: (f) => (f.is_required ? '✓' : '—'),
      },
      {
        key: 'is_mutable',
        header: 'Mutable',
        render: (f) => (f.is_mutable ? '✓' : <span className="text-orange-600">🔒</span>),
      },
      {
        key: 'actions',
        header: 'Acciones',
        render: (f) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(f);
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(f)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a categorías
        </Link>
      </div>

      <PageHeader
        title={`Campos de identificación${category ? ' — ' + category.name : ''}`}
        actionLabel="Nuevo Campo"
        onAction={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      />

      <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
        Los campos definidos acá son los que el inspector llena al iniciar la inspección de equipos de esta categoría
        (marca, modelo, dominio, chasis, etc.). Al enviar la inspección se sincronizan a <code>equipment.metadata</code>,
        respetando la regla <strong>NO mutable = solo se setea la primera vez</strong>.
      </div>

      <DataTable columns={columns} data={fields} isLoading={loadingFields} />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? `Editar campo: ${editing.label}` : 'Nuevo campo'}
        size="md"
      >
        <CategoryFieldForm
          initialData={editing ?? undefined}
          isEditing={!!editing}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Eliminar campo"
        message={`Eliminar el campo "${deleting?.label}"? Las respuestas históricas en inspecciones anteriores se mantienen pero no podrán seguir capturándose.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
