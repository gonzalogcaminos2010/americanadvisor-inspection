'use client';

import { Finding } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { correctionDeadline } from '@/lib/correction-deadline';
import { Pencil, ExternalLink } from 'lucide-react';

const BADGE_BASE = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold';

function DeadlineBadge({ finding }: { finding: Finding }) {
  const { status, daysLeft } = correctionDeadline(finding);

  if (status === 'closed' || status === 'none') {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  if (status === 'overdue') {
    return <span className={`${BADGE_BASE} bg-red-100 text-red-700`}>Vencido</span>;
  }
  const color = status === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  return <span className={`${BADGE_BASE} ${color}`}>{daysLeft}d restantes</span>;
}

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
      key: 'due_date',
      header: 'Plazo',
      render: (item: Finding) => <DeadlineBadge finding={item} />,
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
