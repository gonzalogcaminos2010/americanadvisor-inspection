'use client';

import { WorkOrder } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Pencil, Trash2, Eye } from 'lucide-react';

export function getWorkOrderColumns(
  onEdit: (order: WorkOrder) => void,
  onDelete: (order: WorkOrder) => void,
  onView: (order: WorkOrder) => void
): Column<WorkOrder>[] {
  return [
    { key: 'order_number', header: 'N\u00B0 Orden' },
    {
      key: 'inspection_request',
      header: 'Solicitud',
      render: (order: WorkOrder) => order.inspection_request?.request_number ?? '-',
    },
    {
      key: 'equipment',
      header: 'Equipo',
      render: (order: WorkOrder) => order.equipment?.name ?? '-',
    },
    {
      key: 'inspector',
      header: 'Inspector',
      render: (order: WorkOrder) => order.inspector?.name ?? '-',
    },
    {
      key: 'scheduled_date',
      header: 'Fecha Programada',
      render: (order: WorkOrder) =>
        order.scheduled_date
          ? new Date(order.scheduled_date).toLocaleDateString('es-ES')
          : '-',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (order: WorkOrder) => <Badge status={order.status} />,
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (order: WorkOrder) => <Badge status={order.priority} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (order: WorkOrder) => (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => onView(order)}>
            <Eye className="h-4 w-4 mr-1" />
            {order.status === 'PENDING'
              ? 'Iniciar'
              : order.status === 'IN_PROGRESS'
                ? 'Inspeccionar'
                : 'Ver'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(order)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(order)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}
