import { describe, it, expect } from 'vitest';
import { InspectionStatus } from '@/types';
import { inspectionAbilities, canContinueInspection } from './inspection-transitions';

const supervisor = { id: 1, role: 'supervisor' };
const inspectorOwner = { id: 7, role: 'inspector' };
const otherInspector = { id: 9, role: 'inspector' };

describe('inspectionAbilities — revisión del supervisor', () => {
  it('SUBMITTED + supervisor → puede revisar, read-only, no reabre (no es dueño)', () => {
    const a = inspectionAbilities(
      { status: InspectionStatus.SUBMITTED, inspector_id: 7 },
      supervisor,
    );
    expect(a.canReview).toBe(true);
    expect(a.isReadOnly).toBe(true);
    expect(a.canReopen).toBe(false);
    expect(a.isActive).toBe(false);
  });

  it('IN_PROGRESS + supervisor → no puede revisar todavía', () => {
    const a = inspectionAbilities(
      { status: InspectionStatus.IN_PROGRESS, inspector_id: 7 },
      supervisor,
    );
    expect(a.canReview).toBe(false);
  });
});

describe('inspectionAbilities — dueño inspector', () => {
  it('RETURNED + dueño → puede reabrir, no está activa', () => {
    const a = inspectionAbilities(
      { status: InspectionStatus.RETURNED, inspector_id: 7 },
      inspectorOwner,
    );
    expect(a.canReopen).toBe(true);
    expect(a.isActive).toBe(false);
    expect(a.canReview).toBe(false); // un inspector no revisa
  });

  it('SUBMITTED pero NO dueño → no puede reabrir', () => {
    const a = inspectionAbilities(
      { status: InspectionStatus.SUBMITTED, inspector_id: 7 },
      otherInspector,
    );
    expect(a.canReopen).toBe(false);
  });

  it('IN_PROGRESS → activa y editable', () => {
    const a = inspectionAbilities(
      { status: InspectionStatus.IN_PROGRESS, inspector_id: 7 },
      inspectorOwner,
    );
    expect(a.isActive).toBe(true);
    expect(a.isReadOnly).toBe(false);
  });
});

describe('normalización de status', () => {
  it('acepta minúsculas de la API', () => {
    const a = inspectionAbilities({ status: 'submitted', inspector_id: 7 }, supervisor);
    expect(a.canReview).toBe(true);
  });

  it('usuario null no rompe', () => {
    const a = inspectionAbilities({ status: 'SUBMITTED', inspector_id: 7 }, null);
    expect(a.canReview).toBe(false);
    expect(a.canReopen).toBe(false);
  });
});

describe('canContinueInspection', () => {
  it('solo IN_PROGRESS', () => {
    expect(canContinueInspection(InspectionStatus.IN_PROGRESS)).toBe(true);
    expect(canContinueInspection('in_progress')).toBe(true);
    expect(canContinueInspection(InspectionStatus.NOT_STARTED)).toBe(false);
    expect(canContinueInspection(InspectionStatus.SUBMITTED)).toBe(false);
    expect(canContinueInspection(null)).toBe(false);
  });
});
