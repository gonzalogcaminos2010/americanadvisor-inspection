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
  // Inspection statuses
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  STANDBY: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  // Inspection results
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-800',
  // Finding severities
  CRITICAL: 'bg-red-100 text-red-800',
  // Finding statuses
  OPEN: 'bg-red-100 text-red-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  CORRECTIVE_ACTION: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
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
  // Inspection statuses
  NOT_STARTED: 'No Iniciada',
  STANDBY: 'En Pausa',
  SUBMITTED: 'Enviada',
  // Inspection results
  PASS: 'Aprobado',
  FAIL: 'Reprobado',
  NEEDS_REVIEW: 'Requiere Revisión',
  // Finding severities
  CRITICAL: 'Crítico',
  // Finding statuses
  OPEN: 'Abierto',
  IN_REVIEW: 'En Revisión',
  CORRECTIVE_ACTION: 'Acción Correctiva',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
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
