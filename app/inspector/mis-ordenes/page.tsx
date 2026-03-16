'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { FileCheck } from 'lucide-react';
import type { WorkOrder, PaginatedResponse } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export default function InspectorOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['inspector-work-orders', user?.id, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (user?.id) params.append('inspector_id', String(user.id));
      if (statusFilter) params.append('status', statusFilter);
      params.append('per_page', '50');
      return api.get(`/work-orders?${params.toString()}`);
    },
    enabled: !!user?.id,
  });

  const orders: WorkOrder[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck className="h-7 w-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Ordenes de Trabajo</h1>
            <p className="text-sm text-gray-500">Ordenes asignadas a usted</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Estado:</label>
        <select
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          {orders.length} orden{orders.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron ordenes de trabajo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Programada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const itemsCount = order.items?.length ?? 0;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/inspector/mis-ordenes/${order.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.order_number ?? order.code ?? `#${order.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.inspection_request?.client?.name ?? '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {itemsCount > 0 ? `${itemsCount} equipo${itemsCount !== 1 ? 's' : ''}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.scheduled_date
                          ? new Date(order.scheduled_date).toLocaleDateString('es-AR')
                          : 'Sin fecha'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge status={order.status} />
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
