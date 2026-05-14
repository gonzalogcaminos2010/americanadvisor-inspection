/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import {
  Inspection,
  InspectionAnswer,
  InspectionPhoto,
  Finding,
  TemplateSection,
  InspectionStatus,
  QUESTION_TYPE_LABELS,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, Camera, CheckCircle, RotateCcw } from 'lucide-react';

type Tab = 'respuestas' | 'hallazgos' | 'fotos';

interface SupervisorReviewViewProps {
  inspection: Inspection;
  inspectionQueryId: string;
  canReview: boolean;
}

/**
 * View rendered when an inspection is in a read-only state
 * (COMPLETED, SUBMITTED, APPROVED, RETURNED). Shows tabs for answers,
 * findings, and photos, plus supervisor approve/return actions when applicable.
 */
export function SupervisorReviewView({
  inspection,
  inspectionQueryId,
  canReview,
}: SupervisorReviewViewProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('respuestas');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const sections =
    inspection.template?.sections?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const answers = inspection.answers || [];
  const findings = inspection.findings || [];
  const photos = inspection.photos || [];

  const answerMap = new Map<number, InspectionAnswer>();
  answers.forEach((a) => answerMap.set(a.question_id, a));

  const handleApproveSuccess = () => {
    setShowApproveModal(false);
    queryClient.invalidateQueries({ queryKey: ['inspection', inspectionQueryId] });
    queryClient.invalidateQueries({ queryKey: ['inspections-submitted-count'] });
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
    toast.success('Inspeccion aprobada exitosamente');
  };

  const handleReturnSuccess = () => {
    setShowReturnModal(false);
    queryClient.invalidateQueries({ queryKey: ['inspection', inspectionQueryId] });
    queryClient.invalidateQueries({ queryKey: ['inspections-submitted-count'] });
    queryClient.invalidateQueries({ queryKey: ['inspections'] });
    toast.success('Inspeccion devuelta al inspector');
  };

  return (
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
      {activeTab === 'hallazgos' && <FindingsTab findings={findings} />}
      {activeTab === 'fotos' && <PhotosTab photos={photos} />}

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

      {/* Supervisor action buttons */}
      {canReview && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-6 py-4">
          <p className="text-sm font-semibold text-amber-800 mb-3">Acciones de Supervisor</p>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => setShowApproveModal(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
            <Button variant="secondary" onClick={() => setShowReturnModal(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Devolver
            </Button>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <ApproveModal
          inspectionId={inspection.id}
          onClose={() => setShowApproveModal(false)}
          onSuccess={handleApproveSuccess}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <ReturnModal
          inspectionId={inspection.id}
          onClose={() => setShowReturnModal(false)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

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
      <span
        className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
          active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}
      >
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
        const questions =
          section.questions?.sort((a, b) => a.sort_order - b.sort_order) || [];
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
                        <p
                          className={`text-sm font-medium ${
                            isFlagged ? 'text-red-800' : 'text-gray-900'
                          }`}
                        >
                          {question.question_text}
                          {question.is_required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {QUESTION_TYPE_LABELS[question.question_type]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            isFlagged ? 'text-red-700' : 'text-gray-700'
                          }`}
                        >
                          {displayValue}
                        </p>
                        {answer?.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">{answer.notes}</p>
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

function ApproveModal({
  inspectionId,
  onClose,
  onSuccess,
}: {
  inspectionId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [finalResult, setFinalResult] = useState('approved');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.post(`/inspections/${inspectionId}/approve`, {
        final_result: finalResult,
        supervisor_notes: notes || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al aprobar la inspeccion';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aprobar Inspeccion</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resultado Final
            </label>
            <select
              value={finalResult}
              onChange={(e) => setFinalResult(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="approved">Aprobado</option>
              <option value="conditionally_approved">Aprobado con Condiciones</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas del Supervisor (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Agregar notas o comentarios..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleApprove} disabled={loading}>
            {loading ? 'Aprobando...' : 'Confirmar Aprobacion'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReturnModal({
  inspectionId,
  onClose,
  onSuccess,
}: {
  inspectionId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReturn = async () => {
    if (!notes.trim()) {
      toast.error('Las notas son requeridas para devolver una inspeccion');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/inspections/${inspectionId}/return`, {
        supervisor_notes: notes,
      });
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al devolver la inspeccion';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Devolver Inspeccion</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de devolucion <span className="text-red-500">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Describa el motivo por el cual se devuelve la inspeccion..."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleReturn}
            disabled={loading || !notes.trim()}
          >
            {loading ? 'Devolviendo...' : 'Confirmar Devolucion'}
          </Button>
        </div>
      </div>
    </div>
  );
}
