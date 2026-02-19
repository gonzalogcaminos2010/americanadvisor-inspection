'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Inspection, InspectionFormData, InspectionStatus } from '@/types';
import { useCrud } from '@/hooks/use-crud';
import { DataTable } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { PageHeader } from '@/components/shared/page-header';
import { getInspectionColumns } from './_components/inspection-columns';

const statusOptions = [
  { value: InspectionStatus.NOT_STARTED, label: 'No Iniciada' },
  { value: InspectionStatus.IN_PROGRESS, label: 'En Progreso' },
  { value: InspectionStatus.COMPLETED, label: 'Completada' },
  { value: InspectionStatus.SUBMITTED, label: 'Enviada' },
];

export default function InspectionsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  const { useList } = useCrud<Inspection, InspectionFormData>({
    endpoint: '/inspections',
    queryKey: 'inspections',
  });

  const { data: response, isLoading } = useList({
    search,
    page,
    per_page: 15,
    status: statusFilter || undefined,
  });

  const handleView = (inspection: Inspection) => {
    router.push(`/inspections/${inspection.id}`);
  };

  const handleContinue = (inspection: Inspection) => {
    router.push(`/inspections/${inspection.id}`);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () => getInspectionColumns(handleView, handleContinue),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Inspecciones" />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            placeholder="Buscar inspecciones..."
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

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
