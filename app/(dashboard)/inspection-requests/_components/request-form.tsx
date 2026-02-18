'use client';

import { useEffect } from 'react';
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

const requestSchema = z.object({
  client_id: z.coerce.number().min(1, 'Seleccione un cliente'),
  service_type_id: z.coerce.number().min(1, 'Seleccione un tipo de servicio'),
  request_date: z.string().min(1, 'La fecha de solicitud es requerida'),
  due_date: z.string().optional(),
  priority: z.string().min(1, 'Seleccione una prioridad'),
  amount: z.coerce.number().optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
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
  const serviceTypes = serviceTypesResponse?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      client_id: initialData?.client_id ?? 0,
      service_type_id: initialData?.service_type_id ?? 0,
      request_date: initialData?.request_date?.split('T')[0] ?? '',
      due_date: initialData?.due_date?.split('T')[0] ?? '',
      priority: initialData?.priority ?? '',
      amount: initialData?.amount ?? undefined,
      currency: initialData?.currency ?? 'USD',
      description: initialData?.description ?? '',
      notes: initialData?.notes ?? '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        client_id: initialData.client_id,
        service_type_id: initialData.service_type_id,
        request_date: initialData.request_date?.split('T')[0] ?? '',
        due_date: initialData.due_date?.split('T')[0] ?? '',
        priority: initialData.priority,
        amount: initialData.amount ?? undefined,
        currency: initialData.currency ?? 'USD',
        description: initialData.description ?? '',
        notes: initialData.notes ?? '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (values: RequestFormValues) => {
    const data: InspectionRequestFormData = {
      client_id: values.client_id,
      service_type_id: values.service_type_id,
      request_date: values.request_date,
      priority: values.priority,
    };
    if (values.due_date) data.due_date = values.due_date;
    if (values.amount) data.amount = values.amount;
    if (values.currency) data.currency = values.currency;
    if (values.description) data.description = values.description;
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
  const currencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'MXN', label: 'MXN' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Input
          label="Fecha de Solicitud *"
          type="date"
          error={errors.request_date?.message}
          {...register('request_date')}
        />
        <Input
          label="Fecha L\u00edmite"
          type="date"
          error={errors.due_date?.message}
          {...register('due_date')}
        />
        <Select
          label="Prioridad *"
          placeholder="Seleccionar prioridad"
          options={priorityOptions}
          error={errors.priority?.message}
          {...register('priority')}
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
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descripci&oacute;n
          </label>
          <textarea
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
          <textarea
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            {...register('notes')}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
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
