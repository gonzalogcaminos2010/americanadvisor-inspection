'use client';

import Link from 'next/link';
import { TemplateCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { ListChecks, Pencil, Trash2 } from 'lucide-react';

export function getCategoryColumns(
  onEdit: (category: TemplateCategory) => void,
  onDelete: (category: TemplateCategory) => void
): Column<TemplateCategory>[] {
  return [
    { key: 'code', header: 'Codigo' },
    { key: 'name', header: 'Nombre' },
    {
      key: 'default_template',
      header: 'Plantilla default',
      render: (cat: TemplateCategory) => (
        <span className="text-sm text-gray-600">
          {cat.default_template?.name ?? <span className="italic text-gray-400">— sin —</span>}
        </span>
      ),
    },
    {
      key: 'default_inspection_interval_months',
      header: 'Intervalo (meses)',
      render: (cat: TemplateCategory) => (
        <span className="text-sm text-gray-600">
          {cat.default_inspection_interval_months ?? <span className="italic text-gray-400">—</span>}
        </span>
      ),
    },
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
          <Link href={`/categories/${cat.id}/fields`}>
            <Button variant="ghost" size="sm" title="Campos de identificación">
              <ListChecks className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => onEdit(cat)} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(cat)} title="Eliminar">
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}
