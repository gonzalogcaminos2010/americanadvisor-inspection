'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Equipment, EquipmentFormData, EquipmentStatus, PaginatedResponse, Client } from '@/types';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const equipmentSchema = z.object({
  client_id: z.coerce.number().min(1, 'Seleccione un cliente'),
  name: z.string().min(1, 'El nombre es requerido'),
  equipment_code: z.string().min(1, 'El codigo es requerido'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().min(1, 'El modelo es requerido'),
  serial_number: z.string().min(1, 'El numero de serie es requerido'),
  location: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus),
  notes: z.string().optional(),
});

interface EquipmentFormProps {
  initialData?: Equipment;
  onSubmit: (data: EquipmentFormData) => void;
  isLoading?: boolean;
}

export function EquipmentForm({ initialData, onSubmit, isLoading }: EquipmentFormProps) {
  const { data: clientsData } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients-select'],
    queryFn: () => api.get<PaginatedResponse<Client>>('/clients?active=true&per_page=100'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: initialData
      ? {
          client_id: initialData.client_id,
          name: initialData.name,
          equipment_code: initialData.equipment_code,
          description: initialData.description || '',
          brand: initialData.brand || '',
          model: initialData.model,
          serial_number: initialData.serial_number,
          location: initialData.location || '',
          status: initialData.status,
          notes: initialData.notes || '',
        }
      : {
          status: EquipmentStatus.ACTIVE,
        },
  });

  const clientOptions = (clientsData?.data || []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const statusOptions = [
    { value: EquipmentStatus.ACTIVE, label: 'Activo' },
    { value: EquipmentStatus.INACTIVE, label: 'Inactivo' },
    { value: EquipmentStatus.MAINTENANCE, label: 'Mantenimiento' },
    { value: EquipmentStatus.RETIRED, label: 'Retirado' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Cliente"
          options={clientOptions}
          placeholder="Seleccione un cliente"
          error={errors.client_id?.message}
          defaultValue={initialData ? String(initialData.client_id) : ''}
          {...register('client_id')}
        />
        <Input
          label="Nombre"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Codigo de Equipo"
          error={errors.equipment_code?.message}
          {...register('equipment_code')}
        />
        <Input
          label="Modelo"
          error={errors.model?.message}
          {...register('model')}
        />
        <Input
          label="N. Serie"
          error={errors.serial_number?.message}
          {...register('serial_number')}
        />
        <Input
          label="Marca"
          error={errors.brand?.message}
          {...register('brand')}
        />
        <Input
          label="Ubicacion"
          error={errors.location?.message}
          {...register('location')}
        />
        <Select
          label="Estado"
          options={statusOptions}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>
      <Input
        label="Descripcion"
        error={errors.description?.message}
        {...register('description')}
      />
      <Input
        label="Notas"
        error={errors.notes?.message}
        {...register('notes')}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Actualizar' : 'Crear'} Equipo
        </Button>
      </div>
    </form>
  );
}
