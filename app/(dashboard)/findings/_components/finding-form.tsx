'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Finding, FindingFormData, FindingSeverity, FindingStatus } from '@/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const CLOSING_STATUSES = [FindingStatus.RESOLVED, FindingStatus.CLOSED];

const findingSchema = z.object({
  title: z.string().min(1, 'El titulo es requerido'),
  description: z.string().min(1, 'La descripcion es requerida'),
  severity: z.nativeEnum(FindingSeverity),
  status: z.nativeEnum(FindingStatus).optional(),
  corrective_action: z.string().optional(),
  due_date: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.status && CLOSING_STATUSES.includes(data.status) && !data.corrective_action?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Describí qué se corrigió para poder cerrar el hallazgo',
      path: ['corrective_action'],
    });
  }
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

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export function FindingForm({ initialData, onSubmit, isLoading }: FindingFormProps) {
  const {
    register,
    handleSubmit,
    watch,
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
          due_date: defaultDueDate(),
        },
  });

  const currentStatus = watch('status');
  const isClosing = currentStatus && CLOSING_STATUSES.includes(currentStatus as FindingStatus);

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
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Accion Correctiva
          {isClosing && <span className="ml-1 text-red-500">*</span>}
          {isClosing && <span className="ml-2 text-xs text-amber-600 font-normal">Requerida al resolver/cerrar</span>}
        </label>
        <textarea
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
          placeholder={isClosing ? 'Describí qué se corrigió...' : 'Descripción de la acción correctiva'}
          {...register('corrective_action')}
        />
        {errors.corrective_action?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.corrective_action.message}</p>
        )}
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
