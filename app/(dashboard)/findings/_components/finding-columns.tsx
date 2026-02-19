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
      key: 'title',
      header: 'Titulo',
      render: (item: Finding) =>
        item.title.length > 40 ? item.title.slice(0, 40) + '...' : item.title,
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
      key: 'corrective_action',
      header: 'Accion Correctiva',
      render: (item: Finding) => {
        const text = item.corrective_action ?? '-';
        return text.length > 40 ? text.slice(0, 40) + '...' : text;
      },
    },
    {
      key: 'due_date',
      header: 'Fecha Limite',
      render: (item: Finding) =>
        item.due_date ? new Date(item.due_date).toLocaleDateString('es-ES') : '-',
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
