'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserFormData } from '@/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const userSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().min(1, 'El email es requerido').email('Email no válido'),
  role: z.enum(['supervisor', 'inspector'], {
    required_error: 'El rol es requerido',
  }),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const roleOptions = [
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'inspector', label: 'Inspector' },
];

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
  isLoading: boolean;
}

export function UserForm({ onSubmit, isLoading }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'inspector',
      password: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        placeholder="Nombre completo"
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Email"
        type="email"
        placeholder="correo@ejemplo.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Select
        label="Rol"
        options={roleOptions}
        error={errors.role?.message}
        {...register('role')}
      />
      <Input
        label="Contraseña"
        type="password"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" isLoading={isLoading}>
          Crear Usuario
        </Button>
      </div>
    </form>
  );
}
