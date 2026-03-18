'use client';

import { Equipment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Pencil, Trash2 } from 'lucide-react';

export function getEquipmentColumns(
  onEdit: (equipment: Equipment) => void,
  onDelete: (equipment: Equipment) => void
): Column<Equipment>[] {
  return [
    { key: 'equipment_code', header: 'Codigo' },
    { key: 'name', header: 'Nombre' },
    {
      key: 'client',
      header: 'Cliente',
      render: (item: Equipment) => item.client?.name || '-',
    },
    { key: 'model', header: 'Modelo' },
    { key: 'serial_number', header: 'N\u00b0 Serie' },
    {
      key: 'metadata',
      header: 'Campos Adic.',
      render: (item: Equipment) => {
        const meta = item.metadata;
        if (!meta || Object.keys(meta).length === 0) return '-';
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {Object.keys(meta).length}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (item: Equipment) => <Badge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item: Equipment) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}
