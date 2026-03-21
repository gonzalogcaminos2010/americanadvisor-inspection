'use client';

import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { WorkOrder } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, Truck, AlertTriangle } from 'lucide-react';

interface OrderCardProps {
  order: WorkOrder;
}

const statusBorder: Record<string, string> = {
  pending: 'border-l-gray-400',
  in_progress: 'border-l-blue-500',
  completed: 'border-l-green-500',
  cancelled: 'border-l-red-500',
};

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const items = order.items || [];
  const completedItems = items.filter(
    (i) => {
      const s = String(i.status).toUpperCase();
      return s === 'COMPLETED' || s === 'SKIPPED';
    }
  ).length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const clientName =
    order.inspection_request?.client?.name ?? '-';
  const scheduledDate = order.scheduled_date
    ? new Date(order.scheduled_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

  const hasReturned = false; // TODO: check if any linked inspection is returned

  return (
    <button
      onClick={() => router.push(`/inspector/mis-ordenes/${order.id}`)}
      className={cn(
        'w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 p-4 hover:shadow-md transition-shadow',
        statusBorder[order.status?.toLowerCase()] || 'border-l-gray-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {order.order_number || order.code || `OT #${order.id}`}
          </p>
        </div>
        <Badge status={order.status} size="sm" />
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <Building2 className="h-3.5 w-3.5 text-gray-400" />
        <p className="text-sm text-gray-700 font-medium truncate">{clientName}</p>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {scheduledDate}
        </span>
        <span className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          {totalItems} equipo{totalItems !== 1 ? 's' : ''}
        </span>
      </div>

      {totalItems > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progreso</span>
            <span>{completedItems}/{totalItems}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {hasReturned && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Inspeccion devuelta</span>
        </div>
      )}
    </button>
  );
}
