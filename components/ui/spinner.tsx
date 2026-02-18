'use client';

import { cn } from '@/lib/utils';

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600',
        sizes[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
