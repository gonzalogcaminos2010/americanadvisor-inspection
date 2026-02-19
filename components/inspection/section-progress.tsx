'use client';

import { CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionProgress as SectionProgressType } from '@/hooks/use-inspection';

interface SectionProgressProps {
  sections: SectionProgressType[];
  currentIndex: number;
  onGoToSection: (idx: number) => void;
}

export function SectionProgress({ sections, currentIndex, onGoToSection }: SectionProgressProps) {
  return (
    <nav className="space-y-1">
      {sections.map((section, idx) => {
        const isCurrent = idx === currentIndex;
        const isComplete = section.requiredAnswered >= section.required && section.required > 0;

        return (
          <button
            key={section.sectionId}
            type="button"
            onClick={() => onGoToSection(idx)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
              isCurrent
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <div className="flex-shrink-0">
              {section.hasFails ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : isComplete ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-medium',
                    isCurrent ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-400'
                  )}
                >
                  {idx + 1}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-medium', isCurrent && 'text-blue-700')}>
                {section.title}
              </p>
              <p className="text-xs text-gray-500">
                {section.answered}/{section.total} respondidas
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
