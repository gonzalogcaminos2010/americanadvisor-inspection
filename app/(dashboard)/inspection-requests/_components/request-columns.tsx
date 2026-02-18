'use client';

import { InspectionRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Pencil, Trash2 } from 'lucide-react';

export function getRequestColumns(
  onEdit: (request: InspectionRequest) => void,
  onDelete: (request: InspectionRequest) => void
): Column<InspectionRequest>[] {
  return [
    { key: 'request_number', header: 'N\u00b0 Solicitud' },
    {
      key: 'client',
      header: 'Cliente',
      render: (request: InspectionRequest) => request.client?.name ?? '-',
    },
    {
      key: 'service_type',
      header: 'Tipo de Servicio',
      render: (request: InspectionRequest) => request.service_type?.name ?? '-',
    },
    {
      key: 'request_date',
      header: 'Fecha Solicitud',
      render: (request: InspectionRequest) =>
        new Date(request.request_date).toLocaleDateString('es'),
    },
    {
      key: 'due_date',
      header: 'Fecha L\u00edmite',
      render: (request: InspectionRequest) =>
        request.due_date ? new Date(request.due_date).toLocaleDateString('es') : '-',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (request: InspectionRequest) => <Badge status={request.status} />,
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (request: InspectionRequest) => <Badge status={request.priority} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (request: InspectionRequest) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(request)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(request)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}
