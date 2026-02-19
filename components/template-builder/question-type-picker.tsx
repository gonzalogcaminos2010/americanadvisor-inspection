'use client';

import { Select } from '@/components/ui/select';
import { QuestionType, QUESTION_TYPE_LABELS } from '@/types';

interface QuestionTypePickerProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
}

const options = Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function QuestionTypePicker({ value, onChange }: QuestionTypePickerProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as QuestionType)}
      options={options}
      className="w-44"
    />
  );
}
