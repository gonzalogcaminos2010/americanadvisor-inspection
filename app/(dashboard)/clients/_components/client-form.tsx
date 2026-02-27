'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Client, ClientFormData } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function generateClientCode(): string {
  const num = Date.now().toString(36).slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
  return `CLI-${num}`;
}

const clientSchema = z.object({
  code: z.string().min(1, 'El codigo es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  tax_id: z.string().min(1, 'El RFC/NIT es requerido'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email inválido').or(z.literal('')).optional(),
  industry_type: z.string().optional(),
  notes: z.string().optional(),
});

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (data: ClientFormData) => void;
  isLoading: boolean;
}

export function ClientForm({ initialData, onSubmit, isLoading }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          tax_id: initialData.tax_id,
          email: initialData.email ?? '',
          phone: initialData.phone ?? '',
          address: initialData.address ?? '',
          city: initialData.city ?? '',
          state: initialData.state ?? '',
          country: initialData.country ?? '',
          postal_code: initialData.postal_code ?? '',
          contact_person: initialData.contact_person ?? '',
          contact_phone: initialData.contact_phone ?? '',
          contact_email: initialData.contact_email ?? '',
          industry_type: initialData.industry_type ?? '',
          notes: initialData.notes ?? '',
        }
      : {
          code: generateClientCode(),
        },
  });

  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Codigo"
          error={errors.code?.message}
          readOnly={!isEditing}
          className={!isEditing ? 'bg-gray-100' : ''}
          {...register('code')}
        />
        <Input
          label="Nombre"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="RFC/NIT"
          error={errors.tax_id?.message}
          {...register('tax_id')}
        />
        <Input
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Teléfono"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Dirección"
          error={errors.address?.message}
          {...register('address')}
        />
        <Input
          label="Ciudad"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="Estado/Provincia"
          error={errors.state?.message}
          {...register('state')}
        />
        <Input
          label="País"
          error={errors.country?.message}
          {...register('country')}
        />
        <Input
          label="Código Postal"
          error={errors.postal_code?.message}
          {...register('postal_code')}
        />
        <Input
          label="Persona de Contacto"
          error={errors.contact_person?.message}
          {...register('contact_person')}
        />
        <Input
          label="Teléfono de Contacto"
          error={errors.contact_phone?.message}
          {...register('contact_phone')}
        />
        <Input
          label="Email de Contacto"
          type="email"
          error={errors.contact_email?.message}
          {...register('contact_email')}
        />
        <Input
          label="Tipo de Industria"
          error={errors.industry_type?.message}
          {...register('industry_type')}
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
