/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Inspection,
  ApiResponse,
  InspectionStatus,
  InspectionAnswer,
  InspectionPhoto,
  Finding,
  TemplateSection,
  QUESTION_TYPE_LABELS,
} from '@/types';
import { mapTemplateFromApi } from '@/hooks/use-crud';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { InspectionExecutor } from '@/components/inspection/inspection-executor';
import { ArrowLeft, FileText, AlertTriangle, Camera, MapPin } from 'lucide-react';

type Tab = 'respuestas' | 'hallazgos' | 'fotos';

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('respuestas');

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

  const isActive = inspection.status === InspectionStatus.NOT_STARTED || inspection.status === InspectionStatus.IN_PROGRESS;
  const isReadOnly = inspection.status === InspectionStatus.COMPLETED || inspection.status === InspectionStatus.SUBMITTED;

  const sections = inspection.template?.sections?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const answers = inspection.answers || [];
  const findings = inspection.findings || [];
  const photos = inspection.photos || [];

  const answerMap = new Map<number, InspectionAnswer>();
  answers.forEach((a) => answerMap.set(a.question_id, a));

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
            {inspection.work_order?.equipment?.name && ` - ${inspection.work_order.equipment.name}`}
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
          value={inspection.work_order?.order_number || `OT #${(inspection as unknown as Record<string, unknown>).work_order_item_id || inspection.work_order_id || '-'}`}
        />
        <InfoCard
          label="Inicio"
          value={inspection.started_at ? new Date(inspection.started_at).toLocaleString('es-ES') : '-'}
        />
        <InfoCard
          label="Finalizacion"
          value={inspection.completed_at ? new Date(inspection.completed_at).toLocaleString('es-ES') : '-'}
        />
      </div>

      {/* GPS info */}
      {inspection.gps_latitude && inspection.gps_longitude && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg shadow px-4 py-3">
          <MapPin className="h-4 w-4" />
          <span>Ubicacion GPS: {inspection.gps_latitude.toFixed(6)}, {inspection.gps_longitude.toFixed(6)}</span>
        </div>
      )}

      {/* Active inspection: show executor */}
      {isActive && (
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ minHeight: '60vh' }}>
          <InspectionExecutor inspectionId={inspection.id} />
        </div>
      )}

      {/* Read-only view for completed/submitted */}
      {isReadOnly && (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <TabButton
                active={activeTab === 'respuestas'}
                onClick={() => setActiveTab('respuestas')}
                icon={<FileText className="h-4 w-4" />}
                label="Respuestas"
                count={answers.length}
              />
              <TabButton
                active={activeTab === 'hallazgos'}
                onClick={() => setActiveTab('hallazgos')}
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Hallazgos"
                count={findings.length}
              />
              <TabButton
                active={activeTab === 'fotos'}
                onClick={() => setActiveTab('fotos')}
                icon={<Camera className="h-4 w-4" />}
                label="Fotos"
                count={photos.length}
              />
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'respuestas' && (
            <AnswersTab sections={sections} answerMap={answerMap} />
          )}
          {activeTab === 'hallazgos' && (
            <FindingsTab findings={findings} />
          )}
          {activeTab === 'fotos' && (
            <PhotosTab photos={photos} />
          )}

          {/* Signature */}
          {inspection.signature_data && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Firma</h3>
              <img
                src={inspection.signature_data}
                alt="Firma del inspector"
                className="max-w-xs border rounded"
              />
            </div>
          )}

          {/* Notes */}
          {inspection.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notas</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{inspection.notes}</p>
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/inspections')}>
          Volver
        </Button>
        <Button variant="primary" disabled>
          Generar Reporte
        </Button>
      </div>
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

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
      <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
        active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
      }`}>
        {count}
      </span>
    </button>
  );
}

function AnswersTab({
  sections,
  answerMap,
}: {
  sections: TemplateSection[];
  answerMap: Map<number, InspectionAnswer>;
}) {
  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No hay secciones disponibles
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const questions = section.questions?.sort((a, b) => a.sort_order - b.sort_order) || [];
        return (
          <div key={section.id} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {questions.map((question) => {
                const answer = answerMap.get(question.id);
                const isFlagged = answer?.is_flagged ?? false;
                const displayValue = getAnswerDisplayValue(answer);

                return (
                  <div
                    key={question.id}
                    className={`px-6 py-4 ${isFlagged ? 'bg-red-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isFlagged ? 'text-red-800' : 'text-gray-900'}`}>
                          {question.question_text}
                          {question.is_required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {QUESTION_TYPE_LABELS[question.question_type]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${isFlagged ? 'text-red-700' : 'text-gray-700'}`}>
                          {displayValue}
                        </p>
                        {answer?.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {answer.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {isFlagged && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Respuesta marcada</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getAnswerDisplayValue(answer?: InspectionAnswer): string {
  if (!answer) return 'Sin respuesta';
  if (answer.answer_boolean !== null && answer.answer_boolean !== undefined) {
    return answer.answer_boolean ? 'Si' : 'No';
  }
  if (answer.answer_number !== null && answer.answer_number !== undefined) {
    return String(answer.answer_number);
  }
  if (answer.answer_value) {
    return answer.answer_value;
  }
  return 'Sin respuesta';
}

function FindingsTab({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No se registraron hallazgos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {findings.map((finding) => (
        <div key={finding.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900">{finding.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge status={finding.severity} />
              <Badge status={finding.status} />
            </div>
          </div>
          {finding.corrective_action && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase">Accion Correctiva</p>
              <p className="text-sm text-gray-700 mt-1">{finding.corrective_action}</p>
            </div>
          )}
          {finding.due_date && (
            <p className="text-xs text-gray-500 mt-2">
              Fecha limite: {new Date(finding.due_date).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PhotosTab({ photos }: { photos: InspectionPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No se registraron fotos
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            <img
              src={photo.file_path}
              alt={photo.caption || photo.file_name}
              className="w-full h-full object-cover"
            />
          </div>
          {photo.caption && (
            <div className="p-2">
              <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
