'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  WorkOrder,
  Inspection,
  InspectionTemplate,
  InspectionStatus,
  WorkOrderStatus,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
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

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showExecutor, setShowExecutor] = useState(false);
  const [createdInspectionId, setCreatedInspectionId] = useState<number | null>(null);

  // Fetch work order with relations
  const { data: woResponse, isLoading: woLoading } = useQuery<ApiResponse<WorkOrder>>({
    queryKey: ['work-order', id],
    queryFn: () => api.get(`/work-orders/${id}`),
    enabled: !!id,
  });

  // Fetch inspections for this work order (use /inspections?work_order_id= since GET /work-orders/{id}/inspections doesn't exist)
  const { data: inspectionsResponse, isLoading: inspLoading } = useQuery<PaginatedResponse<Inspection> | ApiResponse<Inspection[]>>({
    queryKey: ['work-order-inspections', id],
    queryFn: () => api.get(`/inspections?work_order_id=${id}&per_page=50`),
    enabled: !!id,
  });

  // Fetch available templates
  const { data: templatesResponse } = useQuery<PaginatedResponse<InspectionTemplate>>({
    queryKey: ['inspection-templates-active'],
    queryFn: () => api.get('/inspection-templates?active=true&per_page=100'),
  });

  const workOrder = woResponse?.data;
  const rawInspections = inspectionsResponse;
  const inspections: Inspection[] = Array.isArray(rawInspections)
    ? rawInspections
    : Array.isArray((rawInspections as ApiResponse<Inspection[]>)?.data)
      ? (rawInspections as ApiResponse<Inspection[]>).data
      : [];
  const templates = templatesResponse?.data ?? [];

  // Active inspection (NOT_STARTED or IN_PROGRESS)
  const activeInspection = inspections.find(
    (i) => i.status === InspectionStatus.NOT_STARTED || i.status === InspectionStatus.IN_PROGRESS
  );
  // Most recent completed/submitted inspection
  const completedInspection = inspections.find(
    (i) => i.status === InspectionStatus.COMPLETED || i.status === InspectionStatus.SUBMITTED
  );

  // Start work order mutation
  const startMutation = useMutation({
    mutationFn: () => api.post(`/work-orders/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Orden iniciada');
    },
    onError: () => toast.error('Error al iniciar la orden'),
  });

  // Complete work order mutation
  const completeMutation = useMutation({
    mutationFn: () => api.post(`/work-orders/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      toast.success('Orden completada');
    },
    onError: () => toast.error('Error al completar la orden. Asegurese de que la inspeccion haya sido enviada.'),
  });

  // Create inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: (templateId: number) =>
      api.post<ApiResponse<Inspection>>(`/work-orders/${id}/inspections`, { template_id: templateId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-inspections', id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setTemplateModalOpen(false);
      toast.success('Inspeccion creada exitosamente');
      // Extract inspection from response (handle both { data: {...} } and direct object)
      const inspection = (res as ApiResponse<Inspection>)?.data ?? (res as unknown as Inspection);
      if (inspection?.id) {
        setCreatedInspectionId(inspection.id);
        setShowExecutor(true);
      }
    },
    onError: () => toast.error('Error al crear la inspeccion'),
  });

  const handleStartOrder = () => {
    startMutation.mutate();
  };

  const handleCompleteOrder = () => {
    completeMutation.mutate();
  };

  const handleCreateInspection = () => {
    if (!selectedTemplateId) return;
    createInspectionMutation.mutate(Number(selectedTemplateId));
  };

  const handleOpenCreateInspection = () => {
    // Pre-select template if work order has one
    if (workOrder?.template_id) {
      setSelectedTemplateId(String(workOrder.template_id));
    }
    setTemplateModalOpen(true);
  };

  if (woLoading || inspLoading) {
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

  // Determine which inspection to execute (active from API or just-created)
  const executorInspectionId = activeInspection?.id ?? createdInspectionId;

  // If showing the inspection executor fullscreen
  if (showExecutor && executorInspectionId) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => { setShowExecutor(false); setCreatedInspectionId(null); }}>
            <ArrowLeft className="h-4 w-4" />
            Volver a la Orden
          </Button>
          <span className="text-sm text-gray-500">
            {workOrder.order_number} - {workOrder.equipment?.name ?? 'Equipo'}
          </span>
        </div>
        <InspectionExecutor inspectionId={executorInspectionId} />
      </div>
    );
  }

  const isPending = workOrder.status === WorkOrderStatus.PENDING;
  const isInProgress = workOrder.status === WorkOrderStatus.IN_PROGRESS;
  const isCompleted = workOrder.status === WorkOrderStatus.COMPLETED;
  const isCancelled = workOrder.status === WorkOrderStatus.CANCELLED;

  const templateOptions = templates.map((t) => ({
    value: String(t.id),
    label: `${t.name} (${t.category})`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Orden {workOrder.order_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {workOrder.inspection_request?.request_number ?? `Solicitud #${workOrder.inspection_request_id}`}
            {workOrder.equipment?.name && ` - ${workOrder.equipment.name}`}
          </p>
        </div>
        <Badge status={workOrder.status} size="md" />
        <Badge status={workOrder.priority} size="md" />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={<Truck className="h-5 w-5 text-blue-500" />}
          label="Equipo"
          value={workOrder.equipment?.name ?? '-'}
          subtitle={workOrder.equipment?.serial_number ?? workOrder.equipment?.model ?? ''}
        />
        <InfoCard
          icon={<User className="h-5 w-5 text-green-500" />}
          label="Inspector"
          value={workOrder.inspector?.name ?? 'Sin asignar'}
        />
        <InfoCard
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          label="Fecha Programada"
          value={
            workOrder.scheduled_date
              ? new Date(workOrder.scheduled_date).toLocaleDateString('es-AR')
              : 'Sin fecha'
          }
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

      {/* === ACTION ZONE === */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* PENDING: Show Start button */}
        {isPending && (
          <div className="text-center">
            <Play className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Orden Pendiente</h2>
            <p className="text-sm text-gray-500 mb-4">
              Inicie la orden para comenzar a trabajar en la inspeccion.
            </p>
            <Button onClick={handleStartOrder} isLoading={startMutation.isPending}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Orden
            </Button>
          </div>
        )}

        {/* IN_PROGRESS: Show inspection flow */}
        {isInProgress && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" />
              Inspeccion
            </h2>

            {/* No inspection yet */}
            {!activeInspection && !completedInspection && (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  No hay inspecciones para esta orden. Cree una nueva inspeccion seleccionando una plantilla.
                </p>
                <Button onClick={handleOpenCreateInspection}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Crear Inspeccion
                </Button>
              </div>
            )}

            {/* Active inspection (in progress or not started) */}
            {activeInspection && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={activeInspection.status} />
                      <span className="text-sm font-medium text-gray-900">
                        {activeInspection.template?.name ?? `Inspeccion #${activeInspection.id}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Creada: {new Date(activeInspection.created_at).toLocaleString('es-AR')}
                      {activeInspection.started_at &&
                        ` | Iniciada: ${new Date(activeInspection.started_at).toLocaleString('es-AR')}`}
                    </p>
                  </div>
                  <Button onClick={() => setShowExecutor(true)}>
                    {activeInspection.status === InspectionStatus.NOT_STARTED
                      ? 'Iniciar Inspeccion'
                      : 'Continuar Inspeccion'}
                  </Button>
                </div>
              </div>
            )}

            {/* Completed inspection - can complete the order */}
            {completedInspection && !activeInspection && (
              <div className="space-y-4">
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge status={completedInspection.status} />
                        {completedInspection.overall_result && (
                          <Badge status={completedInspection.overall_result} />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {completedInspection.template?.name ?? `Inspeccion #${completedInspection.id}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Completada: {completedInspection.completed_at
                          ? new Date(completedInspection.completed_at).toLocaleString('es-AR')
                          : '-'}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/inspections/${completedInspection.id}`)}
                    >
                      Ver Detalle
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Button onClick={handleCompleteOrder} isLoading={completeMutation.isPending}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completar Orden
                  </Button>
                  <span className="text-sm text-gray-500">
                    La inspeccion fue completada. Puede cerrar la orden.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPLETED */}
        {isCompleted && (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Orden Completada</h2>
            <p className="text-sm text-gray-500 mb-4">
              {workOrder.completed_at
                ? `Completada el ${new Date(workOrder.completed_at).toLocaleString('es-AR')}`
                : 'Esta orden ha sido completada.'}
            </p>
            {inspections.length > 0 && (
              <div className="space-y-2">
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
                      {insp.completed_at
                        ? new Date(insp.completed_at).toLocaleDateString('es-AR')
                        : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CANCELLED */}
        {isCancelled && (
          <div className="text-center py-4">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Orden Cancelada</h2>
            <p className="text-sm text-gray-500">Esta orden ha sido cancelada.</p>
          </div>
        )}
      </div>

      {/* Inspection history */}
      {inspections.length > 0 && isInProgress && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Historial de Inspecciones</h3>
          <div className="space-y-2">
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
                  {insp.created_at
                    ? new Date(insp.created_at).toLocaleDateString('es-AR')
                    : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/work-orders')}>
          Volver a Ordenes
        </Button>
      </div>

      {/* Template selection modal */}
      <Modal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title="Seleccionar Plantilla de Inspeccion"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Seleccione la plantilla que se usara para esta inspeccion.
          </p>
          <Select
            label="Plantilla"
            placeholder="Seleccionar plantilla..."
            options={templateOptions}
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          />
          {templates.length === 0 && (
            <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              No hay plantillas disponibles. Cree una plantilla en la seccion de Plantillas.
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTemplateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInspection}
              disabled={!selectedTemplateId}
              isLoading={createInspectionMutation.isPending}
            >
              Crear Inspeccion
            </Button>
          </div>
        </div>
      </Modal>
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
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}
