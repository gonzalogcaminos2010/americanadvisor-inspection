'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full border-2 text-sm font-medium',
                step.completed
                  ? 'bg-green-600 border-green-600 text-white'
                  : step.active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              )}
            >
              {step.completed ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <p
              className={cn(
                'text-xs mt-1 text-center whitespace-nowrap',
                step.completed
                  ? 'text-green-700 font-medium'
                  : step.active
                  ? 'text-blue-700 font-medium'
                  : 'text-gray-400'
              )}
            >
              {step.label}
            </p>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-2 mt-[-16px]',
                step.completed ? 'bg-green-600' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
