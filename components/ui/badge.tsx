'use client';

import { cn } from '@/lib/utils';

const colorMap: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  APPROVED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-red-100 text-red-800',
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
  URGENT: 'bg-red-100 text-red-800',
  // Inspection statuses
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  STANDBY: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  RETURNED: 'bg-red-100 text-red-800',
  CONDITIONALLY_APPROVED: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
  // Inspection results
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  NEEDS_REVIEW: 'bg-yellow-100 text-yellow-800',
  // Finding severities
  CRITICAL: 'bg-red-900 text-red-100',
  // Finding statuses
  OPEN: 'bg-red-100 text-red-800',
  IN_REVIEW: 'bg-blue-100 text-blue-800',
  CORRECTIVE_ACTION: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  // Lowercase API statuses
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  returned: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  conditionally_approved: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  // Lowercase severities
  critical: 'bg-red-900 text-red-100',
  high: 'bg-red-100 text-red-800',
  medium: 'bg-orange-100 text-orange-800',
  low: 'bg-blue-100 text-blue-800',
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
  RETURNED: 'Devuelta',
  CONDITIONALLY_APPROVED: 'Aprobado Condicional',
  REJECTED: 'Rechazado',
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
  // Lowercase API statuses
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  submitted: 'Enviada',
  returned: 'Devuelta',
  completed: 'Completado',
  conditionally_approved: 'Aprobado Condicional',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  // Lowercase severities
  critical: 'Crítico',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
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
