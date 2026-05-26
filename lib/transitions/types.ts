// Shared shape for the per-entity transition modules (see CONTEXT.md → "Acción Disponible").
// Each entity (Finding, Inspection, Work Order) has its own module with its own rules;
// they share only this small type, not an implementation.

export type Role = 'inspector' | 'supervisor' | 'admin';

/** Roles that may move an entity freely (including backwards / reopen). */
export const PRIVILEGED_ROLES = ['supervisor', 'admin'];

export function isPrivileged(role: string | undefined | null): boolean {
  return role === 'supervisor' || role === 'admin';
}

/**
 * An action a user can take right now. `action` is the action id — for findings it is
 * the target FindingStatus; for inspections it is a named operation ('approve', 'reopen', …).
 */
export interface AvailableAction<TAction extends string = string> {
  action: TAction;
  label: string;
  requiresNote: boolean;
}
