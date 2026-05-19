'use client';

import { TemplateCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Pencil, Trash2 } from 'lucide-react';

export function getCategoryColumns(
  onEdit: (category: TemplateCategory) => void,
  onDelete: (category: TemplateCategory) => void
): Column<TemplateCategory>[] {
  return [
    { key: 'code', header: 'Codigo' },
    { key: 'name', header: 'Nombre' },
    {
      key: 'is_active',
      header: 'Estado',
      render: (cat: TemplateCategory) => (
        <Badge status={cat.is_active ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (cat: TemplateCategory) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(cat)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(cat)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}
