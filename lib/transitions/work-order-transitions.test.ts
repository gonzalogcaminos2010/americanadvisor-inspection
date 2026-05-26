import { describe, it, expect } from 'vitest';
import { WorkOrderStatus } from '@/types';
import { canModifyWorkOrder, workOrderPrimaryLabel } from './work-order-transitions';

describe('canModifyWorkOrder', () => {
  it('PENDING e IN_PROGRESS son modificables', () => {
    expect(canModifyWorkOrder(WorkOrderStatus.PENDING)).toBe(true);
    expect(canModifyWorkOrder(WorkOrderStatus.IN_PROGRESS)).toBe(true);
  });

  it('COMPLETED y CANCELLED no', () => {
    expect(canModifyWorkOrder(WorkOrderStatus.COMPLETED)).toBe(false);
    expect(canModifyWorkOrder(WorkOrderStatus.CANCELLED)).toBe(false);
  });

  it('acepta minúsculas y null', () => {
    expect(canModifyWorkOrder('pending')).toBe(true);
    expect(canModifyWorkOrder(null)).toBe(false);
  });
});

describe('workOrderPrimaryLabel', () => {
  it('mapea el Estado a la etiqueta del botón', () => {
    expect(workOrderPrimaryLabel(WorkOrderStatus.PENDING)).toBe('Iniciar');
    expect(workOrderPrimaryLabel(WorkOrderStatus.IN_PROGRESS)).toBe('Inspeccionar');
    expect(workOrderPrimaryLabel(WorkOrderStatus.COMPLETED)).toBe('Ver');
    expect(workOrderPrimaryLabel(WorkOrderStatus.CANCELLED)).toBe('Ver');
  });
});
