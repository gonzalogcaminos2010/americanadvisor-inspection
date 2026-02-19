'use client';

import { Input } from '@/components/ui/input';

interface NumberQuestionProps {
  value: number | undefined;
  onChange: (val: number) => void;
  helpText?: string;
}

export function NumberQuestion({ value, onChange, helpText }: NumberQuestionProps) {
  return (
    <div>
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') return;
          onChange(parseFloat(v));
        }}
        placeholder="Ingrese un valor numérico"
      />
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
