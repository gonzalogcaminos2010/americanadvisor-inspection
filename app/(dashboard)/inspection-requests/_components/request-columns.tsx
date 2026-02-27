'use client';

import { InspectionRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Pencil, Trash2 } from 'lucide-react';

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: 'Preventiva',
  CORRECTIVE: 'Correctiva',
  CERTIFICATION: 'Certificación',
  ROUTINE: 'Rutinaria',
  PRE_USE: 'Pre-uso',
};

export function getRequestColumns(
  onEdit: (request: InspectionRequest) => void,
  onDelete: (request: InspectionRequest) => void
): Column<InspectionRequest>[] {
  return [
    {
      key: 'number',
      header: 'N° Solicitud',
      render: (request: InspectionRequest) => (
        <span className="font-medium">{request.number || request.request_number || '-'}</span>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (request: InspectionRequest) => request.client?.name ?? '-',
    },
    {
      key: 'service_type',
      header: 'Servicio',
      render: (request: InspectionRequest) => request.service_type?.name ?? '-',
    },
    {
      key: 'inspection_type',
      header: 'Tipo',
      render: (request: InspectionRequest) =>
        INSPECTION_TYPE_LABELS[request.inspection_type] || request.inspection_type || '-',
    },
    {
      key: 'request_date',
      header: 'Fecha',
      render: (request: InspectionRequest) =>
        new Date(request.request_date).toLocaleDateString('es-AR'),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (request: InspectionRequest) => <Badge status={request.status} />,
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (request: InspectionRequest) =>
        request.priority ? <Badge status={request.priority} /> : <span className="text-gray-400">-</span>,
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
