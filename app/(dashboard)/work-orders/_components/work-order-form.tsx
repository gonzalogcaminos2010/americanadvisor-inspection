'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  WorkOrder,
  WorkOrderFormData,
  InspectionRequest,
  InspectionTemplate,
  TemplateCategory,
  Equipment,
  User,
  PaginatedResponse,
  ApiResponse,
} from '@/types';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const optionalId = z.coerce
  .number()
  .optional()
  .or(z.literal(''))
  .transform((val) => (val === '' || val === 0 ? undefined : val));

const itemSchema = z.object({
  // 'equipment' = el admin sabe qué equipo es; 'category' = a determinar en
  // campo (el backend crea un placeholder y el inspector lo identifica).
  mode: z.enum(['equipment', 'category']),
  equipment_id: optionalId,
  category_id: optionalId,
  template_id: optionalId,
  inspector_id: optionalId,
  notes: z.string().optional(),
});

const workOrderSchema = z.object({
  inspection_request_id: z.coerce.number().min(1, 'La solicitud es requerida'),
  priority: z.string().min(1, 'La prioridad es requerida'),
  scheduled_date: z.string().min(1, 'La fecha programada es requerida'),
  notes: z.string().optional(),
  default_inspector_id: optionalId,
  default_template_id: optionalId,
  items: z.array(itemSchema).min(1, 'Agregue al menos un equipo'),
});

type FormValues = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  initialData?: WorkOrder;
  onSubmit: (data: WorkOrderFormData) => void;
  isLoading: boolean;
  preselectedRequest?: { id: number; priority?: string; due_date?: string };
}

function getEquipmentLabel(e: Equipment): string {
  const name = e.name || e.equipment_code || e.model || e.brand || `Equipo #${e.id}`;
  const detail = e.serial_number || e.model || '';
  return detail ? `${name} - ${detail}` : name;
}

function getRequestLabel(r: InspectionRequest): string {
  const number = r.number || r.request_number || `SOL-${r.id}`;
  const client = r.client?.name || 'Sin cliente';
  return `${number} - ${client}`;
}

export function WorkOrderForm({ initialData, onSubmit, isLoading, preselectedRequest }: WorkOrderFormProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: (initialData
      ? {
          inspection_request_id: initialData.inspection_request_id,
          priority: initialData.priority,
          scheduled_date: initialData.scheduled_date?.split('T')[0] ?? '',
          notes: initialData.notes ?? '',
          default_inspector_id: initialData.inspector_id ?? undefined,
          default_template_id: initialData.template_id ?? undefined,
          items: initialData.items && initialData.items.length > 0
            ? initialData.items.map((item) => ({
                mode: (item.equipment_id ? 'equipment' : 'category') as 'equipment' | 'category',
                equipment_id: item.equipment_id,
                category_id: item.category_id ?? undefined,
                template_id: item.template_id ?? undefined,
                inspector_id: item.inspector_id ?? undefined,
                notes: item.notes ?? '',
              }))
            : [{
                mode: 'equipment' as const,
                equipment_id: initialData.equipment_id,
                category_id: undefined,
                template_id: initialData.template_id ?? undefined,
                inspector_id: initialData.inspector_id ?? undefined,
                notes: '',
              }],
        }
      : {
          inspection_request_id: preselectedRequest?.id ?? ('' as unknown as number),
          priority: preselectedRequest?.priority || 'MEDIUM',
          scheduled_date: preselectedRequest?.due_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          default_inspector_id: '' as unknown as number,
          default_template_id: '' as unknown as number,
          items: [{ mode: 'equipment' as const, equipment_id: '' as unknown as number, category_id: undefined, template_id: undefined, inspector_id: undefined, notes: '' }],
        }) as FormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const inspectionRequestId = watch('inspection_request_id');

  const { data: requestsResponse } = useQuery({
    queryKey: ['inspection-requests-list'],
    queryFn: () =>
      api.get<PaginatedResponse<InspectionRequest>>('/inspection-requests?per_page=100'),
  });

  const { data: usersResponse } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get<ApiResponse<User[]>>('/users'),
  });

  const { data: templatesResponse } = useQuery({
    queryKey: ['inspection-templates-active'],
    queryFn: () =>
      api.get<PaginatedResponse<InspectionTemplate>>('/inspection-templates?is_active=true&per_page=100'),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['template-categories-active'],
    queryFn: () =>
      api.get<PaginatedResponse<TemplateCategory>>('/template-categories?per_page=100'),
  });

  const inspectionRequests = requestsResponse?.data ?? [];
  const users = Array.isArray(usersResponse)
    ? usersResponse
    : Array.isArray(usersResponse?.data)
      ? usersResponse.data
      : [];
  const templates = templatesResponse?.data ?? [];
  const categories = (categoriesResponse?.data ?? []).filter((c) => c.is_active);

  // Load equipment when request changes
  useEffect(() => {
    if (!inspectionRequestId) {
      setEquipmentList([]);
      return;
    }

    let cancelled = false;
    setLoadingEquipment(true);

    // Get client_id from selected request for fallback
    const selectedRequest = inspectionRequests.find(
      (r) => r.id === Number(inspectionRequestId)
    );
    const clientId = selectedRequest?.client_id ?? selectedRequest?.client?.id;

    // Try available-equipment first, fallback to client equipment
    api
      .get<{ success: boolean; data: Equipment[] }>(
        `/inspection-requests/${inspectionRequestId}/available-equipment`
      )
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (list.length > 0) {
          setEquipmentList(list);
          setLoadingEquipment(false);
        } else if (clientId) {
          // Fallback: load all equipment for the client
          return api
            .get<{ success: boolean; data: Equipment[] }>(
              `/equipment?client_id=${clientId}&per_page=100`
            )
            .then((fallback) => {
              if (cancelled) return;
              const fbList = Array.isArray(fallback)
                ? fallback
                : Array.isArray(fallback?.data)
                  ? fallback.data
                  : [];
              setEquipmentList(fbList);
              setLoadingEquipment(false);
            });
        } else {
          setLoadingEquipment(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback on error
        if (clientId) {
          api
            .get<{ success: boolean; data: Equipment[] }>(
              `/equipment?client_id=${clientId}&per_page=100`
            )
            .then((fallback) => {
              if (cancelled) return;
              const fbList = Array.isArray(fallback)
                ? fallback
                : Array.isArray(fallback?.data)
                  ? fallback.data
                  : [];
              setEquipmentList(fbList);
            })
            .catch(() => {
              if (!cancelled) setEquipmentList([]);
            })
            .finally(() => {
              if (!cancelled) setLoadingEquipment(false);
            });
        } else {
          setEquipmentList([]);
          setLoadingEquipment(false);
        }
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionRequestId, inspectionRequests.length]);

  const priorityOptions = [
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'URGENT', label: 'Urgente' },
  ];

  const equipmentOptions = equipmentList.map((e) => ({
    value: String(e.id),
    label: getEquipmentLabel(e),
  }));

  const userOptions = users.map((u: User) => ({
    value: String(u.id),
    label: u.name,
  }));

  const templateOptions = templates.map((t) => ({
    value: String(t.id),
    label: `${t.name} (${t.category})`,
  }));

  // Catch-all categories aren't meaningful for a "to be determined" order.
  const categoryOptions = categories
    .filter((c) => !['sin_clasificar', 'otro'].includes(c.code))
    .map((c) => ({
      value: String(c.id),
      label: c.name,
    }));

  const handleAddItem = useCallback(() => {
    append({ mode: 'equipment', equipment_id: 0, category_id: undefined, template_id: undefined, inspector_id: undefined, notes: '' });
  }, [append]);

  // Watch each item's mode so the equipment/category selector switches live.
  const watchedItems = watch('items');

  const handleFormSubmit = (values: FormValues) => {
    // Cross-field validation: each item needs an equipment (known) or a category.
    let hasError = false;
    values.items.forEach((item, i) => {
      if (item.mode === 'equipment' && !item.equipment_id) {
        setError(`items.${i}.equipment_id`, { message: 'Seleccione un equipo' });
        hasError = true;
      }
      if (item.mode === 'category') {
        if (!item.category_id) {
          setError(`items.${i}.category_id`, { message: 'Seleccione una categoría' });
          hasError = true;
        } else {
          // Category-only item has no equipment template, so the inspection
          // resolves its template from item -> default -> category default.
          // If none exists it can't start, so require one here.
          const cat = categories.find((c) => c.id === item.category_id);
          const resolvedTemplate =
            item.template_id ?? values.default_template_id ?? cat?.default_template_id ?? null;
          if (!resolvedTemplate) {
            setError(`items.${i}.template_id`, {
              message: 'Elegí plantilla (esta categoría no tiene una por defecto)',
            });
            hasError = true;
          }
        }
      }
    });
    if (hasError) return;

    const resolvedItems = values.items.map((item) => ({
      // Send equipment_id when known, category_id when "to be determined".
      equipment_id: item.mode === 'equipment' ? item.equipment_id : undefined,
      category_id: item.mode === 'category' ? item.category_id : undefined,
      template_id: item.template_id ?? values.default_template_id,
      inspector_id: item.inspector_id ?? values.default_inspector_id,
      notes: item.notes,
    }));
    const firstItem = resolvedItems[0];
    const data: WorkOrderFormData = {
      inspection_request_id: values.inspection_request_id,
      scheduled_date: values.scheduled_date,
      priority: values.priority,
      notes: values.notes,
      // Legacy root-level fields (only when the first item is a concrete equipment)
      equipment_id: firstItem?.equipment_id,
      inspector_id: firstItem?.inspector_id ?? values.default_inspector_id,
      template_id: firstItem?.template_id ?? values.default_template_id,
      items: resolvedItems,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* General info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Solicitud de Inspeccion *"
          error={errors.inspection_request_id?.message}
          placeholder="Seleccionar solicitud"
          disabled={!!preselectedRequest}
          options={inspectionRequests.map((r) => ({
            value: String(r.id),
            label: getRequestLabel(r),
          }))}
          {...register('inspection_request_id')}
        />
        <Select
          label="Prioridad *"
          error={errors.priority?.message}
          placeholder="Seleccionar prioridad"
          options={priorityOptions}
          {...register('priority')}
        />
        <Input
          label="Fecha Programada *"
          type="date"
          error={errors.scheduled_date?.message}
          {...register('scheduled_date')}
        />
      </div>

      {/* Defaults for all items */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Valores por defecto (se aplican a equipos sin asignacion propia)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Inspector por defecto"
            placeholder="Seleccionar inspector"
            options={userOptions}
            {...register('default_inspector_id')}
          />
          <Select
            label="Plantilla por defecto"
            placeholder="Seleccionar plantilla"
            options={templateOptions}
            {...register('default_template_id')}
          />
        </div>
      </div>

      {/* Items (equipment list) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Equipos a inspeccionar ({fields.length})
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddItem}
            disabled={!inspectionRequestId || loadingEquipment}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar Equipo
          </Button>
        </div>

        {errors.items?.message && (
          <p className="text-sm text-red-600 mb-2">{errors.items.message}</p>
        )}

        {!inspectionRequestId && (
          <p className="text-sm text-gray-500 italic py-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
            Seleccione una solicitud para ver los equipos disponibles
          </p>
        )}

        {inspectionRequestId && fields.length === 0 && (
          <p className="text-sm text-gray-500 italic py-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
            Agregue al menos un equipo
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center justify-center mt-5">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-3">
                  {/* Mode toggle: known equipment vs to-be-determined category */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ¿Se conoce el equipo?
                    </label>
                    <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setValue(`items.${index}.mode`, 'equipment', { shouldValidate: true })}
                        className={`px-3 py-1.5 text-sm font-medium ${
                          watchedItems?.[index]?.mode === 'equipment'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Equipo conocido
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue(`items.${index}.mode`, 'category', { shouldValidate: true })}
                        className={`px-3 py-1.5 text-sm font-medium border-l border-gray-300 ${
                          watchedItems?.[index]?.mode === 'category'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        A determinar (categoría)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {watchedItems?.[index]?.mode === 'category' ? (
                      <Select
                        label="Categoría *"
                        error={errors.items?.[index]?.category_id?.message}
                        placeholder="Seleccionar categoría"
                        options={categoryOptions}
                        {...register(`items.${index}.category_id`)}
                      />
                    ) : (
                      <Select
                        label="Equipo *"
                        error={errors.items?.[index]?.equipment_id?.message}
                        placeholder={loadingEquipment ? 'Cargando...' : 'Seleccionar equipo'}
                        disabled={loadingEquipment}
                        options={equipmentOptions}
                        {...register(`items.${index}.equipment_id`)}
                      />
                    )}
                    <Select
                      label="Inspector"
                      placeholder="Usar por defecto"
                      options={userOptions}
                      {...register(`items.${index}.inspector_id`)}
                    />
                    <Select
                      label={watchedItems?.[index]?.mode === 'category' ? 'Plantilla *' : 'Plantilla'}
                      placeholder="Usar por defecto"
                      error={errors.items?.[index]?.template_id?.message}
                      options={templateOptions}
                      {...register(`items.${index}.template_id`)}
                    />
                  </div>

                  {watchedItems?.[index]?.mode === 'category' && (
                    <p className="text-xs text-gray-500">
                      El inspector identificará el equipo (marca, modelo, dominio…) al hacer la inspección en campo.
                    </p>
                  )}
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex-shrink-0 mt-7 p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
        <textarea
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={2}
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Actualizar' : 'Crear Orden'}
        </Button>
      </div>
    </form>
  );
}
