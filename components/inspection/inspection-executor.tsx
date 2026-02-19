'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useInspection } from '@/hooks/use-inspection';
import { SectionProgress } from './section-progress';
import { QuestionRenderer } from './question-renderer';
import { InspectionSummary } from './inspection-summary';
import type { FindingFormData } from '@/types';

interface InspectionExecutorProps {
  inspectionId: number;
}

export function InspectionExecutor({ inspectionId }: InspectionExecutorProps) {
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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
          onSubmit={(data) => submitMutation.mutate(data)}
          isSubmitting={submitMutation.isPending}
        />
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
