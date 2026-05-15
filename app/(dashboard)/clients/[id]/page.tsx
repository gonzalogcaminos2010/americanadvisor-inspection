'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCrud } from '@/hooks/use-crud';
import { useToast } from '@/components/ui/toast';
import { Client, Equipment, EquipmentFormData, WorkOrder, ApiResponse, PaginatedResponse } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EquipmentForm } from '@/app/(dashboard)/equipment/_components/equipment-form';
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
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

type Tab = 'datos' | 'equipos' | 'ordenes';

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


export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('datos');
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null);

  // Client data
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

  // Equipment CRUD
  const { useList, useCreate, useUpdate, useDelete } = useCrud<Equipment, EquipmentFormData>({
    endpoint: '/equipment',
    queryKey: `client-equipment-${id}`,
  });

  const { data: equipmentResponse, isLoading: equipmentLoading } = useList({
    client_id: id,
    per_page: 50,
  });

  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  // Work orders
  const { data: ordersResponse } = useQuery<PaginatedResponse<WorkOrder>>({
    queryKey: ['client-work-orders', id],
    queryFn: () => api.get(`/work-orders?client_id=${id}&per_page=20`),
    enabled: !!id,
  });

  const client = clientResponse?.data;
  const equipment: Equipment[] = (() => {
    const raw = equipmentResponse;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    const paged = raw as PaginatedResponse<Equipment>;
    if (Array.isArray(paged.data)) return paged.data;
    const api = raw as ApiResponse<Equipment[]>;
    if (Array.isArray(api.data)) return api.data;
    return [];
  })();
  const orders = ordersResponse?.data ?? [];

  const lockedClient = client
    ? { id: Number(id), code: client.code, name: client.name }
    : undefined;

  const handleCreateEquipment = (formData: EquipmentFormData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Equipo creado exitosamente');
        setEquipmentModalOpen(false);
        queryClient.invalidateQueries({ queryKey: [`client-equipment-${id}`] });
      },
      onError: () => toast.error('Error al crear el equipo'),
    });
  };

  const handleUpdateEquipment = (formData: EquipmentFormData) => {
    if (!editingEquipment) return;
    updateMutation.mutate({ id: editingEquipment.id, data: formData }, {
      onSuccess: () => {
        toast.success('Equipo actualizado');
        setEditingEquipment(null);
        setEquipmentModalOpen(false);
        queryClient.invalidateQueries({ queryKey: [`client-equipment-${id}`] });
      },
      onError: () => toast.error('Error al actualizar el equipo'),
    });
  };

  const handleDeleteEquipment = () => {
    if (!deletingEquipment) return;
    deleteMutation.mutate(deletingEquipment.id, {
      onSuccess: () => {
        toast.success('Equipo eliminado');
        setDeletingEquipment(null);
        queryClient.invalidateQueries({ queryKey: [`client-equipment-${id}`] });
      },
      onError: () => toast.error('Error al eliminar el equipo'),
    });
  };

  const openCreate = () => {
    setEditingEquipment(null);
    setEquipmentModalOpen(true);
  };

  const openEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEquipmentModalOpen(true);
  };

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

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'datos', label: 'Datos' },
    { key: 'equipos', label: 'Equipos', count: equipment.length },
    { key: 'ordenes', label: 'Órdenes', count: orders.length },
  ];

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[18px] h-[18px] px-1 ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Datos */}
      {activeTab === 'datos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      )}

      {/* Tab: Equipos */}
      {activeTab === 'equipos' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              Equipos de {client.name}
            </h2>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Equipo
            </Button>
          </div>

          {equipmentLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : equipment.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No hay equipos registrados</p>
              <p className="text-xs mt-1">Hacé clic en &quot;Agregar Equipo&quot; para empezar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {equipment.map((eq) => (
                <div key={eq.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{eq.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {eq.equipment_code}
                      {eq.model && ` · ${eq.model}`}
                      {eq.serial_number && ` · S/N: ${eq.serial_number}`}
                      {eq.brand && ` · ${eq.brand}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge status={eq.status} />
                    <button
                      onClick={() => openEdit(eq)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingEquipment(eq)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Órdenes */}
      {activeTab === 'ordenes' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-green-500" />
              Órdenes de Trabajo
            </h2>
            <Button size="sm" variant="secondary" onClick={() => router.push('/work-orders')}>
              Ver todas
            </Button>
          </div>
          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay órdenes de trabajo para este cliente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((wo) => (
                <div
                  key={wo.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/work-orders/${wo.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{wo.order_number ?? wo.code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString('es-AR') : 'Sin fecha'}
                      {wo.inspector?.name && ` · ${wo.inspector.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={wo.status} />
                    <Badge status={wo.priority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal equipo */}
      <Modal
        isOpen={equipmentModalOpen}
        onClose={() => { setEquipmentModalOpen(false); setEditingEquipment(null); }}
        title={editingEquipment ? 'Editar Equipo' : 'Agregar Equipo'}
        size="lg"
      >
        {lockedClient && (
          <EquipmentForm
            initialData={editingEquipment ?? undefined}
            onSubmit={editingEquipment ? handleUpdateEquipment : handleCreateEquipment}
            isLoading={createMutation.isPending || updateMutation.isPending}
            lockedClient={lockedClient}
          />
        )}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deletingEquipment}
        onClose={() => setDeletingEquipment(null)}
        onConfirm={handleDeleteEquipment}
        title="Eliminar Equipo"
        message={`¿Estás seguro de eliminar "${deletingEquipment?.name}"? Esta acción no se puede deshacer.`}
        isLoading={deleteMutation.isPending}
      />
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
