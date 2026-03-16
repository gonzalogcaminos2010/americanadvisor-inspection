'use client';

import { Finding } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Pencil, ExternalLink } from 'lucide-react';

export function getFindingColumns(
  onEdit: (finding: Finding) => void,
  onViewInspection: (finding: Finding) => void
): Column<Finding>[] {
  return [
    {
      key: 'description',
      header: 'Descripcion',
      render: (item: Finding) => {
        const text = (item as unknown as Record<string, unknown>).description as string || item.title || '-';
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
      },
    },
    {
      key: 'inspection_id',
      header: 'Inspeccion',
      render: (item: Finding) => `#${item.inspection_id}`,
    },
    {
      key: 'severity',
      header: 'Severidad',
      render: (item: Finding) => <Badge status={item.severity} />,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: Finding) => <Badge status={item.status} />,
    },
    {
      key: 'recommendation',
      header: 'Recomendacion',
      render: (item: Finding) => {
        const text = (item as unknown as Record<string, unknown>).recommendation as string || item.corrective_action || '-';
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
      },
    },
    {
      key: 'is_resolved',
      header: 'Resuelto',
      render: (item: Finding) => {
        const resolved = (item as unknown as Record<string, unknown>).is_resolved;
        return resolved ? 'Si' : 'No';
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item: Finding) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onViewInspection(item)}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
