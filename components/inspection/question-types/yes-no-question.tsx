'use client';

import { cn } from '@/lib/utils';

interface YesNoQuestionProps {
  value: boolean | undefined;
  onChange: (val: boolean) => void;
  failValues?: string[];
}

export function YesNoQuestion({ value, onChange, failValues }: YesNoQuestionProps) {
  const isFail = (val: boolean) => {
    if (!failValues || failValues.length === 0) return false;
    // API uses "0" for No/false and "1" for Si/true
    // Also handle legacy formats: "true"/"false", "si"/"no", "Sí"/"No"
    const checks = val
      ? ['1', 'true', 'si', 'Sí']
      : ['0', 'false', 'no', 'No'];
    return checks.some((c) => failValues.includes(c));
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors',
          value === true
            ? isFail(true)
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        )}
      >
        Si
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors',
          value === false
            ? isFail(false)
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        )}
      >
        No
      </button>
    </div>
  );
}
