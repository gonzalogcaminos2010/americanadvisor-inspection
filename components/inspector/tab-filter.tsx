'use client';

import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  value: string;
  count?: number;
  dot?: boolean;
}

interface TabFilterProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
}

export function TabFilter({ tabs, activeTab, onChange }: TabFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            activeTab === tab.value
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs',
                activeTab === tab.value
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              {tab.count}
            </span>
          )}
          {tab.dot && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
          )}
        </button>
      ))}
    </div>
  );
}
