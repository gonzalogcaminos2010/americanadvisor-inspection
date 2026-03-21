'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { TabFilter } from '@/components/inspector/tab-filter';
import { ClipboardCheck, Truck, AlertTriangle, ArrowRight, Search } from 'lucide-react';
import type { Inspection, PaginatedResponse } from '@/types';

export default function InspectorInspectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

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

  const allInspections: Inspection[] = useMemo(() => {
    if (!data) return [];
    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data]);

  const counts = useMemo(() => {
    const c = { all: 0, in_progress: 0, submitted: 0, returned: 0, approved: 0 };
    c.all = allInspections.length;
    allInspections.forEach((i) => {
      const s = i.status?.toLowerCase();
      if (s === 'in_progress' || s === 'not_started' || s === 'standby') c.in_progress++;
      else if (s === 'submitted') c.submitted++;
      else if (s === 'returned') c.returned++;
      else if (s === 'approved' || s === 'completed') c.approved++;
    });
    return c;
  }, [allInspections]);

  const filtered = useMemo(() => {
    let list = allInspections;

    if (activeTab !== 'all') {
      list = list.filter((i) => {
        const s = i.status?.toLowerCase();
        if (activeTab === 'in_progress') return s === 'in_progress' || s === 'not_started' || s === 'standby';
        if (activeTab === 'submitted') return s === 'submitted';
        if (activeTab === 'returned') return s === 'returned';
        if (activeTab === 'approved') return s === 'approved' || s === 'completed';
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        const equip = (i as unknown as Record<string, unknown>).equipment as Record<string, unknown> | undefined;
        const equipName = (equip?.name as string || '').toLowerCase();
        const templateName = (i.template?.name || '').toLowerCase();
        return equipName.includes(q) || templateName.includes(q);
      });
    }

    return list;
  }, [allInspections, activeTab, search]);

  const tabs = [
    { label: 'Todas', value: 'all', count: counts.all },
    { label: 'En Progreso', value: 'in_progress', count: counts.in_progress },
    { label: 'Enviadas', value: 'submitted', count: counts.submitted },
    { label: 'Devueltas', value: 'returned', count: counts.returned, dot: counts.returned > 0 },
    { label: 'Aprobadas', value: 'approved', count: counts.approved },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-7 w-7 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Inspecciones</h1>
          <p className="text-sm text-gray-500">{counts.all} inspecciones en total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <TabFilter tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipo o plantilla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {search ? 'No se encontraron resultados' : 'No tiene inspecciones en este estado'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insp) => {
            const isReturned = insp.status?.toLowerCase() === 'returned';
            const equip = (insp as unknown as Record<string, unknown>).equipment as Record<string, unknown> | undefined;
            const equipName = equip?.name as string || null;

            return (
              <button
                key={insp.id}
                onClick={() => router.push(`/inspector/mis-inspecciones/${insp.id}`)}
                className={`w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
                  isReturned ? 'border-l-4 border-l-red-500 border-red-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="rounded-lg bg-gray-100 p-2 shrink-0">
                      <Truck className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {equipName || `Inspeccion #${insp.id}`}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {insp.template?.name || 'Sin plantilla'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(insp.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge status={insp.status} size="sm" />
                    {insp.overall_result && <Badge status={insp.overall_result} size="sm" />}
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>

                {isReturned && insp.supervisor_notes && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 p-2 ml-11">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 line-clamp-2">{insp.supervisor_notes}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
