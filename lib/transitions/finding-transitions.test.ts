import { describe, it, expect } from 'vitest';
import { FindingStatus } from '@/types';
import { findingActions, findingRequiresNote } from './finding-transitions';

const targets = (current: FindingStatus, role: string) =>
  findingActions(current, role).map((a) => a.action);

describe('findingActions — inspector (solo avanza)', () => {
  it('en CORRECTIVE_ACTION solo puede Resolver y Cerrar', () => {
    expect(targets(FindingStatus.CORRECTIVE_ACTION, 'inspector')).toEqual([
      FindingStatus.RESOLVED,
      FindingStatus.CLOSED,
    ]);
  });

  it('en OPEN ve todos los Estados hacia adelante', () => {
    expect(targets(FindingStatus.OPEN, 'inspector')).toEqual([
      FindingStatus.IN_REVIEW,
      FindingStatus.CORRECTIVE_ACTION,
      FindingStatus.RESOLVED,
      FindingStatus.CLOSED,
    ]);
  });

  it('en CLOSED no tiene acciones (no puede retroceder)', () => {
    expect(targets(FindingStatus.CLOSED, 'inspector')).toEqual([]);
  });

  it('nunca incluye un Estado anterior', () => {
    expect(targets(FindingStatus.RESOLVED, 'inspector')).toEqual([FindingStatus.CLOSED]);
  });
});

describe('findingActions — supervisor / admin (cualquier Estado)', () => {
  it('en RESOLVED puede reabrir hacia atrás y cerrar', () => {
    expect(targets(FindingStatus.RESOLVED, 'supervisor')).toEqual([
      FindingStatus.OPEN,
      FindingStatus.IN_REVIEW,
      FindingStatus.CORRECTIVE_ACTION,
      FindingStatus.CLOSED,
    ]);
  });

  it('admin se comporta igual que supervisor', () => {
    expect(targets(FindingStatus.CLOSED, 'admin')).toEqual([
      FindingStatus.OPEN,
      FindingStatus.IN_REVIEW,
      FindingStatus.CORRECTIVE_ACTION,
      FindingStatus.RESOLVED,
    ]);
  });

  it('nunca incluye el Estado actual', () => {
    expect(targets(FindingStatus.OPEN, 'supervisor')).not.toContain(FindingStatus.OPEN);
  });
});

describe('rol desconocido cae a lo más restrictivo (solo avanza)', () => {
  it('se comporta como inspector', () => {
    expect(targets(FindingStatus.IN_REVIEW, 'cualquier-cosa')).toEqual([
      FindingStatus.CORRECTIVE_ACTION,
      FindingStatus.RESOLVED,
      FindingStatus.CLOSED,
    ]);
  });
});

describe('nota obligatoria', () => {
  it('Resolver y Cerrar la requieren', () => {
    expect(findingRequiresNote(FindingStatus.RESOLVED)).toBe(true);
    expect(findingRequiresNote(FindingStatus.CLOSED)).toBe(true);
  });

  it('el resto no la requiere', () => {
    expect(findingRequiresNote(FindingStatus.OPEN)).toBe(false);
    expect(findingRequiresNote(FindingStatus.IN_REVIEW)).toBe(false);
    expect(findingRequiresNote(FindingStatus.CORRECTIVE_ACTION)).toBe(false);
  });

  it('la acción marca requiresNote en el destino correcto', () => {
    const actions = findingActions(FindingStatus.CORRECTIVE_ACTION, 'inspector');
    expect(actions.find((a) => a.action === FindingStatus.RESOLVED)?.requiresNote).toBe(true);
    expect(actions.find((a) => a.action === FindingStatus.CLOSED)?.requiresNote).toBe(true);
  });
});
