'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { InspectionTemplate, PaginatedResponse, TemplateCategory, TemplateCategoryFormData } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}

const categorySchema = z.object({
  code: z
    .string()
    .min(1, 'El codigo es requerido')
    .regex(/^[a-z0-9_]+$/, 'Solo minusculas, numeros y guion bajo'),
  name: z.string().min(1, 'El nombre es requerido'),
  is_active: z.boolean().optional(),
  default_template_id: z.number().nullable().optional(),
  default_inspection_interval_months: z
    .number()
    .int()
    .min(1, 'Mínimo 1 mes')
    .max(120, 'Máximo 120 meses')
    .nullable()
    .optional(),
});

interface CategoryFormProps {
  initialData?: TemplateCategory;
  onSubmit: (data: TemplateCategoryFormData) => void;
  isLoading: boolean;
}

export function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const isEditing = !!initialData;
  const [codeEdited, setCodeEdited] = useState(false);

  // Load templates only when editing — the default-template select needs them.
  const { data: templatesResp } = useQuery<PaginatedResponse<InspectionTemplate>>({
    queryKey: ['inspection-templates', { per_page: 200 }],
    queryFn: () => api.get('/inspection-templates?per_page=200'),
    enabled: isEditing,
  });

  const allTemplates = templatesResp?.data ?? [];
  // Prefer templates linked to this category; if none yet, allow choosing from all.
  const candidates = allTemplates.filter(
    (t) => !initialData?.id || (t as InspectionTemplate & { category_id?: number | null }).category_id === initialData.id
  );
  const templates = candidates.length > 0 ? candidates : allTemplates;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TemplateCategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          is_active: initialData.is_active,
          default_template_id: initialData.default_template_id ?? null,
          default_inspection_interval_months: initialData.default_inspection_interval_months ?? null,
        }
      : {
          code: '',
          name: '',
          is_active: true,
          default_template_id: null,
          default_inspection_interval_months: null,
        },
  });

  // Reset when switching between categories without remounting the form.
  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code,
        name: initialData.name,
        is_active: initialData.is_active,
        default_template_id: initialData.default_template_id ?? null,
        default_inspection_interval_months: initialData.default_inspection_interval_months ?? null,
      });
    }
  }, [initialData, reset]);

  const handleNumberOrNull = (key: 'default_template_id' | 'default_inspection_interval_months') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = e.target.value;
      setValue(key, v === '' ? null : Number(v), { shouldValidate: true });
    };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        error={errors.name?.message}
        {...register('name', {
          onChange: (e) => {
            if (!isEditing && !codeEdited) {
              setValue('code', slugify(e.target.value));
            }
          },
        })}
      />
      <div>
        <Input
          label="Codigo (identificador)"
          error={errors.code?.message}
          readOnly={isEditing}
          className={isEditing ? 'bg-gray-100' : ''}
          {...register('code', {
            onChange: () => setCodeEdited(true),
          })}
        />
        {!isEditing && (
          <p className="mt-1 text-xs text-gray-500">
            Se autogenera desde el nombre. Solo minusculas, numeros y guion bajo.
          </p>
        )}
        {isEditing && (
          <p className="mt-1 text-xs text-gray-500">
            El codigo no se puede modificar una vez creado.
          </p>
        )}
      </div>

      {isEditing && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Plantilla por defecto
            </label>
            <select
              defaultValue={initialData?.default_template_id ?? ''}
              onChange={handleNumberOrNull('default_template_id')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Sin default —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Plantilla que se usará cuando una OT venga sin plantilla explícita.
            </p>
            {errors.default_template_id?.message && (
              <p className="mt-1 text-xs text-red-600">{errors.default_template_id.message}</p>
            )}
          </div>

          <div>
            <Input
              type="number"
              label="Intervalo de inspección (meses)"
              defaultValue={initialData?.default_inspection_interval_months ?? ''}
              onChange={handleNumberOrNull('default_inspection_interval_months')}
              error={errors.default_inspection_interval_months?.message}
              min={1}
              max={120}
            />
            <p className="mt-1 text-xs text-gray-500">
              Cuántos meses agregar al aprobar para calcular la próxima inspección, si el inspector no la cargó.
            </p>
          </div>
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          {...register('is_active')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Activa
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Actualizar' : 'Crear'} Categoria
        </Button>
      </div>
    </form>
  );
}
