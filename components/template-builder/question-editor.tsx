'use client';

import { Input } from '@/components/ui/input';
import { QuestionTypePicker } from './question-type-picker';
import { OptionListEditor } from './option-list-editor';
import { QuestionType } from '@/types';
import type { BuilderQuestion } from '@/hooks/use-template-builder';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface QuestionEditorProps {
  question: BuilderQuestion;
  questionIndex: number;
  totalQuestions: number;
  sectionTempId: string;
  onUpdate: (field: string, value: unknown) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function QuestionEditor({
  question,
  questionIndex,
  totalQuestions,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QuestionEditorProps) {
  return (
    <div className="border border-gray-200 rounded-md p-3 space-y-3 bg-gray-50">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500 w-6 text-center shrink-0">
          {questionIndex + 1}
        </span>
        <Input
          value={question.question_text}
          onChange={(e) => onUpdate('question_text', e.target.value)}
          placeholder="Texto de la pregunta"
          className="flex-1"
        />
        <QuestionTypePicker
          value={question.question_type}
          onChange={(type) => onUpdate('question_type', type)}
        />
        <label className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
          <input
            type="checkbox"
            checked={question.is_required}
            onChange={(e) => onUpdate('is_required', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Requerida
        </label>
        <div className="flex flex-col shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={questionIndex === 0}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={questionIndex === totalQuestions - 1}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Type-specific fields */}
      {question.question_type === QuestionType.MULTIPLE_CHOICE && (
        <div className="ml-9">
          <OptionListEditor
            options={question.options.length >= 2 ? question.options : ['', '']}
            failValues={question.fail_values}
            onOptionsChange={(opts) => onUpdate('options', opts)}
            onFailValuesChange={(fv) => onUpdate('fail_values', fv)}
          />
        </div>
      )}

      {question.question_type === QuestionType.YES_NO && (
        <div className="ml-9">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Valor de falla
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={question.fail_values.includes('Sí')}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...question.fail_values.filter((v) => v !== 'Sí'), 'Sí']
                    : question.fail_values.filter((v) => v !== 'Sí');
                  onUpdate('fail_values', next);
                }}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Si = Falla
            </label>
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={question.fail_values.includes('No')}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...question.fail_values.filter((v) => v !== 'No'), 'No']
                    : question.fail_values.filter((v) => v !== 'No');
                  onUpdate('fail_values', next);
                }}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              No = Falla
            </label>
          </div>
        </div>
      )}

      {/* Help text for all types */}
      <div className="ml-9">
        <Input
          value={question.help_text}
          onChange={(e) => onUpdate('help_text', e.target.value)}
          placeholder="Texto de ayuda (opcional)"
          className="text-sm"
        />
      </div>
    </div>
  );
}
