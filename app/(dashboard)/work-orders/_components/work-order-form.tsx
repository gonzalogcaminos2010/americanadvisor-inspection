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

const itemSchema = z.object({
  equipment_id: z.coerce.number().min(1, 'Equipo requerido'),
  template_id: z.coerce
    .number()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === 0 ? undefined : val)),
  inspector_id: z.coerce
    .number()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === 0 ? undefined : val)),
  notes: z.string().optional(),
});

const workOrderSchema = z.object({
  inspection_request_id: z.coerce.number().min(1, 'La solicitud es requerida'),
  priority: z.string().min(1, 'La prioridad es requerida'),
  scheduled_date: z.string().min(1, 'La fecha programada es requerida'),
  notes: z.string().optional(),
  default_inspector_id: z.coerce
    .number()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === 0 ? undefined : val)),
  default_template_id: z.coerce
    .number()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === 0 ? undefined : val)),
  items: z.array(itemSchema).min(1, 'Agregue al menos un equipo'),
});

type FormValues = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  initialData?: WorkOrder;
  onSubmit: (data: WorkOrderFormData) => void;
  isLoading: boolean;
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

export function WorkOrderForm({ initialData, onSubmit, isLoading }: WorkOrderFormProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: initialData
      ? {
          inspection_request_id: initialData.inspection_request_id,
          priority: initialData.priority,
          scheduled_date: initialData.scheduled_date?.split('T')[0] ?? '',
          notes: initialData.notes ?? '',
          default_inspector_id: initialData.inspector_id ?? undefined,
          default_template_id: initialData.template_id ?? undefined,
          items: initialData.items && initialData.items.length > 0
            ? initialData.items.map((item) => ({
                equipment_id: item.equipment_id,
                template_id: item.template_id ?? undefined,
                inspector_id: item.inspector_id ?? undefined,
                notes: item.notes ?? '',
              }))
            : [{
                equipment_id: initialData.equipment_id,
                template_id: initialData.template_id ?? undefined,
                inspector_id: initialData.inspector_id ?? undefined,
                notes: '',
              }],
        }
      : {
          inspection_request_id: '' as unknown as number,
          priority: 'MEDIUM',
          scheduled_date: new Date().toISOString().split('T')[0],
          default_inspector_id: '' as unknown as number,
          default_template_id: '' as unknown as number,
          items: [{ equipment_id: '' as unknown as number, template_id: undefined, inspector_id: undefined, notes: '' }],
        },
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

  const inspectionRequests = requestsResponse?.data ?? [];
  const users = Array.isArray(usersResponse)
    ? usersResponse
    : Array.isArray(usersResponse?.data)
      ? usersResponse.data
      : [];
  const templates = templatesResponse?.data ?? [];

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

  const handleAddItem = useCallback(() => {
    append({ equipment_id: 0, template_id: undefined, inspector_id: undefined, notes: '' });
  }, [append]);

  const handleFormSubmit = (values: FormValues) => {
    const resolvedItems = values.items.map((item) => ({
      equipment_id: item.equipment_id,
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
      // Backend requires these at root level
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="Equipo *"
                    error={errors.items?.[index]?.equipment_id?.message}
                    placeholder={loadingEquipment ? 'Cargando...' : 'Seleccionar equipo'}
                    disabled={loadingEquipment}
                    options={equipmentOptions}
                    {...register(`items.${index}.equipment_id`)}
                  />
                  <Select
                    label="Inspector"
                    placeholder="Usar por defecto"
                    options={userOptions}
                    {...register(`items.${index}.inspector_id`)}
                  />
                  <Select
                    label="Plantilla"
                    placeholder="Usar por defecto"
                    options={templateOptions}
                    {...register(`items.${index}.template_id`)}
                  />
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
