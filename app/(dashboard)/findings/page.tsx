'use client';

import { useRouter } from 'next/navigation';
import { Finding, FindingFormData, FindingSeverity, FindingStatus } from '@/types';
import { CrudListPage } from '@/components/shared/crud-list-page';
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
  const router = useRouter();

  return (
    <CrudListPage<Finding, FindingFormData>
      endpoint="/findings"
      queryKey="findings"
      title="Hallazgos"
      searchPlaceholder="Buscar hallazgos..."
      filters={[
        { key: 'severity', placeholder: 'Todas las severidades', options: severityOptions },
        { key: 'status', placeholder: 'Todos los estados', options: statusOptions },
      ]}
      columns={({ edit }) =>
        getFindingColumns(edit, (f) => router.push(`/inspections/${f.inspection_id}`))
      }
      renderForm={(props) => <FindingForm {...props} />}
      modalTitle={() => 'Editar Hallazgo'}
      toasts={{ updated: 'Hallazgo actualizado exitosamente' }}
    />
  );
}
