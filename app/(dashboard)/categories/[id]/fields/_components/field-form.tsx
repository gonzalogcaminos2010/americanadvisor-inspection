'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CategoryEquipmentField,
  CategoryEquipmentFieldFormData,
  CategoryEquipmentFieldType,
} from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const TYPES: { value: CategoryEquipmentFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Selección' },
  { value: 'boolean', label: 'Sí/No' },
];

const fieldSchema = z.object({
  key_name: z
    .string()
    .min(1, 'Requerido')
    .regex(/^[a-z][a-z0-9_]*$/, 'Empieza con letra; sólo minúsculas, números y guion bajo'),
  label: z.string().min(1, 'Requerido'),
  type: z.enum(['text', 'number', 'date', 'select', 'boolean']),
  options_csv: z.string().optional(),
  unit: z.string().optional().nullable(),
  is_required: z.boolean(),
  is_mutable: z.boolean(),
  sort_order: z.number().int().min(0),
});

type FieldFormShape = z.infer<typeof fieldSchema>;

interface FieldFormProps {
  initialData?: CategoryEquipmentField;
  isEditing: boolean;
  onSubmit: (data: CategoryEquipmentFieldFormData) => void;
  isLoading: boolean;
}

export function CategoryFieldForm({ initialData, isEditing, onSubmit, isLoading }: FieldFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FieldFormShape>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      key_name: initialData?.key_name ?? '',
      label: initialData?.label ?? '',
      type: initialData?.type ?? 'text',
      options_csv: (initialData?.options ?? []).join(', '),
      unit: initialData?.unit ?? '',
      is_required: initialData?.is_required ?? false,
      is_mutable: initialData?.is_mutable ?? true,
      sort_order: initialData?.sort_order ?? 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        key_name: initialData.key_name,
        label: initialData.label,
        type: initialData.type,
        options_csv: (initialData.options ?? []).join(', '),
        unit: initialData.unit ?? '',
        is_required: initialData.is_required,
        is_mutable: initialData.is_mutable,
        sort_order: initialData.sort_order,
      });
    }
  }, [initialData, reset]);

  const type = watch('type');

  const onValid = (data: FieldFormShape) => {
    const options =
      data.type === 'select' && data.options_csv
        ? data.options_csv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    onSubmit({
      key_name: data.key_name,
      label: data.label,
      type: data.type,
      options,
      unit: data.unit?.trim() || null,
      is_required: data.is_required,
      is_mutable: data.is_mutable,
      sort_order: data.sort_order,
    });
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Identificador (key_name)"
          error={errors.key_name?.message}
          readOnly={isEditing}
          className={isEditing ? 'bg-gray-100' : ''}
          {...register('key_name')}
        />
        <Input label="Etiqueta visible" error={errors.label?.message} {...register('label')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
          <select
            {...register('type')}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <Input label="Unidad (opcional)" placeholder="kg, m, h…" {...register('unit')} />
      </div>

      {type === 'select' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Opciones (separadas por coma)
          </label>
          <input
            {...register('options_csv')}
            placeholder="AT, MT"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <Input
        type="number"
        label="Orden"
        min={0}
        {...register('sort_order', { valueAsNumber: true })}
        error={errors.sort_order?.message}
      />

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            {...register('is_required')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Requerido (bloquea submit si vacío)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            {...register('is_mutable')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Mutable (editable en futuras inspecciones)
        </label>
      </div>
      <p className="text-xs text-gray-500">
        Tip: marcá <strong>NO mutable</strong> los datos de identidad estable (chasis, dominio, marca, modelo, año).
        Estos quedan read-only luego de la primera captura del equipo.
      </p>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Actualizar' : 'Crear'} Campo
        </Button>
      </div>
    </form>
  );
}
