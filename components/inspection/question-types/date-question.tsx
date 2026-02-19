'use client';

import { Input } from '@/components/ui/input';

interface DateQuestionProps {
  value: string;
  onChange: (val: string) => void;
}

export function DateQuestion({ value, onChange }: DateQuestionProps) {
  return (
    <Input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
