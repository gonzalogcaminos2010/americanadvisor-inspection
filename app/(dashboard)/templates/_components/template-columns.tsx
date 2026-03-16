'use client';

import { InspectionTemplate, TEMPLATE_CATEGORIES } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Eye, Pencil, Copy, ToggleLeft, ToggleRight } from 'lucide-react';

export function getTemplateColumns(
  onView: (template: InspectionTemplate) => void,
  onEdit: (template: InspectionTemplate) => void,
  onDuplicate: (template: InspectionTemplate) => void,
  onToggleActive: (template: InspectionTemplate) => void
): Column<InspectionTemplate>[] {
  return [
    { key: 'name', header: 'Nombre' },
    { key: 'code', header: 'Código' },
    {
      key: 'category',
      header: 'Categoría',
      render: (template: InspectionTemplate) => (
        <span className="text-sm text-gray-700">
          {TEMPLATE_CATEGORIES[template.category] || template.category}
        </span>
      ),
    },
    { key: 'version', header: 'Versión' },
    {
      key: 'is_active',
      header: 'Estado',
      render: (template: InspectionTemplate) => (
        <Badge status={template.is_active ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'sections_count',
      header: 'Secciones',
      render: (template: InspectionTemplate) => (
        <span className="text-sm text-gray-600">{template.sections_count != null ? template.sections_count : '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (template: InspectionTemplate) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(template)} title="Ver">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(template)} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(template)} title="Duplicar">
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(template)}
            title={template.is_active ? 'Desactivar' : 'Activar'}
          >
            {template.is_active ? (
              <ToggleRight className="h-4 w-4 text-green-600" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      ),
    },
  ];
}
