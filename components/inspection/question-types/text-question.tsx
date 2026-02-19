'use client';

import { cn } from '@/lib/utils';

interface TextQuestionProps {
  value: string;
  onChange: (val: string) => void;
}

export function TextQuestion({ value, onChange }: TextQuestionProps) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className={cn(
        'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm',
        'placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
      )}
      placeholder="Escriba su respuesta..."
    />
  );
}
