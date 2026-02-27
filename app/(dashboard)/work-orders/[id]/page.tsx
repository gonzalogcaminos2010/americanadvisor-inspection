'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  WorkOrder,
  WorkOrderItem,
  Inspection,
  InspectionStatus,
  WorkOrderStatus,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { InspectionExecutor } from '@/components/inspection/inspection-executor';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  ClipboardList,
  User,
  Calendar,
  Truck,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showExecutor, setShowExecutor] = useState(false);
  const [activeInspectionId, setActiveInspectionId] = useState<number | null>(null);
  const [executorLabel, setExecutorLabel] = useState('');

  // Fetch work order with relations
  const { data: woResponse, isLoading: woLoading } = useQuery<ApiResponse<WorkOrder>>({
    queryKey: ['work-order', id],
    queryFn: () => api.get(`/work-orders/${id}`),
    enabled: !!id,
  });

  // Fetch items for this work order
  const { data: itemsResponse, isLoading: itemsLoading } = useQuery<ApiResponse<WorkOrderItem[]>>({
    queryKey: ['work-order-items', id],
    queryFn: () => api.get(`/work-orders/${id}/items`),
    enabled: !!id,
  });

  // Fetch inspections for this work order
  const { data: inspectionsResponse } = useQuery<PaginatedResponse<Inspection> | ApiResponse<Inspection[]>>({
    queryKey: ['work-order-inspections', id],
    queryFn: () => api.get(`/inspections?work_order_id=${id}&per_page=50`),
    enabled: !!id,
  });

  const workOrder = woResponse?.data;
  const rawItems = itemsResponse;
  const items: WorkOrderItem[] = Array.isArray(rawItems)
    ? rawItems
    : Array.isArray((rawItems as ApiResponse<WorkOrderItem[]>)?.data)
      ? (rawItems as ApiResponse<WorkOrderItem[]>).data
      : [];
  const rawInsp = inspectionsResponse;
  const inspections: Inspection[] = Array.isArray(rawInsp)
    ? rawInsp
    : Array.isArray((rawInsp as ApiResponse<Inspection[]>)?.data)
      ? (rawInsp as ApiResponse<Inspection[]>).data
      : [];

  // Start work order
  const startMutation = useMutation({
    mutationFn: () => api.post(`/work-orders/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-order-items', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Orden iniciada');
    },
    onError: () => toast.error('Error al iniciar la orden'),
  });

  // Complete work order
  const completeMutation = useMutation({
    mutationFn: () => api.post(`/work-orders/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
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
      api.post<ApiResponse<Inspection>>(`/work-orders/${id}/inspections`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-inspections', id] });
      queryClient.invalidateQueries({ queryKey: ['work-order-items', id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspeccion creada');
      const inspection = (res as ApiResponse<Inspection>)?.data ?? (res as unknown as Inspection);
      if (inspection?.id) {
        setActiveInspectionId(inspection.id);
        setShowExecutor(true);
      }
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message || 'Error al crear la inspeccion');
    },
  });

  const handleStartInspection = (item: WorkOrderItem) => {
    setExecutorLabel(item.equipment?.name ?? `Equipo #${item.equipment_id}`);
    createInspectionMutation.mutate({
      work_order_item_id: item.id,
      template_id: item.template_id ?? undefined,
    });
  };

  const handleContinueInspection = (inspection: Inspection, label: string) => {
    setActiveInspectionId(inspection.id);
    setExecutorLabel(label);
    setShowExecutor(true);
  };

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
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/work-orders')}>
          Volver
        </Button>
      </div>
    );
  }

  // Inspection executor fullscreen
  if (showExecutor && activeInspectionId) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => { setShowExecutor(false); setActiveInspectionId(null); }}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a la Orden
          </Button>
          <span className="text-sm text-gray-500">
            {workOrder.order_number ?? workOrder.code} - {executorLabel}
          </span>
        </div>
        <InspectionExecutor inspectionId={activeInspectionId} />
      </div>
    );
  }

  const isPending = workOrder.status === WorkOrderStatus.PENDING;
  const isInProgress = workOrder.status === WorkOrderStatus.IN_PROGRESS;
  const isCompleted = workOrder.status === WorkOrderStatus.COMPLETED;
  const isCancelled = workOrder.status === WorkOrderStatus.CANCELLED;

  // Check if all items are completed
  const allItemsCompleted = items.length > 0 && items.every((i) => i.status === 'COMPLETED' || i.status === 'SKIPPED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Orden {workOrder.order_number ?? workOrder.code}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {workOrder.inspection_request?.request_number ?? `Solicitud #${workOrder.inspection_request_id}`}
            {' - '}{workOrder.inspection_request?.client?.name ?? ''}
          </p>
        </div>
        <Badge status={workOrder.status} size="md" />
        <Badge status={workOrder.priority} size="md" />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={<Truck className="h-5 w-5 text-blue-500" />}
          label="Equipos"
          value={`${items.length} equipo${items.length !== 1 ? 's' : ''}`}
          subtitle={items.length > 0 ? items.map((i) => i.equipment?.name ?? '').filter(Boolean).join(', ') : undefined}
        />
        <InfoCard
          icon={<User className="h-5 w-5 text-green-500" />}
          label="Inspector"
          value={workOrder.inspector?.name ?? items[0]?.inspector?.name ?? 'Sin asignar'}
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

      {/* IN_PROGRESS: Show items with inspection status */}
      {isInProgress && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Equipos e Inspecciones
            </h2>
            {allItemsCompleted && (
              <Button onClick={() => completeMutation.mutate()} isLoading={completeMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completar Orden
              </Button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const isItemPending = item.status === 'PENDING';
              const isItemInProgress = item.status === 'IN_PROGRESS';
              const isItemCompleted = item.status === 'COMPLETED';
              const isItemSkipped = item.status === 'SKIPPED';

              // Find inspection associated with this specific item
              const itemInspections = inspections.filter(
                (i) => i.work_order_item_id === item.id
              );
              // Fallback: if no work_order_item_id match, try by equipment via template
              const relevantInspections = itemInspections.length > 0
                ? itemInspections
                : inspections.filter((i) => item.template_id && i.template_id === item.template_id);
              const activeInsp = relevantInspections.find(
                (i) => i.status === InspectionStatus.NOT_STARTED || i.status === InspectionStatus.IN_PROGRESS || i.status === InspectionStatus.STANDBY
              );
              const completedInsp = relevantInspections.find(
                (i) => i.status === InspectionStatus.COMPLETED || i.status === InspectionStatus.SUBMITTED
              );

              return (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isItemCompleted ? 'bg-green-100' :
                        isItemInProgress ? 'bg-blue-100' :
                        isItemSkipped ? 'bg-gray-100' :
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
                          {item.inspector && (
                            <span className="text-xs text-gray-500">- {item.inspector.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isItemPending && (
                        <Button
                          size="sm"
                          onClick={() => handleStartInspection(item)}
                          isLoading={createInspectionMutation.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Inspeccionar
                        </Button>
                      )}
                      {isItemInProgress && activeInsp && (
                        <Button
                          size="sm"
                          onClick={() => handleContinueInspection(activeInsp, item.equipment?.name ?? '')}
                        >
                          Continuar
                        </Button>
                      )}
                      {isItemCompleted && completedInsp && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/inspections/${completedInsp.id}`)}
                        >
                          Ver Resultado
                        </Button>
                      )}
                      {isItemSkipped && (
                        <span className="text-xs text-gray-500 italic">Omitido</span>
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
      )}

      {/* COMPLETED */}
      {isCompleted && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">Orden Completada</h2>
            <p className="text-sm text-gray-500">
              {workOrder.completed_at
                ? `Completada el ${new Date(workOrder.completed_at).toLocaleString('es-AR')}`
                : 'Esta orden ha sido completada.'}
            </p>
          </div>

          {/* Show items summary */}
          {items.length > 0 && (
            <div className="divide-y divide-gray-100 border rounded-lg">
              {items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{item.equipment?.name ?? `Equipo #${item.equipment_id}`}</span>
                    <Badge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show inspections */}
          {inspections.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Inspecciones</h3>
              {inspections.map((insp) => (
                <div
                  key={insp.id}
                  className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/inspections/${insp.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <Badge status={insp.status} />
                    {insp.overall_result && <Badge status={insp.overall_result} />}
                    <span className="text-sm">{insp.template?.name ?? `Inspeccion #${insp.id}`}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {insp.completed_at ? new Date(insp.completed_at).toLocaleDateString('es-AR') : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CANCELLED */}
      {isCancelled && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Orden Cancelada</h2>
          <p className="text-sm text-gray-500">Esta orden ha sido cancelada.</p>
        </div>
      )}

      {/* Back button */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/work-orders')}>
          Volver a Ordenes
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
