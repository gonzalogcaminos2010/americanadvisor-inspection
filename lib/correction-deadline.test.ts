import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FindingStatus } from '@/types';
import { correctionDeadline } from './correction-deadline';

// Hora fija para que los cálculos de fecha sean deterministas.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-25T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const finding = (due_date: string | undefined, status: FindingStatus) =>
  ({ due_date: due_date ?? null, status } as Parameters<typeof correctionDeadline>[0]);

describe('correctionDeadline', () => {
  it('Hallazgo cerrado/resuelto no tiene plazo activo', () => {
    for (const s of [FindingStatus.RESOLVED, FindingStatus.CLOSED]) {
      const d = correctionDeadline(finding('2026-05-20', s));
      expect(d.status).toBe('closed');
      expect(d.isExpiringSoon).toBe(false);
      expect(d.daysLeft).toBeNull();
    }
  });

  it('sin fecha límite → status "none"', () => {
    const d = correctionDeadline(finding(undefined, FindingStatus.OPEN));
    expect(d.status).toBe('none');
    expect(d.isOverdue).toBe(false);
  });

  it('vencido → overdue, días negativos, cuenta como "por vencer"', () => {
    const d = correctionDeadline(finding('2026-05-20', FindingStatus.OPEN));
    expect(d.isOverdue).toBe(true);
    expect(d.status).toBe('overdue');
    expect(d.daysLeft).toBeLessThan(0);
    expect(d.isExpiringSoon).toBe(true);
  });

  it('vence en 3 días → urgente', () => {
    const d = correctionDeadline(finding('2026-05-28', FindingStatus.IN_REVIEW));
    expect(d.isUrgent).toBe(true);
    expect(d.status).toBe('urgent');
    expect(d.isExpiringSoon).toBe(true);
  });

  it('borde del umbral: 7 días → urgente, 8 → ok', () => {
    expect(correctionDeadline(finding('2026-06-01', FindingStatus.OPEN)).status).toBe('urgent');
    expect(correctionDeadline(finding('2026-06-02', FindingStatus.OPEN)).status).toBe('ok');
  });

  it('vence lejos → ok, no urge', () => {
    const d = correctionDeadline(finding('2026-06-30', FindingStatus.CORRECTIVE_ACTION));
    expect(d.status).toBe('ok');
    expect(d.isExpiringSoon).toBe(false);
    expect(d.isUrgent).toBe(false);
  });
});
