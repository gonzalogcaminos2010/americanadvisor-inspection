'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export interface NotificationItem {
  id: number;
  equipmentName: string;
  statusLabel: string;
  statusColor: 'blue' | 'green' | 'amber';
  href: string;
  date: string | null;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

const COLOR_CLASSES: Record<NotificationItem['statusColor'], string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
};

interface Props {
  items: NotificationItem[];
  totalCount: number;
  viewAllHref: string;
  viewAllLabel?: string;
}

export function NotificationBell({
  items,
  totalCount,
  viewAllHref,
  viewAllLabel = 'Ver todas',
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative px-3 py-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Bell className="h-5 w-5 flex-shrink-0" />
        <span>Notificaciones</span>
        {totalCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-2 right-2 bottom-full mb-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Notificaciones
            </p>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Sin notificaciones nuevas
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.equipmentName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_CLASSES[item.statusColor]}`}
                      >
                        {item.statusLabel}
                      </span>
                      {item.date && (
                        <span className="text-xs text-gray-400">
                          {relativeTime(item.date)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100">
            <Link
              href={viewAllHref}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {viewAllLabel}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
