'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Truck,
  User,
  Calendar,
  FileText,
  ClipboardList,
  Eye,
} from 'lucide-react';
import type {
  WorkOrder,
  WorkOrderItem,
  Inspection,
  ApiResponse,
} from '@/types';

export default function InspectorOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch work order
  const { data: woResponse, isLoading: woLoading } = useQuery<ApiResponse<WorkOrder>>({
    queryKey: ['work-order', id],
    queryFn: () => api.get(`/work-orders/${id}`),
    enabled: !!id,
  });

  // Fetch items
  const { data: itemsResponse, isLoading: itemsLoading } = useQuery<ApiResponse<WorkOrderItem[]>>({
    queryKey: ['work-order-items', id],
    queryFn: () => api.get(`/work-orders/${id}/items`),
    enabled: !!id,
  });

  // Inspections now come embedded in items via API

  const workOrder = woResponse?.data;
  const rawItems = itemsResponse;
  const items: WorkOrderItem[] = Array.isArray(rawItems)
    ? rawItems
    : Array.isArray((rawItems as ApiResponse<WorkOrderItem[]>)?.data)
      ? (rawItems as ApiResponse<WorkOrderItem[]>).data
      : [];
  // Inspections now come embedded in items via API

  // Start work order
  const startMutation = useMutation({
    mutationFn: () => api.post(`/work-orders/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-order-items', id] });
      toast.success('Orden iniciada');
    },
    onError: () => toast.error('Error al iniciar la orden'),
  });

  // Complete work order
  const completeMutation = useMutation({
    mutationFn: () => api.post(`/work-orders/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['inspector-work-orders'] });
      toast.success('Orden completada');
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Error al completar la orden');
    },
  });

  // Create inspection for an item
  const createInspectionMutation = useMutation({
    mutationFn: (data: { work_order_item_id: number; template_id?: number }) =>
      api.post<ApiResponse<Inspection>>(`/inspections`, { work_order_item_id: data.work_order_item_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-inspections', id] });
      queryClient.invalidateQueries({ queryKey: ['work-order-items', id] });
      toast.success('Inspeccion creada');
      const inspection = (res as ApiResponse<Inspection>)?.data ?? (res as unknown as Inspection);
      if (inspection?.id) {
        router.push(`/inspector/mis-inspecciones/${inspection.id}`);
      }
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Error al crear la inspeccion');
    },
  });

  if (woLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Orden de trabajo no encontrada</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/inspector/mis-ordenes')}>
          Volver
        </Button>
      </div>
    );
  }

  const status = workOrder.status?.toLowerCase() || '';
  const isPending = status === 'pending';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

  const allItemsCompleted = items.length > 0 && items.every((i) => {
    const s = i.status?.toLowerCase() || '';
    return s === 'completed' || s === 'skipped';
  });

  const handleStartInspection = (item: WorkOrderItem) => {
    const raw = item as unknown as Record<string, unknown>;
    const templateId = item.template_id ?? (raw.inspection_template_id as number) ?? workOrder?.template_id;
    createInspectionMutation.mutate({
      work_order_item_id: item.id,
      ...(templateId ? { template_id: templateId } : {}),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/inspector/mis-ordenes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Orden {workOrder.order_number ?? workOrder.code}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {workOrder.inspection_request?.client?.name ?? ''}
          </p>
        </div>
        <Badge status={workOrder.status} size="md" />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={<Truck className="h-5 w-5 text-blue-500" />}
          label="Equipos"
          value={`${items.length} equipo${items.length !== 1 ? 's' : ''}`}
        />
        <InfoCard
          icon={<User className="h-5 w-5 text-green-500" />}
          label="Inspector"
          value={workOrder.inspector?.name ?? 'Sin asignar'}
        />
        <InfoCard
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          label="Fecha Programada"
          value={workOrder.scheduled_date ? new Date(workOrder.scheduled_date).toLocaleDateString('es-AR') : 'Sin fecha'}
        />
        <InfoCard
          icon={<FileText className="h-5 w-5 text-purple-500" />}
          label="Cliente"
          value={workOrder.inspection_request?.client?.name ?? '-'}
        />
      </div>

      {/* Notes */}
      {workOrder.notes && (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notas</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{workOrder.notes}</p>
        </div>
      )}

      {/* PENDING: Start button */}
      {isPending && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Play className="h-12 w-12 text-blue-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Orden Pendiente</h2>
          <p className="text-sm text-gray-500 mb-4">
            Inicie la orden para comenzar las inspecciones de {items.length} equipo{items.length !== 1 ? 's' : ''}.
          </p>
          <Button onClick={() => startMutation.mutate()} isLoading={startMutation.isPending}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Orden
          </Button>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            Equipos e Inspecciones
          </h2>
          {isInProgress && allItemsCompleted && (
            <Button onClick={() => completeMutation.mutate()} isLoading={completeMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Completar Orden
            </Button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const itemStatus = item.status?.toLowerCase() || '';
            const isItemPending = itemStatus === 'pending';
            const isItemInProgress = itemStatus === 'in_progress';
            const isItemCompleted = itemStatus === 'completed';

            // Get inspection directly from item (API now includes it)
            const rawItem = item as unknown as Record<string, unknown>;
            const itemInsp = (rawItem.inspection as Inspection) || null;
            const inspStatus = itemInsp?.status?.toLowerCase() || '';
            const activeInsp = (inspStatus === 'not_started' || inspStatus === 'in_progress' || inspStatus === 'standby' || inspStatus === 'returned') ? itemInsp : null;
            const completedInsp = (inspStatus === 'completed' || inspStatus === 'submitted') ? itemInsp : null;

            return (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isItemCompleted ? 'bg-green-100' :
                      isItemInProgress ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                      {isItemCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Truck className={`h-5 w-5 ${isItemInProgress ? 'text-blue-600' : 'text-yellow-600'}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.equipment?.name ?? `Equipo #${item.equipment_id}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge status={item.status} />
                        {item.template && (
                          <span className="text-xs text-gray-500">{item.template.name}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isInProgress && (isItemPending || (isItemInProgress && !activeInsp && !completedInsp)) && (
                      <Button
                        size="sm"
                        onClick={() => handleStartInspection(item)}
                        isLoading={createInspectionMutation.isPending}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {isItemPending ? 'Iniciar Inspeccion' : 'Crear Inspeccion'}
                      </Button>
                    )}
                    {isItemInProgress && activeInsp && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/inspector/mis-inspecciones/${activeInsp.id}`)}
                      >
                        Continuar
                      </Button>
                    )}
                    {isItemCompleted && completedInsp && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/inspector/mis-inspecciones/${completedInsp.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <p className="text-sm">No hay equipos en esta orden.</p>
            </div>
          )}
        </div>
      </div>

      {/* Completed state */}
      {isCompleted && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Orden Completada</h2>
          <p className="text-sm text-gray-500">
            {workOrder.completed_at
              ? `Completada el ${new Date(workOrder.completed_at).toLocaleString('es-AR')}`
              : 'Esta orden ha sido completada.'}
          </p>
        </div>
      )}

      {/* Back button */}
      <div>
        <Button variant="secondary" onClick={() => router.push('/inspector/mis-ordenes')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Mis Ordenes
        </Button>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
