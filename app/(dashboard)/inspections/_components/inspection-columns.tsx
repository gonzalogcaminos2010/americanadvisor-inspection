'use client';

import { Inspection, InspectionStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Eye, Play, Award } from 'lucide-react';

export function getInspectionColumns(
  onView: (inspection: Inspection) => void,
  onContinue: (inspection: Inspection) => void
): Column<Inspection>[] {
  return [
    { key: 'id', header: '#' },
    {
      key: 'work_order',
      header: 'Orden',
      render: (item: Inspection) => {
        const raw = item as unknown as Record<string, unknown>;
        const woItem = raw.work_order_item as Record<string, unknown> | undefined;
        return item.work_order?.order_number || (woItem?.work_order_id ? `OT #${woItem.work_order_id}` : '-');
      },
    },
    {
      key: 'equipment',
      header: 'Equipo',
      render: (item: Inspection) => {
        const raw = item as unknown as Record<string, unknown>;
        const equip = raw.equipment as Record<string, unknown> | undefined;
        return equip?.name as string || item.work_order?.equipment?.name || '-';
      },
    },
    {
      key: 'template',
      header: 'Plantilla',
      render: (item: Inspection) => item.template?.name ?? '-',
    },
    {
      key: 'inspector',
      header: 'Inspector',
      render: (item: Inspection) => item.inspector?.name ?? '-',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: Inspection) => <Badge status={item.status} />,
    },
    {
      key: 'overall_result',
      header: 'Resultado',
      render: (item: Inspection) =>
        item.overall_result ? <Badge status={item.overall_result} /> : '-',
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (item: Inspection) => {
        const date = item.started_at || item.created_at;
        return date ? new Date(date).toLocaleDateString('es-ES') : '-';
      },
    },
    {
      key: 'certificate',
      header: 'Cert.',
      render: (item: Inspection) =>
        item.certificate_number ? (
          <span title={`Certificado ${item.certificate_number}`}>
            <Award className="h-4 w-4 text-emerald-600" />
          </span>
        ) : null,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item: Inspection) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(item)}>
            <Eye className="h-4 w-4" />
          </Button>
          {item.status === InspectionStatus.IN_PROGRESS && (
            <Button variant="primary" size="sm" onClick={() => onContinue(item)}>
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}
