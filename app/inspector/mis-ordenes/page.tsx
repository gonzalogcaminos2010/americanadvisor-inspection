'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { TabFilter } from '@/components/inspector/tab-filter';
import { OrderCard } from '@/components/inspector/order-card';
import { FileCheck } from 'lucide-react';
import type { WorkOrder, PaginatedResponse } from '@/types';

export default function InspectorOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const { data, isLoading } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['inspector-work-orders', user?.id],
    queryFn: () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('inspector_id', String(user.id));
      params.append('per_page', '50');
      return api.get(`/work-orders?${params.toString()}`);
    },
    enabled: !!user?.id,
  });

  const allOrders: WorkOrder[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return allOrders;
    return allOrders.filter((o) => String(o.status).toLowerCase() === activeTab);
  }, [allOrders, activeTab]);

  const counts = useMemo(() => ({
    all: allOrders.length,
    pending: allOrders.filter((o) => String(o.status).toLowerCase() === 'pending').length,
    in_progress: allOrders.filter((o) => String(o.status).toLowerCase() === 'in_progress').length,
    completed: allOrders.filter((o) => String(o.status).toLowerCase() === 'completed').length,
  }), [allOrders]);

  const tabs = [
    { label: 'Todas', value: 'all', count: counts.all },
    { label: 'Pendientes', value: 'pending', count: counts.pending },
    { label: 'En Progreso', value: 'in_progress', count: counts.in_progress },
    { label: 'Completadas', value: 'completed', count: counts.completed },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <FileCheck className="h-7 w-7 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Ordenes de Trabajo</h1>
          <p className="text-sm text-gray-500">
            {counts.in_progress} activa{counts.in_progress !== 1 ? 's' : ''}, {counts.completed} completada{counts.completed !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <TabFilter tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {activeTab === 'all'
              ? 'No tiene ordenes asignadas'
              : 'No hay ordenes en este estado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
