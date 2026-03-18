'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionType, type TemplateQuestion, type AnswerSubmission, type FindingFormData, type InspectionPhoto } from '@/types';
import { TextQuestion } from './question-types/text-question';
import { NumberQuestion } from './question-types/number-question';
import { YesNoQuestion } from './question-types/yes-no-question';
import { MultipleChoiceQuestion } from './question-types/multiple-choice-question';
import { PhotoQuestion } from './question-types/photo-question';
import { SignatureQuestion } from './question-types/signature-question';
import { DateQuestion } from './question-types/date-question';
import { RatingQuestion } from './question-types/rating-question';
import { FindingCard } from './finding-card';

interface QuestionRendererProps {
  question: TemplateQuestion;
  answer: AnswerSubmission | undefined;
  onAnswer: (submission: Partial<AnswerSubmission>) => void;
  onCreateFinding?: (data: FindingFormData) => void;
  isFindingLoading?: boolean;
  photos?: InspectionPhoto[];
  onUploadPhoto?: (file: File) => void;
  isUploadingPhoto?: boolean;
}

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
  onCreateFinding,
  isFindingLoading = false,
  photos = [],
  onUploadPhoto,
  isUploadingPhoto = false,
}: QuestionRendererProps) {
  const isFlagged = answer?.is_flagged;

  const checkFail = (value: string | boolean) => {
    if (!question.fail_values || question.fail_values.length === 0) return false;
    if (typeof value === 'boolean') {
      // API uses "0" for false/No, "1" for true/Si
      const checks = value
        ? ['1', 'true', 'si', 'Sí']
        : ['0', 'false', 'no', 'No'];
      return checks.some((c) => question.fail_values!.includes(c));
    }
    return question.fail_values.includes(value);
  };

  const handleAnswer = (submission: Partial<AnswerSubmission>) => {
    let flagged = false;
    if (submission.answer_boolean !== undefined) {
      flagged = checkFail(submission.answer_boolean);
    } else if (submission.answer_value !== undefined) {
      flagged = checkFail(submission.answer_value);
    }
    onAnswer({ ...submission, is_flagged: flagged });
  };

  const renderInput = () => {
    switch (question.question_type) {
      case QuestionType.TEXT:
        return (
          <TextQuestion
            value={answer?.answer_value || ''}
            onChange={(val) => handleAnswer({ answer_value: val })}
          />
        );
      case QuestionType.NUMBER:
        return (
          <NumberQuestion
            value={answer?.answer_number}
            onChange={(val) => handleAnswer({ answer_number: val })}
            helpText={question.help_text || undefined}
          />
        );
      case QuestionType.YES_NO:
        return (
          <YesNoQuestion
            value={answer?.answer_boolean}
            onChange={(val) => handleAnswer({ answer_boolean: val })}
            failValues={question.fail_values || undefined}
          />
        );
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceQuestion
            value={answer?.answer_value || ''}
            options={question.options || []}
            failValues={question.fail_values || []}
            onChange={(val) => handleAnswer({ answer_value: val })}
          />
        );
      case QuestionType.PHOTO:
        return (
          <PhotoQuestion
            photos={photos}
            onUpload={onUploadPhoto || (() => {})}
            isUploading={isUploadingPhoto}
          />
        );
      case QuestionType.SIGNATURE:
        return (
          <SignatureQuestion
            value={answer?.answer_value || ''}
            onChange={(val) => handleAnswer({ answer_value: val })}
          />
        );
      case QuestionType.DATE:
        return (
          <DateQuestion
            value={answer?.answer_value || ''}
            onChange={(val) => handleAnswer({ answer_value: val })}
          />
        );
      case QuestionType.RATING:
        return (
          <RatingQuestion
            value={answer?.answer_number}
            onChange={(val) => handleAnswer({ answer_number: val })}
          />
        );
      default:
        return <p className="text-sm text-gray-500">Tipo de pregunta no soportado</p>;
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-4',
        isFlagged ? 'border-red-300 bg-red-50' : 'border-gray-200'
      )}
    >
      <div className="mb-3">
        <label className="text-sm font-medium text-gray-900">
          {question.question_text}
          {question.is_required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {question.help_text && question.question_type !== QuestionType.NUMBER && (
          <p className="mt-0.5 text-xs text-gray-500">{question.help_text}</p>
        )}
      </div>

      {renderInput()}

      {isFlagged && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span>Hallazgo detectado</span>
        </div>
      )}

      {isFlagged && onCreateFinding && (
        <div className="mt-3">
          <FindingCard
            onSubmit={onCreateFinding}
            isLoading={isFindingLoading}
            questionText={question.question_text}
          />
        </div>
      )}
    </div>
  );
}
