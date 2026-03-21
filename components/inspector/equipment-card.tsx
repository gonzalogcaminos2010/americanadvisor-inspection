'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WorkOrderItem, Inspection } from '@/types';
import { Truck, Play, Eye, AlertTriangle, RotateCcw } from 'lucide-react';

interface EquipmentCardProps {
  item: WorkOrderItem;
  inspection?: Inspection | null;
  onStartInspection: (item: WorkOrderItem) => void;
  onContinueInspection: (inspectionId: number) => void;
  onViewInspection: (inspectionId: number) => void;
  loading?: boolean;
}

export function EquipmentCard({
  item,
  inspection,
  onStartInspection,
  onContinueInspection,
  onViewInspection,
  loading,
}: EquipmentCardProps) {
  const equipment = item.equipment;
  const inspStatus = (inspection?.status || '').toLowerCase();
  const isReturned = inspStatus === 'returned';
  const isActive = ['not_started', 'in_progress', 'standby', 'returned'].includes(inspStatus);
  const isReadOnly = ['completed', 'submitted', 'approved'].includes(inspStatus);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-shadow hover:shadow-sm',
        isReturned ? 'border-l-4 border-l-red-500 border-red-200' : 'border-gray-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-100 p-2.5 shrink-0">
          <Truck className="h-5 w-5 text-gray-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {equipment?.name || `Equipo #${item.equipment_id}`}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {[equipment?.brand, equipment?.model, equipment?.serial_number]
                  .filter(Boolean)
                  .join(' - ') || 'Sin detalles'}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {inspection && <Badge status={inspection.status} size="sm" />}
              {inspection?.overall_result && (
                <Badge status={inspection.overall_result} size="sm" />
              )}
            </div>
          </div>

          {item.template && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {item.template.name}
            </p>
          )}

          {isReturned && inspection?.supervisor_notes && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 p-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">{inspection.supervisor_notes}</p>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            {!inspection && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStartInspection(item)}
                disabled={loading}
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                Iniciar
              </Button>
            )}
            {isActive && inspection && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onContinueInspection(inspection.id)}
              >
                {isReturned ? (
                  <><RotateCcw className="h-3.5 w-3.5 mr-1" /> Corregir</>
                ) : (
                  <><Play className="h-3.5 w-3.5 mr-1" /> Continuar</>
                )}
              </Button>
            )}
            {isReadOnly && inspection && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewInspection(inspection.id)}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Ver
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
