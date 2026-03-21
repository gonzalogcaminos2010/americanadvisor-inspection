'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { ProgressStepper } from '@/components/inspector/progress-stepper';
import { EquipmentCard } from '@/components/inspector/equipment-card';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Truck,
  Calendar,
  Building2,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';
import type {
  WorkOrder,
  WorkOrderItem,
  Inspection,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import Link from 'next/link';

export default function InspectorOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: woResponse, isLoading: woLoading } = useQuery<ApiResponse<WorkOrder>>({
    queryKey: ['work-order', id],
    queryFn: () => api.get(`/work-orders/${id}`),
    enabled: !!id,
  });

  const { data: itemsResponse, isLoading: itemsLoading } = useQuery<ApiResponse<WorkOrderItem[]>>({
    queryKey: ['work-order-items', id],
    queryFn: () => api.get(`/work-orders/${id}/items`),
    enabled: !!id,
  });

  const { data: inspectionsResponse, isLoading: inspectionsLoading } = useQuery<PaginatedResponse<Inspection>>({
    queryKey: ['work-order-inspections', id],
    queryFn: () => api.get(`/inspections?work_order_id=${id}&per_page=100`),
    enabled: !!id,
  });

  const workOrder = woResponse?.data;
  const rawItems = itemsResponse;
  const items: WorkOrderItem[] = Array.isArray(rawItems)
    ? rawItems
    : Array.isArray((rawItems as ApiResponse<WorkOrderItem[]>)?.data)
      ? (rawItems as ApiResponse<WorkOrderItem[]>).data
      : [];

  const inspectionsList: Inspection[] = inspectionsResponse?.data ?? [];
  const inspectionsByItemId = new Map<number, Inspection>();
  inspectionsList.forEach((insp) => {
    const itemId = insp.work_order_item_id;
    if (itemId) {
      const existing = inspectionsByItemId.get(itemId);
      if (!existing || insp.id > existing.id) {
        inspectionsByItemId.set(itemId, insp);
      }
    }
  });

  const startMutation = useMutation({
    mutationFn: () => api.post(`/work-orders/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-order-items', id] });
      toast.success('Orden iniciada');
    },
    onError: () => toast.error('Error al iniciar la orden'),
  });

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

  if (woLoading || itemsLoading || inspectionsLoading) {
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

  const status = String(workOrder.status).toLowerCase();
  const isPending = status === 'pending';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

  const completedItemsCount = items.filter((i) => {
    const s = String(i.status).toLowerCase();
    return s === 'completed' || s === 'skipped';
  }).length;

  const allItemsCompleted = items.length > 0 && completedItemsCount === items.length;

  const clientName = workOrder.inspection_request?.client?.name ?? '';
  const orderNumber = workOrder.order_number ?? workOrder.code ?? `OT #${workOrder.id}`;

  const handleStartInspection = (item: WorkOrderItem) => {
    const raw = item as unknown as Record<string, unknown>;
    const templateId = item.template_id ?? (raw.inspection_template_id as number) ?? workOrder?.template_id;
    createInspectionMutation.mutate({
      work_order_item_id: item.id,
      ...(templateId ? { template_id: templateId } : {}),
    });
  };

  const stepperSteps = [
    { label: 'Asignada', completed: true, active: false },
    { label: 'En Progreso', completed: isInProgress || isCompleted, active: isInProgress && !allItemsCompleted },
    { label: 'Inspecciones Completas', completed: isCompleted || (isInProgress && allItemsCompleted), active: isInProgress && allItemsCompleted },
    { label: 'Finalizada', completed: isCompleted, active: false },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/inspector" className="hover:text-green-700 transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/inspector/mis-ordenes" className="hover:text-green-700 transition-colors">Mis Ordenes</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium">{orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{orderNumber}</h1>
          {clientName && (
            <div className="flex items-center gap-1.5 mt-1">
              <Building2 className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-600">{clientName}</p>
            </div>
          )}
        </div>
        <Badge status={workOrder.status} size="md" />
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ProgressStepper steps={stepperSteps} />
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Truck className="h-3.5 w-3.5" />
            Equipos
          </div>
          <p className="text-lg font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Completados
          </div>
          <p className="text-lg font-bold text-green-700">{completedItemsCount}/{items.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Calendar className="h-3.5 w-3.5" />
            Fecha
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {workOrder.scheduled_date
              ? new Date(workOrder.scheduled_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
              : '-'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Inspecciones
          </div>
          <p className="text-lg font-bold text-gray-900">{inspectionsList.length}</p>
        </div>
      </div>

      {/* Notes */}
      {workOrder.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700 uppercase mb-1">Notas</p>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{workOrder.notes}</p>
        </div>
      )}

      {/* PENDING: Start button */}
      {isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Play className="h-10 w-10 text-blue-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-blue-900 mb-1">Orden Pendiente</h2>
          <p className="text-sm text-blue-700 mb-4">
            Inicie la orden para comenzar las inspecciones de {items.length} equipo{items.length !== 1 ? 's' : ''}.
          </p>
          <Button onClick={() => startMutation.mutate()} isLoading={startMutation.isPending}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Orden
          </Button>
        </div>
      )}

      {/* Equipment cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Equipos</h2>
          {isInProgress && allItemsCompleted && (
            <Button onClick={() => completeMutation.mutate()} isLoading={completeMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Completar Orden
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Truck className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay equipos en esta orden.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const itemInsp = inspectionsByItemId.get(item.id) || null;
              const canCreate = isInProgress && !itemInsp;

              return (
                <EquipmentCard
                  key={item.id}
                  item={item}
                  inspection={canCreate ? null : itemInsp}
                  onStartInspection={handleStartInspection}
                  onContinueInspection={(inspId) => router.push(`/inspector/mis-inspecciones/${inspId}`)}
                  onViewInspection={(inspId) => router.push(`/inspector/mis-inspecciones/${inspId}`)}
                  loading={createInspectionMutation.isPending}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-sm text-gray-600">
            {completedItemsCount} de {items.length} equipo{items.length !== 1 ? 's' : ''} inspeccionado{completedItemsCount !== 1 ? 's' : ''}
            {inspectionsList.filter((i) => i.findings && i.findings.length > 0).length > 0 && (
              <span className="text-amber-600 ml-1">
                — {inspectionsList.reduce((sum, i) => sum + (i.findings?.length || 0), 0)} hallazgo(s)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-green-900">Orden Completada</h2>
          <p className="text-sm text-green-700">
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
