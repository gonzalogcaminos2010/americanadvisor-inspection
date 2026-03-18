'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Inspection, InspectionFormData } from '@/types';
import { useCrud } from '@/hooks/use-crud';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column } from '@/components/shared/data-table';
import { Eye } from 'lucide-react';

export default function RevisionesPendientesPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();

  const { useList } = useCrud<Inspection, InspectionFormData>({
    endpoint: '/inspections',
    queryKey: 'inspections-submitted',
  });

  const { data: response, isLoading } = useList({
    page,
    per_page: 15,
    status: 'SUBMITTED',
  });

  const handleView = (inspection: Inspection) => {
    router.push(`/inspections/${inspection.id}`);
  };

  const columns: Column<Inspection>[] = useMemo(
    () => [
      { key: 'id', header: '#' },
      {
        key: 'equipment',
        header: 'Equipo',
        render: (item: Inspection) => {
          const raw = item as unknown as Record<string, unknown>;
          const equip = raw.equipment as Record<string, unknown> | undefined;
          return (equip?.name as string) || item.work_order?.equipment?.name || '-';
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
        key: 'overall_result',
        header: 'Resultado',
        render: (item: Inspection) =>
          item.overall_result ? <Badge status={item.overall_result} /> : '-',
      },
      {
        key: 'score',
        header: 'Puntaje',
        render: (item: Inspection) =>
          item.score != null ? `${item.score}%` : '-',
      },
      {
        key: 'date',
        header: 'Fecha',
        render: (item: Inspection) => {
          const date = item.completed_at || item.started_at || item.created_at;
          return date ? new Date(date).toLocaleDateString('es-ES') : '-';
        },
      },
      {
        key: 'actions',
        header: 'Acciones',
        render: (item: Inspection) => (
          <Button variant="ghost" size="sm" onClick={() => handleView(item)}>
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Revisiones Pendientes" />

      <DataTable
        columns={columns}
        data={response?.data ?? []}
        isLoading={isLoading}
        pagination={response?.meta}
        onPageChange={setPage}
      />
    </div>
  );
}
