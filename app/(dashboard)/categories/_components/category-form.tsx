'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TemplateCategory, TemplateCategoryFormData } from '@/types';
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
});

interface CategoryFormProps {
  initialData?: TemplateCategory;
  onSubmit: (data: TemplateCategoryFormData) => void;
  isLoading: boolean;
}

export function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const isEditing = !!initialData;
  const [codeEdited, setCodeEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TemplateCategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          is_active: initialData.is_active,
        }
      : { code: '', name: '', is_active: true },
  });

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
