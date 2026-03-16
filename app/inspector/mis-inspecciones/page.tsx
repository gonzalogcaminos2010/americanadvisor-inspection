'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import type { Inspection, PaginatedResponse } from '@/types';

export default function InspectorInspectionsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery<PaginatedResponse<Inspection>>({
    queryKey: ['inspector-inspections', user?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('inspector_id', String(user.id));
      params.append('per_page', '100');
      return api.get(`/inspections?${params.toString()}`);
    },
    enabled: !!user?.id,
  });

  const inspections: Inspection[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  // Sort by most recent first
  const sorted = [...inspections].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Inspecciones</h1>
          <p className="text-sm text-gray-500">Todas sus inspecciones asignadas</p>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tiene inspecciones asignadas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resultado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sorted.map((insp) => {
                  const isReturned = insp.status?.toLowerCase() === 'returned';
                  const raw = insp as unknown as Record<string, unknown>;
                  const equipment = (raw.equipment ?? (raw.work_order_item as Record<string, unknown>)?.equipment) as { name?: string } | undefined;

                  return (
                    <tr
                      key={insp.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isReturned ? 'bg-red-50' : ''}`}
                      onClick={() => router.push(`/inspector/mis-inspecciones/${insp.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {insp.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {equipment?.name ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {insp.template?.name ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge status={insp.status} />
                          {isReturned && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {insp.overall_result ? (
                          <Badge status={insp.overall_result} />
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {insp.created_at
                          ? new Date(insp.created_at).toLocaleDateString('es-AR')
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
