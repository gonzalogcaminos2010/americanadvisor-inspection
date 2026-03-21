'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  InspectionRequest,
  InspectionRequestFormData,
  Client,
  ServiceType,
  PaginatedResponse,
  ApiResponse,
} from '@/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  const seq = Date.now().toString(36).slice(-4).toUpperCase();
  return `SOL-${year}-${seq}`;
}

const requestSchema = z.object({
  client_id: z.coerce.number().min(1, 'Seleccione un cliente'),
  service_type_id: z.coerce.number().min(1, 'Seleccione un tipo de servicio'),
  request_number: z.string().min(1, 'El número de solicitud es requerido'),
  request_date: z.string().min(1, 'La fecha de solicitud es requerida'),
  due_date: z.string().optional(),
  priority: z.string().min(1, 'Seleccione una prioridad'),
  inspection_type: z.string().min(1, 'Seleccione un tipo de inspección'),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.coerce.number().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestFormProps {
  initialData?: InspectionRequest;
  onSubmit: (data: InspectionRequestFormData) => void;
  isLoading?: boolean;
}

export function RequestForm({ initialData, onSubmit, isLoading }: RequestFormProps) {
  const { data: clientsResponse, isLoading: clientsLoading } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients-active'],
    queryFn: () => api.get('/clients?active=true&per_page=100'),
  });

  const { data: serviceTypesResponse, isLoading: serviceTypesLoading } = useQuery<ApiResponse<ServiceType[]>>({
    queryKey: ['service-types'],
    queryFn: () => api.get('/service-types'),
  });

  const clients = clientsResponse?.data ?? [];
  const rawST = serviceTypesResponse;
  const serviceTypes: ServiceType[] = Array.isArray(rawST)
    ? rawST
    : Array.isArray((rawST as ApiResponse<ServiceType[]>)?.data)
      ? (rawST as ApiResponse<ServiceType[]>).data
      : [];

  const today = new Date().toISOString().split('T')[0];
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: initialData
      ? {
          client_id: initialData.client_id,
          service_type_id: initialData.service_type_id,
          request_number: initialData.number || initialData.request_number || '',
          request_date: initialData.request_date?.split('T')[0] ?? today,
          due_date: initialData.due_date?.split('T')[0] ?? '',
          priority: initialData.priority ?? '',
          inspection_type: initialData.inspection_type ?? '',
          description: initialData.description ?? '',
          amount: initialData.amount ?? undefined,
          currency: initialData.currency ?? 'ARS',
          notes: initialData.notes ?? '',
        }
      : {
          request_number: generateRequestNumber(),
          request_date: today,
          currency: 'ARS',
          inspection_type: 'PREVENTIVE',
          priority: 'MEDIUM',
        },
  });

  const handleFormSubmit = (values: RequestFormValues) => {
    const data: InspectionRequestFormData = {
      client_id: values.client_id,
      service_type_id: values.service_type_id,
      request_number: values.request_number,
      request_date: values.request_date,
      priority: values.priority,
      inspection_type: values.inspection_type,
      description: values.description,
    };
    if (values.due_date) data.due_date = values.due_date;
    if (values.amount) data.amount = values.amount;
    if (values.currency) data.currency = values.currency;
    if (values.notes) data.notes = values.notes;
    onSubmit(data);
  };

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.name }));
  const serviceTypeOptions = serviceTypes.map((st) => ({ value: String(st.id), label: st.name }));
  const priorityOptions = [
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'URGENT', label: 'Urgente' },
  ];
  const inspectionTypeOptions = [
    { value: 'PREVENTIVE', label: 'Preventiva' },
    { value: 'CORRECTIVE', label: 'Correctiva' },
    { value: 'CERTIFICATION', label: 'Certificación' },
    { value: 'ROUTINE', label: 'Rutinaria' },
    { value: 'PRE_USE', label: 'Pre-uso' },
  ];
  const currencyOptions = [
    { value: 'ARS', label: 'ARS (Peso Argentino)' },
    { value: 'USD', label: 'USD (Dólar)' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="N° Solicitud"
          error={errors.request_number?.message}
          readOnly={!isEditing}
          className={!isEditing ? 'bg-gray-100' : ''}
          {...register('request_number')}
        />
        <Select
          label="Cliente *"
          placeholder="Seleccionar cliente"
          options={clientOptions}
          disabled={clientsLoading}
          error={errors.client_id?.message}
          {...register('client_id')}
        />
        <Select
          label="Tipo de Servicio *"
          placeholder="Seleccionar tipo de servicio"
          options={serviceTypeOptions}
          disabled={serviceTypesLoading}
          error={errors.service_type_id?.message}
          {...register('service_type_id')}
        />
        <Select
          label="Tipo de Inspección *"
          placeholder="Seleccionar tipo"
          options={inspectionTypeOptions}
          error={errors.inspection_type?.message}
          {...register('inspection_type')}
        />
        <Select
          label="Prioridad *"
          placeholder="Seleccionar prioridad"
          options={priorityOptions}
          error={errors.priority?.message}
          {...register('priority')}
        />
        <Input
          label="Fecha de Solicitud *"
          type="date"
          error={errors.request_date?.message}
          {...register('request_date')}
        />
        <Input
          label="Fecha Límite"
          type="date"
          error={errors.due_date?.message}
          {...register('due_date')}
        />
        <Input
          label="Monto"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Select
          label="Moneda"
          options={currencyOptions}
          error={errors.currency?.message}
          {...register('currency')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descripción *
          </label>
          <textarea
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Describa el motivo y alcance de la inspección..."
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
          <textarea
            rows={2}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register('notes')}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Actualizar' : 'Crear'} Solicitud
        </Button>
      </div>
    </form>
  );
}
