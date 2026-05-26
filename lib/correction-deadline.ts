// Plazo de Corrección (ver CONTEXT.md): ventana para corregir un Hallazgo.
// Centraliza el cálculo de vencimiento/urgencia que antes estaba duplicado en
// finding-columns y sidebar.

import { Finding, FindingStatus } from '@/types';

/** Días o menos para considerar un Hallazgo "por vencer". */
export const URGENT_THRESHOLD_DAYS = 7;

export type DeadlineStatus = 'none' | 'closed' | 'overdue' | 'urgent' | 'ok';

export interface CorrectionDeadline {
  /** Días hasta el vencimiento (negativo si ya venció). null si no aplica. */
  daysLeft: number | null;
  status: DeadlineStatus;
  isOverdue: boolean;
  /** Vence dentro del umbral y todavía no venció. */
  isUrgent: boolean;
  /** Activo y dentro del umbral, incluidos los vencidos (para la campana). */
  isExpiringSoon: boolean;
}

const CLOSED_STATES: FindingStatus[] = [FindingStatus.RESOLVED, FindingStatus.CLOSED];

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

const inert = (status: DeadlineStatus): CorrectionDeadline => ({
  daysLeft: null,
  status,
  isOverdue: false,
  isUrgent: false,
  isExpiringSoon: false,
});

export function correctionDeadline(
  finding: Pick<Finding, 'due_date' | 'status'>,
): CorrectionDeadline {
  if (finding.status && CLOSED_STATES.includes(finding.status)) return inert('closed');
  if (!finding.due_date) return inert('none');

  const daysLeft = daysUntil(finding.due_date);
  const isOverdue = daysLeft < 0;
  const isUrgent = !isOverdue && daysLeft <= URGENT_THRESHOLD_DAYS;

  return {
    daysLeft,
    status: isOverdue ? 'overdue' : isUrgent ? 'urgent' : 'ok',
    isOverdue,
    isUrgent,
    isExpiringSoon: daysLeft <= URGENT_THRESHOLD_DAYS,
  };
}
