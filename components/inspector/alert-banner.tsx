'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Inspection } from '@/types';

interface AlertBannerProps {
  inspections: Inspection[];
}

export function AlertBanner({ inspections }: AlertBannerProps) {
  const router = useRouter();

  if (inspections.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">
            {inspections.length === 1
              ? 'Tiene 1 inspeccion devuelta por el supervisor'
              : `Tiene ${inspections.length} inspecciones devueltas por el supervisor`}
          </p>
          <div className="mt-2 space-y-2">
            {inspections.map((insp) => (
              <button
                key={insp.id}
                onClick={() => router.push(`/inspector/mis-inspecciones/${insp.id}`)}
                className="flex items-center gap-2 w-full text-left rounded-lg bg-white border border-red-200 px-3 py-2 text-sm hover:bg-red-25 transition-colors"
              >
                <span className="font-medium text-red-700">
                  {(insp as unknown as Record<string, unknown>).equipment
                    ? ((insp as unknown as Record<string, unknown>).equipment as Record<string, unknown>)?.name as string
                    : `Inspeccion #${insp.id}`}
                </span>
                {insp.supervisor_notes && (
                  <span className="text-xs text-gray-500 truncate flex-1">
                    — {insp.supervisor_notes}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-red-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
