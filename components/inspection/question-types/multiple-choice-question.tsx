'use client';

import { cn } from '@/lib/utils';

interface MultipleChoiceQuestionProps {
  value: string;
  options: string[];
  failValues: string[];
  onChange: (val: string) => void;
}

export function MultipleChoiceQuestion({ value, options, failValues, onChange }: MultipleChoiceQuestionProps) {
  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const isSelected = value === option;
        const isFail = isSelected && failValues.includes(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors',
              isSelected
                ? isFail
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
