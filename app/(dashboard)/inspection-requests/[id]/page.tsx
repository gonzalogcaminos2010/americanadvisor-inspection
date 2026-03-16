'use client';

import { useCallback } from 'react';
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
  Printer,
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

  const handlePrint = useCallback(() => {
    if (!request) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Verificá que el navegador permita pop-ups.');
      return;
    }

    const typeLabel = INSPECTION_TYPE_LABELS[request.inspection_type] || request.inspection_type || '-';
    const dateStr = new Date(request.request_date).toLocaleDateString('es-AR');
    const dueStr = request.due_date ? new Date(request.due_date).toLocaleDateString('es-AR') : 'No definida';

    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Remito ${request.number || ''}</title>
<style>
  @page { margin: 20mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
  .logo { font-size: 20pt; font-weight: bold; color: #1e40af; }
  .logo-sub { font-size: 8pt; color: #666; margin-top: 2px; }
  .doc-info { text-align: right; }
  .doc-number { font-size: 14pt; font-weight: bold; color: #1e40af; }
  .doc-date { font-size: 9pt; color: #666; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 9pt; font-weight: 600; }
  .badge-status { background: #dbeafe; color: #1e40af; }
  .badge-priority { background: #fef3c7; color: #92400e; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .field-label { font-size: 8pt; text-transform: uppercase; color: #6b7280; letter-spacing: 0.3px; }
  .field-value { font-size: 10pt; font-weight: 500; }
  .desc-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; font-size: 10pt; min-height: 40px; }
  .orders-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .orders-table th { background: #f3f4f6; text-align: left; padding: 6px 10px; font-weight: 600; border-bottom: 2px solid #d1d5db; }
  .orders-table td { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; }
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; font-size: 8pt; color: #9ca3af; }
  .signature-area { margin-top: 50px; display: flex; justify-content: space-between; }
  .signature-line { width: 200px; text-align: center; }
  .signature-line hr { border: none; border-top: 1px solid #333; margin-bottom: 4px; }
  .signature-line span { font-size: 8pt; color: #666; }
</style></head><body>
  <div class="header">
    <div>
      <div class="logo">American Advisor</div>
      <div class="logo-sub">Inspecciones y Certificaciones - San Juan, Argentina</div>
      <div class="logo-sub">Pasteur Oeste 256, Rawson | americanad.com.ar</div>
    </div>
    <div class="doc-info">
      <div class="doc-number">${request.number || request.request_number || ''}</div>
      <div class="doc-date">Emitido: ${new Date().toLocaleDateString('es-AR')}</div>
      <div style="margin-top:6px">
        <span class="badge badge-status">${request.status}</span>
        ${request.priority ? `<span class="badge badge-priority">${request.priority}</span>` : ''}
      </div>
    </div>
  </div>

  <h2 style="font-size:13pt; margin-bottom:16px; color:#111;">Remito de Solicitud de Inspección</h2>

  <div class="section">
    <div class="section-title">Datos de la Solicitud</div>
    <div class="grid">
      <div><div class="field-label">Cliente</div><div class="field-value">${request.client?.name || '-'}</div></div>
      <div><div class="field-label">Tipo de Inspección</div><div class="field-value">${typeLabel}</div></div>
      <div><div class="field-label">Tipo de Servicio</div><div class="field-value">${request.service_type?.name || '-'}</div></div>
      <div><div class="field-label">Prioridad</div><div class="field-value">${request.priority || '-'}</div></div>
      <div><div class="field-label">Fecha de Solicitud</div><div class="field-value">${dateStr}</div></div>
      <div><div class="field-label">Fecha Límite</div><div class="field-value">${dueStr}</div></div>
      <div><div class="field-label">Solicitado por</div><div class="field-value">${request.requested_by || request.creator?.name || '-'}</div></div>
      <div><div class="field-label">Moneda / Monto</div><div class="field-value">${request.currency || 'ARS'} ${request.total_amount || '0.00'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Descripción</div>
    <div class="desc-box">${request.description || 'Sin descripción'}</div>
  </div>

  ${request.notes ? `<div class="section"><div class="section-title">Notas</div><div class="desc-box">${request.notes}</div></div>` : ''}

  ${orders.length > 0 ? `
  <div class="section">
    <div class="section-title">Órdenes de Trabajo Asociadas</div>
    <table class="orders-table">
      <thead><tr><th>N° Orden</th><th>Estado</th><th>Fecha Programada</th><th>Inspector</th></tr></thead>
      <tbody>${orders.map(wo => `<tr>
        <td>${wo.order_number || wo.code || '-'}</td>
        <td>${wo.status}</td>
        <td>${wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString('es-AR') : '-'}</td>
        <td>${wo.inspector?.name || '-'}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>` : ''}

  <div class="signature-area">
    <div class="signature-line"><hr/><span>Firma del Solicitante</span></div>
    <div class="signature-line"><hr/><span>Firma American Advisor</span></div>
  </div>

  <div class="footer">
    <span>American Advisor - Inspecciones y Certificaciones</span>
    <span>Documento generado el ${new Date().toLocaleString('es-AR')}</span>
  </div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }, [request, orders, toast]);

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
        <Button variant="secondary" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1" />
          Imprimir PDF
        </Button>
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
          value={(() => {
            const d = request.request_date || (request as unknown as Record<string, unknown>).requested_date as string;
            return d ? new Date(d).toLocaleDateString('es-AR') : '-';
          })()}
          subtitle={(() => {
            const d = request.due_date || (request as unknown as Record<string, unknown>).scheduled_date as string;
            return d ? `Límite: ${new Date(d).toLocaleDateString('es-AR')}` : undefined;
          })()}
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
