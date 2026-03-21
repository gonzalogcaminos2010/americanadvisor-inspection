'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { WorkOrder, Inspection, PaginatedResponse } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/inspector/stat-card';
import { AlertBanner } from '@/components/inspector/alert-banner';
import { OrderCard } from '@/components/inspector/order-card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Truck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function InspectorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: ordersResponse, isLoading: ordersLoading } = useQuery<
    PaginatedResponse<WorkOrder> | WorkOrder[]
  >({
    queryKey: ['inspector-dashboard-orders', user?.id],
    queryFn: () =>
      api.get('/work-orders', {
        params: { inspector_id: user?.id, per_page: 50 },
      }),
    enabled: !!user?.id,
  });

  const { data: inspectionsResponse, isLoading: inspectionsLoading } = useQuery<
    PaginatedResponse<Inspection> | Inspection[]
  >({
    queryKey: ['inspector-dashboard-inspections', user?.id],
    queryFn: () =>
      api.get('/inspections', {
        params: { inspector_id: user?.id, per_page: 100 },
      }),
    enabled: !!user?.id,
  });

  const orders: WorkOrder[] = useMemo(() => {
    if (!ordersResponse) return [];
    return Array.isArray(ordersResponse)
      ? ordersResponse
      : ordersResponse.data || [];
  }, [ordersResponse]);

  const inspections: Inspection[] = useMemo(() => {
    if (!inspectionsResponse) return [];
    return Array.isArray(inspectionsResponse)
      ? inspectionsResponse
      : inspectionsResponse.data || [];
  }, [inspectionsResponse]);

  const activeOrders = orders.filter(
    (o) => {
      const s = String(o.status).toLowerCase();
      return s === 'pending' || s === 'in_progress';
    }
  );
  const returnedInspections = inspections.filter(
    (i) => i.status?.toLowerCase() === 'returned'
  );
  const completedThisMonth = inspections.filter((i) => {
    const s = i.status?.toLowerCase();
    if (s !== 'submitted' && s !== 'approved' && s !== 'completed') return false;
    const d = new Date(i.completed_at || i.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const recentInspections = [...inspections]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const pendingEquipmentCount = activeOrders.reduce((sum, o) => {
    const items = o.items || [];
    return sum + items.filter((i) => String(i.status).toUpperCase() !== 'COMPLETED').length;
  }, 0);

  const isLoading = ordersLoading || inspectionsLoading;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Returned alert */}
      <AlertBanner inspections={returnedInspections} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Ordenes Activas"
          value={activeOrders.length}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          label="Equipos Pendientes"
          value={pendingEquipmentCount}
          icon={Truck}
          color="orange"
        />
        <StatCard
          label="Completadas este Mes"
          value={completedThisMonth.length}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Active orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Ordenes en Curso</h2>
          <button
            onClick={() => router.push('/inspector/mis-ordenes')}
            className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No tiene ordenes activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.slice(0, 4).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
          <button
            onClick={() => router.push('/inspector/mis-inspecciones')}
            className="text-sm text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {recentInspections.length === 0 ? (
          <p className="text-sm text-gray-500">Sin inspecciones recientes</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recentInspections.map((insp) => {
              const equip = (insp as unknown as Record<string, unknown>).equipment as Record<string, unknown> | undefined;
              return (
                <button
                  key={insp.id}
                  onClick={() => router.push(`/inspector/mis-inspecciones/${insp.id}`)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {equip?.name as string || insp.template?.name || `Inspeccion #${insp.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(insp.created_at).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <Badge status={insp.status} size="sm" />
                  {insp.overall_result && (
                    <Badge status={insp.overall_result} size="sm" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
