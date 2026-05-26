// Reglas de la Orden de Trabajo (ver CONTEXT.md → "Orden de Trabajo").
// Ciclo: PENDING → IN_PROGRESS → COMPLETED (o CANCELLED).
// Solo se puede editar/borrar mientras está PENDING o IN_PROGRESS.

import { WorkOrderStatus } from '@/types';

function normalize(status?: string | null): string {
  return (status || '').toUpperCase();
}

/** ¿Se puede editar o borrar la Orden en este Estado? */
export function canModifyWorkOrder(status?: string | null): boolean {
  const s = normalize(status);
  return s === WorkOrderStatus.PENDING || s === WorkOrderStatus.IN_PROGRESS;
}

/** Etiqueta del botón principal según el Estado de la Orden. */
export function workOrderPrimaryLabel(status?: string | null): string {
  const s = normalize(status);
  if (s === WorkOrderStatus.PENDING) return 'Iniciar';
  if (s === WorkOrderStatus.IN_PROGRESS) return 'Inspeccionar';
  return 'Ver';
}
