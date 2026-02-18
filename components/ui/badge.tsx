'use client';

import { cn } from '@/lib/utils';

const colorMap: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-red-100 text-red-800',
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const labelMap: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  MAINTENANCE: 'Mantenimiento',
  RETIRED: 'Retirado',
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ status, size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizes[size],
        colorMap[status] || 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {labelMap[status] || status}
    </span>
  );
}
