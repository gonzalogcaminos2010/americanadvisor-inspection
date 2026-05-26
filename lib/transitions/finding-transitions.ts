// Reglas de transición del Hallazgo (ver CONTEXT.md → "Estado del Hallazgo").
// Ciclo: OPEN → IN_REVIEW → CORRECTIVE_ACTION → RESOLVED → CLOSED.
// - Inspector: solo puede avanzar (no retroceder).
// - Supervisor / Admin: pueden ir a cualquier Estado (incluido reabrir).
// - Resolver y Cerrar requieren una nota obligatoria.

import { FindingStatus } from '@/types';
import { AvailableAction, isPrivileged } from './types';

/** Orden oficial del ciclo de vida — el índice define qué es "avanzar". */
export const FINDING_ORDER: FindingStatus[] = [
  FindingStatus.OPEN,
  FindingStatus.IN_REVIEW,
  FindingStatus.CORRECTIVE_ACTION,
  FindingStatus.RESOLVED,
  FindingStatus.CLOSED,
];

/** Etiqueta de cada Estado del Hallazgo (fuente única para selects y badges de texto). */
export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  [FindingStatus.OPEN]: 'Abierto',
  [FindingStatus.IN_REVIEW]: 'En Revisión',
  [FindingStatus.CORRECTIVE_ACTION]: 'Acción Correctiva',
  [FindingStatus.RESOLVED]: 'Resuelto',
  [FindingStatus.CLOSED]: 'Cerrado',
};

const NOTE_REQUIRED: FindingStatus[] = [FindingStatus.RESOLVED, FindingStatus.CLOSED];

/** ¿Mover el Hallazgo a este Estado exige una nota / acción correctiva? */
export function findingRequiresNote(status: FindingStatus): boolean {
  return NOTE_REQUIRED.includes(status);
}

/**
 * Acciones disponibles para un Hallazgo en `current` según el `role`.
 * Cada acción es una transición a un Estado destino.
 */
export function findingActions(
  current: FindingStatus,
  role: string,
): AvailableAction<FindingStatus>[] {
  const i = FINDING_ORDER.indexOf(current);
  if (i === -1) return [];
  const privileged = isPrivileged(role);

  return FINDING_ORDER.filter((_state, j) => {
    if (j === i) return false; // no transicionar al mismo Estado
    if (privileged) return true; // supervisor/admin: cualquier Estado
    return j > i; // inspector (o rol desconocido): solo avanzar
  }).map((to) => ({
    action: to,
    label: FINDING_STATUS_LABELS[to],
    requiresNote: findingRequiresNote(to),
  }));
}
