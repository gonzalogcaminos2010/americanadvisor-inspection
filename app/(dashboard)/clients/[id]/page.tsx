'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Client, Equipment, WorkOrder, ApiResponse, PaginatedResponse } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Truck,
  FileText,
  ClipboardList,
} from 'lucide-react';

// Map API fields to frontend fields (same logic as use-crud mappers)
function mapClientFromApi(data: Record<string, unknown>) {
  return {
    ...data,
    code: data.code || '',
    tax_id: data.ruc || '',
    email: data.contact_email || '',
    phone: data.contact_phone || '',
    contact_person: data.contact_name || '',
    active: data.is_active ?? true,
  };
}

function mapEquipmentFromApi(data: Record<string, unknown>) {
  return {
    ...data,
    equipment_code: data.internal_code || '',
    location: '',
    description: '',
    status: data.status ? String(data.status).toUpperCase() : 'ACTIVE',
    active: data.status === 'active',
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: clientResponse, isLoading } = useQuery<ApiResponse<Client>>({
    queryKey: ['client', id],
    queryFn: async () => {
      const raw = await api.get<Record<string, unknown>>(`/clients/${id}`);
      if (raw && typeof raw === 'object' && raw.data) {
        (raw as Record<string, unknown>).data = mapClientFromApi(raw.data as Record<string, unknown>);
      }
      return raw as unknown as ApiResponse<Client>;
    },
    enabled: !!id,
  });

  const { data: equipmentResponse } = useQuery<ApiResponse<Equipment[]> | PaginatedResponse<Equipment>>({
    queryKey: ['client-equipment', id],
    queryFn: async () => {
      const raw = await api.get<Record<string, unknown>>(`/clients/${id}/equipment`);
      // Map each equipment item from API format
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        if (Array.isArray(r.data)) {
          r.data = (r.data as Record<string, unknown>[]).map(mapEquipmentFromApi);
        }
      }
      return raw as unknown as ApiResponse<Equipment[]> | PaginatedResponse<Equipment>;
    },
    enabled: !!id,
  });

  const { data: ordersResponse } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['client-work-orders', id],
    queryFn: () => api.get(`/work-orders?client_id=${id}&per_page=20`),
    enabled: !!id,
  });

  const client = clientResponse?.data;
  const rawEquipment = equipmentResponse;
  const equipment: Equipment[] = Array.isArray(rawEquipment)
    ? rawEquipment
    : Array.isArray((rawEquipment as ApiResponse<Equipment[]>)?.data)
      ? (rawEquipment as ApiResponse<Equipment[]>).data
      : [];
  const orders = ordersResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Cliente no encontrado</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/clients')}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{client.code}</p>
        </div>
        <Badge status={client.active ? 'ACTIVE' : 'INACTIVE'} size="md" />
      </div>

      {/* Client info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos generales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            Datos Generales
          </h2>
          <dl className="space-y-3">
            <InfoRow label="CUIT/NIT" value={client.tax_id} />
            <InfoRow label="Industria" value={client.industry_type} />
            <InfoRow label="Codigo" value={client.code} />
          </dl>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-green-500" />
            Contacto
          </h2>
          <dl className="space-y-3">
            {client.contact_person && (
              <InfoRow label="Persona" value={client.contact_person} icon={<User className="h-3.5 w-3.5" />} />
            )}
            {(client.email || client.contact_email) && (
              <InfoRow label="Email" value={client.contact_email || client.email} icon={<Mail className="h-3.5 w-3.5" />} />
            )}
            {(client.phone || client.contact_phone) && (
              <InfoRow label="Telefono" value={client.contact_phone || client.phone} icon={<Phone className="h-3.5 w-3.5" />} />
            )}
          </dl>
        </div>

        {/* Ubicacion */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            Ubicacion
          </h2>
          <dl className="space-y-3">
            {client.address && <InfoRow label="Direccion" value={client.address} />}
            {client.city && <InfoRow label="Ciudad" value={client.city} />}
            {client.state && <InfoRow label="Provincia" value={client.state} />}
            {client.country && <InfoRow label="Pais" value={client.country} />}
            {client.postal_code && <InfoRow label="CP" value={client.postal_code} />}
            {!client.address && !client.city && !client.state && (
              <p className="text-sm text-gray-400 italic">Sin datos de ubicacion</p>
            )}
          </dl>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            Notas
          </h2>
          {client.notes ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin notas</p>
          )}
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Equipos ({equipment.length})
          </h2>
          <Button size="sm" onClick={() => router.push('/equipment')}>
            Gestionar Equipos
          </Button>
        </div>
        {equipment.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {equipment.map((eq) => (
              <div key={eq.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{eq.name}</p>
                  <p className="text-xs text-gray-500">
                    {eq.equipment_code} {eq.model && `| ${eq.model}`} {eq.serial_number && `| S/N: ${eq.serial_number}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={eq.status} />
                  {eq.location && <span className="text-xs text-gray-500">{eq.location}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-400">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay equipos registrados para este cliente</p>
          </div>
        )}
      </div>

      {/* Work Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-green-500" />
            Ordenes de Trabajo ({orders.length})
          </h2>
          <Button size="sm" onClick={() => router.push('/work-orders')}>
            Gestionar Ordenes
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
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay ordenes de trabajo para este cliente</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/clients')}>
          Volver a Clientes
        </Button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-gray-400 mt-0.5">{icon}</span>}
      <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900">{value}</dd>
      </div>
    </div>
  );
}
