'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Menu, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useInspection } from '@/hooks/use-inspection';
import { useToast } from '@/components/ui/toast';
import { SectionProgress } from './section-progress';
import { QuestionRenderer } from './question-renderer';
import { InspectionSummary } from './inspection-summary';
import type { FindingFormData } from '@/types';

interface InspectionExecutorProps {
  inspectionId: number;
  onCompleted?: () => void;
}

export function InspectionExecutor({ inspectionId, onCompleted }: InspectionExecutorProps) {
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
    uploadPhotoMutation,
    createFindingMutation,
  } = useInspection(inspectionId);

  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitInspection = useCallback(
    (data: { signature_data?: string; gps_latitude?: number; gps_longitude?: number; notes?: string }) => {
      // Sync any pending answers first, then submit
      syncAnswers();
      submitMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Inspeccion enviada exitosamente');
          setSubmitted(true);
          if (onCompleted) {
            // Small delay so the user sees the success toast
            setTimeout(() => onCompleted(), 1500);
          }
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const msg = axiosErr?.response?.data?.message || axiosErr?.message || 'Error al enviar la inspeccion';
          toast.error(msg);
        },
      });
    },
    [syncAnswers, submitMutation, toast, onCompleted]
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        No se encontro la inspeccion
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => setShowSummary(false)}>
            <ChevronLeft className="h-4 w-4" />
            Volver a la inspeccion
          </Button>
        </div>
        <InspectionSummary
          sectionProgress={sectionProgress}
          answers={answers}
          inspection={inspection}
          onSubmit={handleSubmitInspection}
          isSubmitting={submitMutation.isPending}
        />
        {submitted && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-800">Inspeccion enviada exitosamente</p>
          </div>
        )}
      </div>
    );
  }

  const isLastSection = currentSectionIndex === sections.length - 1;
  const questions = currentSection?.questions?.sort((a, b) => a.sort_order - b.sort_order) || [];

  return (
    <div className="flex h-full flex-col">
      {/* Progress bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                {totalAnswered} de {totalQuestions} respondidas
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
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
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
          <SectionProgress
            sections={sectionProgress}
            currentIndex={currentSectionIndex}
            onGoToSection={(idx) => {
              goToSection(idx);
              setSidebarOpen(false);
            }}
          />
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6">
            {currentSection && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{currentSection.title}</h2>
                  {currentSection.description && (
                    <p className="mt-1 text-sm text-gray-500">{currentSection.description}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {questions.map((question) => (
                    <QuestionRenderer
                      key={question.id}
                      question={question}
                      answer={answers.get(question.id)}
                      onAnswer={(submission) => setAnswer(question.id, submission)}
                      onCreateFinding={(data: FindingFormData) =>
                        createFindingMutation.mutate({ ...data, answer_id: question.id })
                      }
                      isFindingLoading={createFindingMutation.isPending}
                      photos={(inspection.photos || []).filter(
                        (p) => p.answer_id === question.id
                      )}
                      onUploadPhoto={(file) =>
                        uploadPhotoMutation.mutate({ file, answerId: question.id })
                      }
                      isUploadingPhoto={uploadPhotoMutation.isPending}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3">
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
                Seccion Anterior
              </Button>

              {isLastSection ? (
                <Button
                  onClick={() => {
                    syncAnswers();
                    setShowSummary(true);
                  }}
                >
                  Revisar y Enviar
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    syncAnswers();
                    nextSection();
                  }}
                >
                  Siguiente Seccion
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
