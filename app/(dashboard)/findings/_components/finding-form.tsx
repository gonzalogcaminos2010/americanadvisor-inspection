'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Finding, FindingFormData, FindingSeverity, FindingStatus } from '@/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const findingSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido'),
  description: z.string().min(1, 'La descripcion es requerida'),
  severity: z.nativeEnum(FindingSeverity),
  status: z.nativeEnum(FindingStatus).optional(),
  corrective_action: z.string().optional(),
  due_date: z.string().optional(),
});

const severityOptions = [
  { value: FindingSeverity.LOW, label: 'Baja' },
  { value: FindingSeverity.MEDIUM, label: 'Media' },
  { value: FindingSeverity.HIGH, label: 'Alta' },
  { value: FindingSeverity.CRITICAL, label: 'Critico' },
];

const statusOptions = [
  { value: FindingStatus.OPEN, label: 'Abierto' },
  { value: FindingStatus.IN_REVIEW, label: 'En Revision' },
  { value: FindingStatus.CORRECTIVE_ACTION, label: 'Accion Correctiva' },
  { value: FindingStatus.RESOLVED, label: 'Resuelto' },
  { value: FindingStatus.CLOSED, label: 'Cerrado' },
];

interface FindingFormProps {
  initialData?: Finding;
  onSubmit: (data: FindingFormData) => void;
  isLoading: boolean;
}

export function FindingForm({ initialData, onSubmit, isLoading }: FindingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindingFormData>({
    resolver: zodResolver(findingSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          severity: initialData.severity,
          status: initialData.status,
          corrective_action: initialData.corrective_action ?? '',
          due_date: initialData.due_date ?? '',
        }
      : {
          severity: FindingSeverity.MEDIUM,
          status: FindingStatus.OPEN,
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Titulo"
        error={errors.title?.message}
        {...register('title')}
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
        <textarea
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
          {...register('description')}
        />
        {errors.description?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Severidad"
          options={severityOptions}
          error={errors.severity?.message}
          {...register('severity')}
        />
        <Select
          label="Estado"
          options={statusOptions}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Accion Correctiva</label>
        <textarea
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
          {...register('corrective_action')}
        />
      </div>
      <Input
        label="Fecha Limite"
        type="date"
        error={errors.due_date?.message}
        {...register('due_date')}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
