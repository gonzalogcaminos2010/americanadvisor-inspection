'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api, getInspectionReport, getInspectionCertificate, reopenInspection } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Inspection, ApiResponse, InspectionStatus } from '@/types';
import { mapTemplateFromApi } from '@/hooks/use-crud';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SignatureSection } from '@/components/inspection/signature-section';
import { ArrowLeft, FileText, AlertTriangle, MapPin, CheckCircle, ShieldCheck, Award, Download, Pencil } from 'lucide-react';
import { InspectorExecutorView } from './_components/InspectorExecutorView';
import { SupervisorReviewView } from './_components/SupervisorReviewView';
import { inspectionAbilities } from '@/lib/transitions/inspection-transitions';

const RESULT_LABELS: Record<string, string> = {
  PASS: 'Aprobado',
  FAIL: 'Reprobado',
  NEEDS_REVIEW: 'Requiere Revision',
  approved: 'Aprobado',
  conditionally_approved: 'Aprobado Condicional',
  rejected: 'Rechazado',
  pass: 'Aprobado',
  fail: 'Reprobado',
  needs_review: 'Requiere Revision',
};

function formatResult(result: string | null | undefined): string {
  if (!result) return '-';
  return RESULT_LABELS[result] || result;
}

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);

  const { data: response, isLoading } = useQuery<ApiResponse<Inspection>>({
    queryKey: ['inspection', id],
    queryFn: async () => {
      const raw = await api.get<ApiResponse<Inspection>>(`/inspections/${id}`);
      // Map template section/question field names from API to frontend format
      if (raw?.data?.template) {
        raw.data.template = mapTemplateFromApi(
          raw.data.template as unknown as Record<string, unknown>
        ) as unknown as typeof raw.data.template;
      }
      return raw;
    },
    enabled: !!id,
  });

  const inspection = response?.data;

  const reopenMutation = useMutation({
    mutationFn: () => reopenInspection(Number(id)),
    onSuccess: () => {
      toast.success('Inspeccion reabierta. Ahora podes editarla.');
      setShowReopenConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      queryClient.invalidateQueries({ queryKey: ['inspections-submitted-bell'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo reabrir la inspeccion');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Inspeccion no encontrada</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/inspections')}>
          Volver
        </Button>
      </div>
    );
  }

  // Normalize status to uppercase to match enum (API may return lowercase)
  const status = (inspection.status?.toUpperCase() || '') as InspectionStatus;
  // Reglas de la Inspección centralizadas (ver lib/transitions + CONTEXT.md).
  const { isActive, isReadOnly, canReview, canReopen } = inspectionAbilities(inspection, user);

  // Normalize overall_result for color logic (API may return lowercase)
  const resultUpper = (inspection.overall_result || '').toUpperCase();
  const isPass = resultUpper === 'PASS' || resultUpper === 'APPROVED';
  const isFail = resultUpper === 'FAIL' || resultUpper === 'REJECTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/inspections')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Inspeccion #{inspection.id}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {inspection.template?.name ?? 'Sin plantilla'}
            {inspection.work_order?.equipment?.name &&
              ` - ${inspection.work_order.equipment.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={inspection.status} size="md" />
          {inspection.overall_result && (
            <Badge status={inspection.overall_result} size="md" />
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="Inspector" value={inspection.inspector?.name ?? '-'} />
        <InfoCard
          label="Orden de Trabajo"
          value={
            inspection.work_order?.order_number ||
            `OT #${
              (inspection as unknown as Record<string, unknown>).work_order_item_id ||
              inspection.work_order_id ||
              '-'
            }`
          }
        />
        <InfoCard
          label="Inicio"
          value={
            inspection.started_at
              ? new Date(inspection.started_at).toLocaleString('es-ES')
              : '-'
          }
        />
        <InfoCard
          label="Finalizacion"
          value={
            inspection.completed_at
              ? new Date(inspection.completed_at).toLocaleString('es-ES')
              : '-'
          }
        />
      </div>

      {/* GPS info */}
      {inspection.gps_latitude && inspection.gps_longitude && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg shadow px-4 py-3">
          <MapPin className="h-4 w-4" />
          <span>
            Ubicacion GPS: {inspection.gps_latitude.toFixed(6)},{' '}
            {inspection.gps_longitude.toFixed(6)}
          </span>
        </div>
      )}

      {/* Score & Result banner */}
      {inspection.score != null && (
        <div
          className={`rounded-lg shadow px-6 py-4 flex items-center justify-between ${
            isPass
              ? 'bg-green-50 border border-green-200'
              : isFail
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck
              className={`h-6 w-6 ${
                isPass ? 'text-green-600' : isFail ? 'text-red-600' : 'text-yellow-600'
              }`}
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Puntaje de Inspeccion</p>
              <p
                className={`text-2xl font-bold ${
                  isPass ? 'text-green-700' : isFail ? 'text-red-700' : 'text-yellow-700'
                }`}
              >
                {inspection.score}%
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500 uppercase">Resultado</p>
            <p
              className={`text-lg font-bold ${
                isPass ? 'text-green-700' : isFail ? 'text-red-700' : 'text-yellow-700'
              }`}
            >
              {formatResult(inspection.overall_result)}
            </p>
            {inspection.final_result &&
              inspection.final_result !== inspection.overall_result && (
                <p className="text-xs text-gray-500 mt-1">
                  Resultado final: {inspection.final_result}
                </p>
              )}
          </div>
        </div>
      )}

      {/* Approval info */}
      {inspection.approved_by && (
        <div className="bg-white rounded-lg shadow px-6 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Aprobado por:{' '}
                {inspection.approver?.name ?? `Usuario #${inspection.approved_by}`}
              </p>
              {inspection.approved_at && (
                <p className="text-xs text-gray-500">
                  {new Date(inspection.approved_at).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          </div>
          {inspection.supervisor_notes && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase">
                Notas del Supervisor
              </p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {inspection.supervisor_notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Certificate card */}
      {inspection.certificate_number && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Certificado de Inspeccion
                </p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  N° {inspection.certificate_number}
                </p>
                {inspection.certificate_issued_at && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Emitido:{' '}
                    {new Date(inspection.certificate_issued_at).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  const url = await getInspectionCertificate(inspection.id);
                  window.open(url, '_blank');
                } catch {
                  toast.error('Error al obtener el certificado');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Certificado
            </Button>
          </div>
        </div>
      )}

      {/* Returned alert */}
      {status === InspectionStatus.RETURNED && inspection.supervisor_notes && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-6 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Inspeccion Devuelta</p>
            <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">
              {inspection.supervisor_notes}
            </p>
          </div>
        </div>
      )}

      {/* Signatures */}
      <SignatureSection inspection={inspection} />

      {/* ── View router ── */}

      {/* Active inspection: inspector fills in form */}
      {isActive && <InspectorExecutorView inspection={inspection} />}

      {/* Read-only inspection: supervisor reviews tabs, answers, findings, photos */}
      {isReadOnly && (
        <SupervisorReviewView
          inspection={inspection}
          inspectionQueryId={id}
          canReview={canReview}
        />
      )}

      {/* Bottom action bar */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/inspections')}>
          Volver
        </Button>
        {canReopen && (
          <Button variant="primary" onClick={() => setShowReopenConfirm(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        {(status === InspectionStatus.COMPLETED ||
          status === InspectionStatus.SUBMITTED ||
          status === InspectionStatus.APPROVED) && (
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const url = await getInspectionReport(inspection.id);
                window.open(url, '_blank');
              } catch {
                toast.error('Error al obtener el informe');
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Descargar Informe
          </Button>
        )}
      </div>

      <ConfirmDialog
        isOpen={showReopenConfirm}
        onClose={() => setShowReopenConfirm(false)}
        onConfirm={() => reopenMutation.mutate()}
        isLoading={reopenMutation.isPending}
        title="Reabrir inspeccion"
        message={
          status === InspectionStatus.SUBMITTED
            ? 'Esta inspeccion esta enviada al supervisor para revision. Si la editas, va a salir de la cola de revision hasta que la vuelvas a enviar. Continuar?'
            : 'Esta inspeccion fue devuelta por el supervisor. Al reabrirla podras corregirla y reenviarla. Continuar?'
        }
      />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-3">
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
