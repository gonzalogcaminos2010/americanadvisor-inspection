'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QuestionEditor } from './question-editor';
import type { BuilderSection } from '@/hooks/use-template-builder';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Trash2,
  GripVertical,
  Plus,
} from 'lucide-react';

interface SectionEditorProps {
  section: BuilderSection;
  sectionIndex: number;
  totalSections: number;
  onUpdate: (field: string, value: string | boolean) => void;
  onRemove: () => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionTempId: string) => void;
  onUpdateQuestion: (questionTempId: string, field: string, value: unknown) => void;
  onReorderQuestions: (fromIndex: number, toIndex: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SectionEditor({
  section,
  sectionIndex,
  totalSections,
  onUpdate,
  onRemove,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onReorderQuestions,
  onMoveUp,
  onMoveDown,
}: SectionEditorProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <GripVertical className="h-5 w-5 text-gray-300 shrink-0" />
        <div className="flex flex-col shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={sectionIndex === 0}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={sectionIndex === totalSections - 1}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm font-medium text-gray-400 shrink-0">
          {sectionIndex + 1}.
        </span>
        <Input
          value={section.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder="Titulo de la seccion"
          className="flex-1 font-medium"
        />
        <span className="text-xs text-gray-400 shrink-0">
          {section.questions.length} preg.
        </span>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          <div className="flex gap-4 items-start">
            <Input
              value={section.description}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Descripcion de la seccion (opcional)"
              className="flex-1"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap pt-2">
              <input
                type="checkbox"
                checked={section.is_required}
                onChange={(e) => onUpdate('is_required', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Seccion requerida
            </label>
          </div>

          {/* Questions */}
          <div className="space-y-2">
            {section.questions.map((question, qIndex) => (
              <QuestionEditor
                key={question.tempId}
                question={question}
                questionIndex={qIndex}
                totalQuestions={section.questions.length}
                sectionTempId={section.tempId}
                onUpdate={(field, value) =>
                  onUpdateQuestion(question.tempId, field, value)
                }
                onRemove={() => onRemoveQuestion(question.tempId)}
                onMoveUp={() => {
                  if (qIndex > 0) onReorderQuestions(qIndex, qIndex - 1);
                }}
                onMoveDown={() => {
                  if (qIndex < section.questions.length - 1)
                    onReorderQuestions(qIndex, qIndex + 1);
                }}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAddQuestion}
          >
            <Plus className="h-4 w-4" />
            Agregar Pregunta
          </Button>
        </div>
      )}
    </div>
  );
}
