// Reglas de la Inspección (ver CONTEXT.md → "Inspección").
// Ciclo: NOT_STARTED → IN_PROGRESS → SUBMITTED → APPROVED | RETURNED.
// Las acciones son operaciones nombradas (no simples cambios de Estado):
// - El inspector trabaja la inspección mientras está activa.
// - El supervisor/admin revisa (aprueba o devuelve) cuando está SUBMITTED.
// - El dueño puede reabrir si está SUBMITTED o RETURNED.

import { InspectionStatus } from '@/types';
import { isPrivileged } from './types';

const READ_ONLY_STATES: InspectionStatus[] = [
  InspectionStatus.COMPLETED,
  InspectionStatus.SUBMITTED,
  InspectionStatus.APPROVED,
  InspectionStatus.RETURNED,
];

export interface InspectionAbilities {
  /** El inspector puede cargar respuestas (NOT_STARTED o IN_PROGRESS). */
  isActive: boolean;
  /** La inspección ya no se edita en el flujo del inspector. */
  isReadOnly: boolean;
  /** Supervisor/admin puede aprobar o devolver (solo SUBMITTED). */
  canReview: boolean;
  /** El dueño puede reabrirla (SUBMITTED o RETURNED). */
  canReopen: boolean;
}

interface InspectionLike {
  status?: string | null;
  inspector_id?: number | null;
}

interface UserLike {
  id: number;
  role: string;
}

/** Normaliza el status (la API puede devolverlo en minúsculas). */
function normalize(status?: string | null): InspectionStatus {
  return (status?.toUpperCase() || '') as InspectionStatus;
}

export function inspectionAbilities(
  inspection: InspectionLike,
  user: UserLike | null,
): InspectionAbilities {
  const status = normalize(inspection.status);
  const privileged = isPrivileged(user?.role);
  const isOwner = !!user && !!inspection.inspector_id && user.id === inspection.inspector_id;

  return {
    isActive:
      status === InspectionStatus.NOT_STARTED || status === InspectionStatus.IN_PROGRESS,
    isReadOnly: READ_ONLY_STATES.includes(status),
    canReview: status === InspectionStatus.SUBMITTED && privileged,
    canReopen:
      isOwner &&
      (status === InspectionStatus.SUBMITTED || status === InspectionStatus.RETURNED),
  };
}

/** Botón "continuar" de la lista: solo mientras está en progreso. */
export function canContinueInspection(status?: string | null): boolean {
  return normalize(status) === InspectionStatus.IN_PROGRESS;
}
