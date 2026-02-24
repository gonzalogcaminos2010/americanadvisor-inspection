'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { WorkOrder, WorkOrderFormData, InspectionRequest, Equipment, User, PaginatedResponse, ApiResponse } from '@/types';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const workOrderSchema = z.object({
  inspection_request_id: z.coerce.number().min(1, 'La solicitud es requerida'),
  equipment_id: z.coerce.number().min(1, 'El equipo es requerido'),
  assigned_to: z.coerce
    .number()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === 0 ? undefined : val)),
  priority: z.string().min(1, 'La prioridad es requerida'),
  scheduled_date: z.string().min(1, 'La fecha programada es requerida'),
  notes: z.string().optional(),
});

interface WorkOrderFormProps {
  initialData?: WorkOrder;
  onSubmit: (data: WorkOrderFormData) => void;
  isLoading: boolean;
}

// Helper to get equipment display name from whatever fields are available
function getEquipmentLabel(e: Equipment): string {
  const name = e.name || e.equipment_code || e.model || e.brand || `Equipo #${e.id}`;
  const detail = e.serial_number || e.model || '';
  return detail ? `${name} - ${detail}` : name;
}

// Helper to get request display label
function getRequestLabel(r: InspectionRequest): string {
  const number = r.request_number || `SOL-${r.id}`;
  const client = r.client?.name || 'Sin cliente';
  return `${number} - ${client}`;
}

export function WorkOrderForm({ initialData, onSubmit, isLoading }: WorkOrderFormProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: initialData
      ? {
          inspection_request_id: initialData.inspection_request_id,
          equipment_id: initialData.equipment_id,
          assigned_to: initialData.assigned_to ?? undefined,
          priority: initialData.priority,
          scheduled_date: initialData.scheduled_date ?? '',
          notes: initialData.notes ?? '',
        }
      : {
          priority: 'MEDIUM',
          scheduled_date: new Date().toISOString().split('T')[0],
        },
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

  useEffect(() => {
    if (!inspectionRequestId) {
      setEquipmentList([]);
      return;
    }

    let cancelled = false;
    setLoadingEquipment(true);

    api
      .get<{ success: boolean; data: Equipment[] }>(
        `/inspection-requests/${inspectionRequestId}/available-equipment`
      )
      .then((res) => {
        if (cancelled) return;
        // Handle both response formats: { data: [...] } or just [...]
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setEquipmentList(list);
        // Reset equipment selection when changing request (only for new orders)
        if (!initialData) {
          setValue('equipment_id', '' as unknown as number);
        }
      })
      .catch(() => {
        if (!cancelled) setEquipmentList([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEquipment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inspectionRequestId, setValue, initialData]);

  const inspectionRequests = requestsResponse?.data ?? [];
  // Handle both { data: [...] } and [...] for users
  const users = Array.isArray(usersResponse)
    ? usersResponse
    : Array.isArray(usersResponse?.data)
      ? usersResponse.data
      : [];

  const priorityOptions = [
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'URGENT', label: 'Urgente' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Solicitud de Inspección *"
          error={errors.inspection_request_id?.message}
          placeholder="Seleccionar solicitud"
          options={inspectionRequests.map((r) => ({
            value: String(r.id),
            label: getRequestLabel(r),
          }))}
          {...register('inspection_request_id')}
        />
        <Select
          label="Equipo *"
          error={errors.equipment_id?.message}
          placeholder={
            loadingEquipment
              ? 'Cargando equipos...'
              : !inspectionRequestId
                ? 'Primero seleccione una solicitud'
                : 'Seleccionar equipo'
          }
          disabled={!inspectionRequestId || loadingEquipment}
          options={equipmentList.map((e) => ({
            value: String(e.id),
            label: getEquipmentLabel(e),
          }))}
          {...register('equipment_id')}
        />
        <Select
          label="Prioridad *"
          error={errors.priority?.message}
          placeholder="Seleccionar prioridad"
          options={priorityOptions}
          {...register('priority')}
        />
        <Select
          label="Inspector"
          error={errors.assigned_to?.message}
          placeholder="Sin asignar"
          options={users.map((u: User) => ({
            value: String(u.id),
            label: u.name,
          }))}
          {...register('assigned_to')}
        />
        <Input
          label="Fecha Programada"
          type="date"
          error={errors.scheduled_date?.message}
          {...register('scheduled_date')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
        <textarea
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
          {...register('notes')}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
