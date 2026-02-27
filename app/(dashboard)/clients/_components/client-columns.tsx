'use client';

import { Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Pencil, Trash2, Eye } from 'lucide-react';

export function getClientColumns(
  onEdit: (client: Client) => void,
  onDelete: (client: Client) => void,
  onView: (client: Client) => void
): Column<Client>[] {
  return [
    { key: 'code', header: 'Codigo' },
    { key: 'name', header: 'Nombre' },
    { key: 'tax_id', header: 'CUIT/NIT' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Telefono' },
    { key: 'contact_person', header: 'Contacto' },
    {
      key: 'active',
      header: 'Estado',
      render: (client: Client) => <Badge status={client.active ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (client: Client) => (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => onView(client)}>
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(client)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}
