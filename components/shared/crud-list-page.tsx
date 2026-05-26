'use client';

import { useMemo, useState, ReactNode } from 'react';
import { useCrud } from '@/hooks/use-crud';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable, Column } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { PageHeader } from '@/components/shared/page-header';

// Módulo de listado: absorbe el contorno repetido de las páginas-lista gemelas
// (estado de búsqueda/filtros, paginación, modal de alta/edición, borrado con
// confirmación, toasts y el armado de tabla). Cada página declara solo su config.
// Las "ovejas negras" (usuarios, templates, categories) NO usan esto.

export interface CrudFilter {
  /** Nombre del parámetro que se manda a la API (ej. 'status', 'client_id'). */
  key: string;
  /** Texto de la opción "todos" (ej. 'Todos los estados'). */
  placeholder: string;
  options: { value: string; label: string }[];
  /** Clase de ancho Tailwind. Default 'sm:w-48'. */
  widthClass?: string;
}

export interface RowActions<T> {
  /** Abre el modal de edición con este ítem. */
  edit: (item: T) => void;
  /** Abre el diálogo de confirmación de borrado. */
  remove: (item: T) => void;
}

export interface CrudListPageProps<T extends { id: number }, F> {
  endpoint: string;
  queryKey: string;
  title: string;
  description?: string;
  searchPlaceholder?: string;
  /** Etiqueta del botón "Nuevo …". Si se omite, no hay alta. */
  createLabel?: string;
  /** Render del formulario de alta/edición. Si se omite, no hay modal. */
  renderForm?: (props: {
    initialData?: T;
    onSubmit: (data: F) => void;
    isLoading: boolean;
  }) => ReactNode;
  /** Construye las columnas; recibe las acciones de fila que maneja el módulo. */
  columns: (actions: RowActions<T>) => Column<T>[];
  filters?: CrudFilter[];
  /** Título del modal. Default: 'Nuevo' / 'Editar'. */
  modalTitle?: (editing: T | null) => string;
  /** Diálogo de borrado. Si se omite, no hay borrado. */
  deleteConfirm?: { title: string; message: (item: T) => string };
  /** Toasts (es-AR tiene género: "creado"/"creada"). */
  toasts?: { created?: string; updated?: string; deleted?: string };
  /** Hook tras crear con éxito (ej. navegar al detalle). */
  onCreated?: (created: T) => void;
}

const FILTER_SELECT_CLASS =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message || (err as Error)?.message || fallback;
}

export function CrudListPage<T extends { id: number }, F>({
  endpoint,
  queryKey,
  title,
  description,
  searchPlaceholder,
  createLabel,
  renderForm,
  columns,
  filters,
  modalTitle,
  deleteConfirm,
  toasts,
  onCreated,
}: CrudListPageProps<T, F>) {
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const { useList, useCreate, useUpdate, useDelete } = useCrud<T, F>({ endpoint, queryKey });

  const { data: response, isLoading } = useList({
    search,
    page,
    per_page: 15,
    ...filterValues,
  });
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const rowActions: RowActions<T> = useMemo(
    () => ({
      edit: (item) => {
        setEditing(item);
        setModalOpen(true);
      },
      remove: (item) => setDeleting(item),
    }),
    [],
  );

  const tableColumns = useMemo(() => columns(rowActions), [columns, rowActions]);

  const handleSubmit = (data: F) => {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            toast.success(toasts?.updated ?? 'Actualizado exitosamente');
            closeModal();
          },
          onError: (err) => toast.error(extractErrorMessage(err, 'Error al procesar la solicitud')),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (res) => {
          toast.success(toasts?.created ?? 'Creado exitosamente');
          closeModal();
          const created = (res as { data?: T })?.data;
          if (created && onCreated) onCreated(created);
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Error al procesar la solicitud')),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(toasts?.deleted ?? 'Eliminado exitosamente');
        setDeleting(null);
      },
      onError: (err) => {
        toast.error(extractErrorMessage(err, 'Error al eliminar'));
        setDeleting(null);
      },
    });
  };

  const resolvedModalTitle = modalTitle
    ? modalTitle(editing)
    : editing
      ? 'Editar'
      : 'Nuevo';

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actionLabel={createLabel}
        onAction={createLabel ? openCreate : undefined}
      />

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder={searchPlaceholder ?? 'Buscar...'}
          />
        </div>
        {filters?.map((filter) => (
          <div key={filter.key} className={`w-full ${filter.widthClass ?? 'sm:w-48'}`}>
            <select
              value={filterValues[filter.key] ?? ''}
              onChange={(e) => {
                setFilterValues((prev) => ({ ...prev, [filter.key]: e.target.value }));
                setPage(1);
              }}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">{filter.placeholder}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <DataTable
        columns={tableColumns}
        data={response?.data ?? []}
        isLoading={isLoading}
        pagination={response?.meta}
        onPageChange={setPage}
      />

      {renderForm && (
        <Modal isOpen={modalOpen} onClose={closeModal} title={resolvedModalTitle} size="xl">
          {renderForm({
            initialData: editing ?? undefined,
            onSubmit: handleSubmit,
            isLoading: createMutation.isPending || updateMutation.isPending,
          })}
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleConfirmDelete}
          title={deleteConfirm.title}
          message={deleting ? deleteConfirm.message(deleting) : ''}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
