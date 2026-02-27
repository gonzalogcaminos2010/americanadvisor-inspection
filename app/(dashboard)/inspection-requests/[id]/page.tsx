'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  InspectionRequest,
  WorkOrder,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ClipboardList,
  Building2,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: 'Preventiva',
  CORRECTIVE: 'Correctiva',
  CERTIFICATION: 'Certificación',
  ROUTINE: 'Rutinaria',
  PRE_USE: 'Pre-uso',
};

const STATUS_ACTIONS: Record<string, { label: string; icon: typeof Play; variant: 'primary' | 'secondary' | 'ghost' }> = {
  IN_PROGRESS: { label: 'Pasar a En Progreso', icon: Play, variant: 'primary' },
  COMPLETED: { label: 'Completar', icon: CheckCircle, variant: 'primary' },
  CANCELLED: { label: 'Cancelar', icon: XCircle, variant: 'ghost' },
};

export default function InspectionRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requestResponse, isLoading } = useQuery<ApiResponse<InspectionRequest>>({
    queryKey: ['inspection-request', id],
    queryFn: () => api.get(`/inspection-requests/${id}`),
    enabled: !!id,
  });

  const { data: ordersResponse } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['request-work-orders', id],
    queryFn: () => api.get(`/inspection-requests/${id}/work-orders`),
    enabled: !!id,
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api.post(`/inspection-requests/${id}/change-status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-request', id] });
      queryClient.invalidateQueries({ queryKey: ['inspection-requests'] });
      toast.success('Estado actualizado');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Error al cambiar estado');
    },
  });

  const request = requestResponse?.data;
  const orders = ordersResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Solicitud no encontrada</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/inspection-requests')}>
          Volver
        </Button>
      </div>
    );
  }

  const canChangeStatus = (request as unknown as { can_change_status?: Record<string, boolean> }).can_change_status ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/inspection-requests')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Solicitud {request.number || request.request_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {request.client?.name} - {request.service_type?.name}
          </p>
        </div>
        <Badge status={request.status} size="md" />
        {request.priority && <Badge status={request.priority} size="md" />}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={<Building2 className="h-5 w-5 text-blue-500" />}
          label="Cliente"
          value={request.client?.name ?? '-'}
        />
        <InfoCard
          icon={<ClipboardList className="h-5 w-5 text-green-500" />}
          label="Tipo de Inspección"
          value={INSPECTION_TYPE_LABELS[request.inspection_type] || request.inspection_type || '-'}
        />
        <InfoCard
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          label="Fecha Solicitud"
          value={new Date(request.request_date).toLocaleDateString('es-AR')}
          subtitle={request.due_date ? `Límite: ${new Date(request.due_date).toLocaleDateString('es-AR')}` : undefined}
        />
        <InfoCard
          icon={<User className="h-5 w-5 text-purple-500" />}
          label="Solicitado por"
          value={request.requested_by || request.creator?.name || '-'}
        />
      </div>

      {/* Description & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Descripción
          </h2>
          {request.description ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin descripción</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            Notas
          </h2>
          {request.notes ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.notes}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin notas</p>
          )}
        </div>
      </div>

      {/* Status actions */}
      {Object.keys(canChangeStatus).some((k) => canChangeStatus[k]) && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Cambiar Estado
          </h2>
          <div className="flex gap-3">
            {Object.entries(canChangeStatus).map(([status, allowed]) => {
              if (!allowed) return null;
              const action = STATUS_ACTIONS[status];
              if (!action) return null;
              const Icon = action.icon;
              return (
                <Button
                  key={status}
                  variant={action.variant}
                  size="sm"
                  onClick={() => changeStatusMutation.mutate(status)}
                  isLoading={changeStatusMutation.isPending}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Work Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-green-500" />
            Órdenes de Trabajo ({orders.length})
          </h2>
          <Button size="sm" onClick={() => router.push('/work-orders')}>
            Crear Orden
          </Button>
        </div>
        {orders.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {orders.map((wo) => (
              <div
                key={wo.id}
                className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/work-orders/${wo.id}`)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{wo.order_number ?? wo.code}</p>
                  <p className="text-xs text-gray-500">
                    {wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString('es-AR') : 'Sin fecha'}
                    {wo.inspector?.name && ` | ${wo.inspector.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={wo.status} />
                  <Badge status={wo.priority} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-400">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay órdenes de trabajo para esta solicitud</p>
            <p className="text-xs mt-1">Creá una orden de trabajo desde la sección Órdenes</p>
          </div>
        )}
      </div>

      {/* Back */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/inspection-requests')}>
          Volver a Solicitudes
        </Button>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
