'use client';

import { cn } from '@/lib/utils';
import type { TemplateBuilderState } from '@/hooks/use-template-builder';
import { TEMPLATE_CATEGORIES, QUESTION_TYPE_LABELS, QuestionType } from '@/types';
import { FileText, CheckCircle2 } from 'lucide-react';

interface TemplatePreviewProps {
  state: TemplateBuilderState;
}

export function TemplatePreview({ state }: TemplatePreviewProps) {
  const categoryLabel = TEMPLATE_CATEGORIES[state.category] || state.category;
  const totalQuestions = state.sections.reduce(
    (sum, s) => sum + s.questions.length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-3">
          <FileText className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {state.name || 'Sin nombre'}
            </h3>
            {state.code && (
              <p className="text-sm text-gray-500 mt-0.5">
                Codigo: {state.code}
              </p>
            )}
            {state.description && (
              <p className="text-sm text-gray-600 mt-2">{state.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {categoryLabel && (
                <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
                  {categoryLabel}
                </span>
              )}
              {state.version && (
                <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs font-medium">
                  v{state.version}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs font-medium">
                {state.sections.length} secciones
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs font-medium">
                {totalQuestions} preguntas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {state.sections.map((section, sIndex) => (
        <div
          key={section.tempId}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-blue-600">
              {sIndex + 1}.
            </span>
            <h4 className="text-base font-medium text-gray-900">
              {section.title || 'Sin titulo'}
            </h4>
            {section.is_required && (
              <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
                Requerida
              </span>
            )}
          </div>
          {section.description && (
            <p className="text-sm text-gray-500 mb-3">{section.description}</p>
          )}

          {section.questions.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Sin preguntas en esta seccion
            </p>
          ) : (
            <div className="space-y-2">
              {section.questions.map((q, qIndex) => (
                <div
                  key={q.tempId}
                  className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-sm text-gray-400 w-6 text-right shrink-0 pt-0.5">
                    {qIndex + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-900">
                        {q.question_text || 'Sin texto'}
                      </span>
                      {q.is_required && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          getTypeColor(q.question_type)
                        )}
                      >
                        {QUESTION_TYPE_LABELS[q.question_type]}
                      </span>
                      {q.help_text && (
                        <span className="text-xs text-gray-400">
                          {q.help_text}
                        </span>
                      )}
                    </div>
                    {q.question_type === QuestionType.MULTIPLE_CHOICE &&
                      q.options.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {q.options.map((opt, i) => (
                            <span
                              key={i}
                              className={cn(
                                'inline-flex items-center rounded px-1.5 py-0.5 text-xs',
                                q.fail_values.includes(opt)
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {opt || '...'}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {state.sections.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No hay secciones para previsualizar
        </div>
      )}
    </div>
  );
}

function getTypeColor(type: QuestionType): string {
  const colors: Record<QuestionType, string> = {
    [QuestionType.TEXT]: 'bg-gray-100 text-gray-700',
    [QuestionType.NUMBER]: 'bg-purple-100 text-purple-700',
    [QuestionType.YES_NO]: 'bg-green-100 text-green-700',
    [QuestionType.MULTIPLE_CHOICE]: 'bg-blue-100 text-blue-700',
    [QuestionType.PHOTO]: 'bg-yellow-100 text-yellow-700',
    [QuestionType.SIGNATURE]: 'bg-pink-100 text-pink-700',
    [QuestionType.DATE]: 'bg-orange-100 text-orange-700',
    [QuestionType.RATING]: 'bg-indigo-100 text-indigo-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}
