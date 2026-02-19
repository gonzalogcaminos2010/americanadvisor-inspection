'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingQuestionProps {
  value: number | undefined;
  onChange: (val: number) => void;
}

export function RatingQuestion({ value, onChange }: RatingQuestionProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="rounded p-1 transition-colors hover:bg-gray-100"
        >
          <Star
            className={cn(
              'h-7 w-7',
              value !== undefined && star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-transparent text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}
