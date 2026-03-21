'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'orange' | 'green' | 'purple' | 'red';
}

const colorStyles = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', value: 'text-orange-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', value: 'text-green-700' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', value: 'text-purple-700' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-700' },
};

export function StatCard({ label, value, icon: Icon, color = 'blue' }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div className={cn('rounded-xl p-4 border', styles.bg)}>
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', styles.bg)}>
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
          <p className={cn('text-2xl font-bold', styles.value)}>{value}</p>
        </div>
      </div>
    </div>
  );
}
