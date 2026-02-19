'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { InspectionTemplate, InspectionTemplateFormData, ApiResponse } from '@/types';
import { useCrud } from '@/hooks/use-crud';
import { useToast } from '@/components/ui/toast';
import { DataTable } from '@/components/shared/data-table';
import { SearchBar } from '@/components/shared/search-bar';
import { PageHeader } from '@/components/shared/page-header';
import { getTemplateColumns } from './_components/template-columns';

export default function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useList } = useCrud<InspectionTemplate, InspectionTemplateFormData>({
    endpoint: '/inspection-templates',
    queryKey: 'inspection-templates',
  });

  const { data: response, isLoading } = useList({ search, page, per_page: 15 });

  const duplicateMutation = useMutation<ApiResponse<InspectionTemplate>, Error, number>({
    mutationFn: (id) => api.post(`/inspection-templates/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      toast.success('Plantilla duplicada exitosamente');
    },
    onError: () => {
      toast.error('Error al duplicar la plantilla');
    },
  });

  const toggleActiveMutation = useMutation<ApiResponse<InspectionTemplate>, Error, { id: number; is_active: boolean }>({
    mutationFn: ({ id, is_active }) => api.put(`/inspection-templates/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      toast.success('Estado de plantilla actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar el estado');
    },
  });

  const handleView = (template: InspectionTemplate) => {
    router.push(`/templates/${template.id}`);
  };

  const handleEdit = (template: InspectionTemplate) => {
    router.push(`/templates/builder/${template.id}`);
  };

  const handleDuplicate = (template: InspectionTemplate) => {
    duplicateMutation.mutate(template.id);
  };

  const handleToggleActive = (template: InspectionTemplate) => {
    toggleActiveMutation.mutate({ id: template.id, is_active: !template.is_active });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () => getTemplateColumns(handleView, handleEdit, handleDuplicate, handleToggleActive),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantillas de Inspección"
        actionLabel="Nueva Plantilla"
        onAction={() => router.push('/templates/builder')}
      />

      <SearchBar
        value={search}
        onChange={(val) => { setSearch(val); setPage(1); }}
        placeholder="Buscar plantillas..."
      />

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
