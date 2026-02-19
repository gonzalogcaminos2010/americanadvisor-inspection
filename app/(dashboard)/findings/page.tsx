'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Finding, FindingFormData, FindingSeverity, FindingStatus } from '@/types';
import { useCrud } from '@/hooks/use-crud';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { PageHeader } from '@/components/shared/page-header';
import { getFindingColumns } from './_components/finding-columns';
import { FindingForm } from './_components/finding-form';

const severityOptions = [
  { value: FindingSeverity.LOW, label: 'Baja' },
  { value: FindingSeverity.MEDIUM, label: 'Media' },
  { value: FindingSeverity.HIGH, label: 'Alta' },
  { value: FindingSeverity.CRITICAL, label: 'Critico' },
];

const statusOptions = [
  { value: FindingStatus.OPEN, label: 'Abierto' },
  { value: FindingStatus.IN_REVIEW, label: 'En Revision' },
  { value: FindingStatus.CORRECTIVE_ACTION, label: 'Accion Correctiva' },
  { value: FindingStatus.RESOLVED, label: 'Resuelto' },
  { value: FindingStatus.CLOSED, label: 'Cerrado' },
];

export default function FindingsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { useList, useUpdate } = useCrud<Finding, FindingFormData>({
    endpoint: '/findings',
    queryKey: 'findings',
  });

  const { data: response, isLoading } = useList({
    search,
    page,
    per_page: 15,
    severity: severityFilter || undefined,
    status: statusFilter || undefined,
  });
  const updateMutation = useUpdate();

  const handleOpenEdit = (finding: Finding) => {
    setEditingFinding(finding);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingFinding(null);
  };

  const handleViewInspection = (finding: Finding) => {
    router.push(`/inspections/${finding.inspection_id}`);
  };

  const handleSubmit = (data: FindingFormData) => {
    if (!editingFinding) return;
    updateMutation.mutate(
      { id: editingFinding.id, data },
      {
        onSuccess: () => {
          toast.success('Hallazgo actualizado exitosamente');
          handleCloseModal();
        },
        onError: (err) => {
          toast.error(err.message || 'Error al procesar la solicitud');
        },
      }
    );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () => getFindingColumns(handleOpenEdit, handleViewInspection),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Hallazgos" />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={(val) => { setSearch(val); setPage(1); }}
            placeholder="Buscar hallazgos..."
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas las severidades</option>
            {severityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Editar Hallazgo"
        size="xl"
      >
        {editingFinding && (
          <FindingForm
            initialData={editingFinding}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
