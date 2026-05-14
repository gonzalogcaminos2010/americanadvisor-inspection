'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    new_password_confirmation: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['new_password_confirmation'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

export function ResetPasswordModal({ isOpen, onClose, userId, userName }: ResetPasswordModalProps) {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: '',
      new_password_confirmation: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) =>
      api.put(`/users/${userId}/password`, data),
    onSuccess: () => {
      toast.success('Contraseña restablecida exitosamente');
      reset();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al restablecer la contraseña');
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: ResetPasswordFormData) => {
    mutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Resetear contraseña — ${userName}`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          error={errors.new_password?.message}
          {...register('new_password')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite la contraseña"
          error={errors.new_password_confirmation?.message}
          {...register('new_password_confirmation')}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Restablecer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
