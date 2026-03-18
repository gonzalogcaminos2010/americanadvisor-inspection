'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  Menu,
  X,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { getInspectionReportPreview } from '@/lib/api';
import { useInspection } from '@/hooks/use-inspection';
import { InspectionReportPreview } from '@/components/inspection/inspection-report-preview';
import type { TemplateQuestion, AnswerSubmission } from '@/types';

export default function InspectorInspectionExecutorPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = Number(params.id);
  const { toast } = useToast();

  const {
    inspection,
    sections,
    currentSection,
    currentSectionIndex,
    answers,
    isLoading,
    sectionProgress,
    totalQuestions,
    totalAnswered,
    progressPercent,
    pendingSync,
    setAnswer,
    syncAnswers,
    goToSection,
    nextSection,
    prevSection,
    submitMutation,
  } = useInspection(inspectionId);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleEnviarClick = useCallback(async () => {
    syncAnswers();
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const url = await getInspectionReportPreview(inspectionId);
      setPreviewUrl(url);
    } catch {
      setPreviewError('No se pudo generar el preview del informe. Puede continuar con el envio.');
      toast.error('Error al generar preview del informe');
    } finally {
      setPreviewLoading(false);
    }
  }, [syncAnswers, inspectionId, toast]);

  const handleConfirmSubmit = useCallback(async () => {
    return new Promise<void>((resolve) => {
      submitMutation.mutate(
        {},
        {
          onSuccess: () => {
            toast.success('Inspeccion enviada exitosamente');
            setSubmitted(true);
            setShowPreview(false);
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
            resolve();
          },
          onError: (err: unknown) => {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            toast.error(axiosErr?.response?.data?.message || axiosErr?.message || 'Error al enviar la inspeccion');
            resolve();
          },
        }
      );
    });
  }, [submitMutation, toast, previewUrl]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-col h-96 items-center justify-center gap-4">
        <p className="text-gray-500">No se encontro la inspeccion</p>
        <Button variant="secondary" onClick={() => router.push('/inspector/mis-inspecciones')}>
          Volver
        </Button>
      </div>
    );
  }

  const inspStatus = inspection.status?.toLowerCase() || '';
  const isReturned = inspStatus === 'returned';
  const isSubmittedOrCompleted = inspStatus === 'submitted' || inspStatus === 'completed';
  const supervisorNotes = (inspection as unknown as Record<string, unknown>).supervisor_notes as string | undefined;

  // If submitted, show result screen
  if (submitted || isSubmittedOrCompleted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Inspeccion Enviada</h1>
        {inspection.overall_result && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Resultado:</p>
            <Badge status={inspection.overall_result} size="md" />
          </div>
        )}
        <p className="text-sm text-gray-500">
          {inspection.template?.name} - {totalAnswered}/{totalQuestions} preguntas respondidas
        </p>
        {inspection.completed_at && (
          <p className="text-xs text-gray-400">
            Completada: {new Date(inspection.completed_at).toLocaleString('es-AR')}
          </p>
        )}
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push('/inspector/mis-ordenes')}>
            Ir a Mis Ordenes
          </Button>
          <Button variant="secondary" onClick={() => router.push('/inspector/mis-inspecciones')}>
            Ir a Mis Inspecciones
          </Button>
        </div>
      </div>
    );
  }

  const isLastSection = currentSectionIndex === sections.length - 1;
  const questions = currentSection?.questions?.sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 lg:-m-6">
      {/* Returned banner */}
      {isReturned && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Inspeccion Devuelta por Supervisor</p>
              {supervisorNotes && (
                <p className="text-sm mt-1">{supervisorNotes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/inspector/mis-ordenes')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">
                {inspection.template?.name || 'Inspeccion'}
              </h1>
              <p className="text-xs text-gray-500">
                {totalAnswered} de {totalQuestions} respondidas - {sectionProgress.filter(s => s.answered === s.total && s.total > 0).length}/{sections.length} secciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {pendingSync ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Guardado</span>
              </>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Section sidebar */}
        <aside
          className={cn(
            'w-72 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 p-4',
            'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:shadow-lg max-lg:transition-transform',
            sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
          )}
        >
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Secciones
          </h2>
          <div className="space-y-1">
            {sectionProgress.map((sp, idx) => {
              const isCurrent = idx === currentSectionIndex;
              const isComplete = sp.answered === sp.total && sp.total > 0;
              return (
                <button
                  key={sp.sectionId}
                  onClick={() => {
                    goToSection(idx);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2',
                    isCurrent
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                    isComplete
                      ? 'bg-green-100 text-green-700'
                      : isCurrent
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  )}>
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{sp.title}</p>
                    <p className="text-xs text-gray-400">{sp.answered}/{sp.total}</p>
                  </div>
                  {sp.hasFails && (
                    <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 mx-auto max-w-2xl w-full px-4 py-6">
            {currentSection && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{currentSection.title}</h2>
                  {currentSection.description && (
                    <p className="mt-1 text-sm text-gray-500">{currentSection.description}</p>
                  )}
                </div>

                <div className="space-y-5">
                  {questions.map((question) => (
                    <QuestionField
                      key={question.id}
                      question={question}
                      answer={answers.get(question.id)}
                      onAnswer={(submission) => setAnswer(question.id, submission)}
                    />
                  ))}
                </div>

                {/* Save section button */}
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => syncAnswers()}
                    disabled={!pendingSync}
                  >
                    Guardar Seccion
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
            <div className="mx-auto flex max-w-2xl items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => {
                  syncAnswers();
                  prevSection();
                }}
                disabled={currentSectionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {isLastSection ? (
                <Button
                  onClick={handleEnviarClick}
                >
                  Enviar Inspeccion
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    syncAnswers();
                    nextSection();
                  }}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Report Preview */}
      <InspectionReportPreview
        open={showPreview}
        onClose={handleClosePreview}
        onConfirmSubmit={handleConfirmSubmit}
        pdfUrl={previewUrl}
        loading={previewLoading}
        error={previewError}
      />
    </div>
  );
}

// ── Question Field Component ──

interface QuestionFieldProps {
  question: TemplateQuestion;
  answer?: AnswerSubmission;
  onAnswer: (submission: Partial<AnswerSubmission>) => void;
}

function QuestionField({ question, answer, onAnswer }: QuestionFieldProps) {
  const qType = (question.question_type || '').toLowerCase();
  const isRequired = question.is_required;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-2 mb-3">
        <p className="text-sm font-medium text-gray-900 flex-1">
          {question.question_text}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </p>
        {answer?.is_flagged && (
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        )}
      </div>

      {question.help_text && (
        <p className="text-xs text-gray-400 mb-3">{question.help_text}</p>
      )}

      {/* yes_no */}
      {qType === 'yes_no' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              const isFlagged = question.fail_values?.includes('true') || question.fail_values?.includes('si') || false;
              onAnswer({ answer_boolean: true, answer_value: 'true', is_flagged: isFlagged });
            }}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors',
              answer?.answer_boolean === true
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50/50'
            )}
          >
            Si
          </button>
          <button
            type="button"
            onClick={() => {
              const isFlagged = question.fail_values?.includes('false') || question.fail_values?.includes('no') || false;
              onAnswer({ answer_boolean: false, answer_value: 'false', is_flagged: isFlagged });
            }}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors',
              answer?.answer_boolean === false
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50/50'
            )}
          >
            No
          </button>
        </div>
      )}

      {/* text */}
      {qType === 'text' && (
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y min-h-[80px]"
          placeholder="Escriba su respuesta..."
          value={answer?.answer_value ?? ''}
          onChange={(e) => onAnswer({ answer_value: e.target.value })}
        />
      )}

      {/* number */}
      {qType === 'number' && (
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Ingrese un numero..."
          value={answer?.answer_number ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? undefined : Number(e.target.value);
            onAnswer({ answer_number: val, answer_value: e.target.value });
          }}
        />
      )}

      {/* select / multiple_choice */}
      {(qType === 'select' || qType === 'multiple_choice') && (
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          value={answer?.answer_value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            const isFlagged = question.fail_values?.includes(val) || false;
            onAnswer({ answer_value: val, is_flagged: isFlagged });
          }}
        >
          <option value="">Seleccione una opcion...</option>
          {(question.options || []).map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* photo */}
      {qType === 'photo' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Subir Foto</p>
          <p className="text-xs text-gray-400 mt-1">(Funcionalidad proximamente)</p>
        </div>
      )}

      {/* date */}
      {qType === 'date' && (
        <input
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          value={answer?.answer_value ?? ''}
          onChange={(e) => onAnswer({ answer_value: e.target.value })}
        />
      )}

      {/* rating */}
      {qType === 'rating' && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => onAnswer({ answer_number: val, answer_value: String(val) })}
              className={cn(
                'w-10 h-10 rounded-lg border-2 text-sm font-medium transition-colors',
                answer?.answer_number === val
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-300'
              )}
            >
              {val}
            </button>
          ))}
        </div>
      )}

      {/* Notes field */}
      <div className="mt-3">
        <details className="group">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            {answer?.notes ? 'Notas' : 'Agregar notas (opcional)'}
          </summary>
          <textarea
            className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y min-h-[50px]"
            placeholder="Notas adicionales..."
            value={answer?.notes ?? ''}
            onChange={(e) => onAnswer({ notes: e.target.value })}
          />
        </details>
      </div>
    </div>
  );
}
