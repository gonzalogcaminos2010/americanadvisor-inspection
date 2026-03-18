'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Equipment, EquipmentFormData, EquipmentStatus, PaginatedResponse, Client } from '@/types';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const equipmentSchema = z.object({
  client_id: z.coerce.number().min(1, 'Seleccione un cliente'),
  name: z.string().min(1, 'El nombre es requerido'),
  equipment_code: z.string().min(1, 'El codigo es requerido'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().min(1, 'El modelo es requerido'),
  serial_number: z.string().min(1, 'El numero de serie es requerido'),
  location: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus),
  notes: z.string().optional(),
});

const SUGGESTED_KEYS = [
  { value: 'estructura_dimensiones', label: 'Estructura / Dimensiones' },
  { value: 'capacidad_max_perforacion', label: 'Capacidad Max. Perforacion' },
  { value: 'estacion_de_control', label: 'Estacion de Control' },
  { value: 'puesto_cable_wireline', label: 'Puesto Cable / Wireline' },
  { value: 'clave', label: 'Clave de Identificacion' },
  { value: 'oblea', label: 'Oblea' },
  { value: 'normas_referencia', label: 'Normas de Referencia' },
  { value: 'proxima_inspeccion', label: 'Proxima Inspeccion' },
];

interface MetadataEntry {
  key: string;
  value: string;
}

interface EquipmentFormProps {
  initialData?: Equipment;
  onSubmit: (data: EquipmentFormData) => void;
  isLoading?: boolean;
}

export function EquipmentForm({ initialData, onSubmit, isLoading }: EquipmentFormProps) {
  const { data: clientsData } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients-select'],
    queryFn: () => api.get<PaginatedResponse<Client>>('/clients?active=true&per_page=100'),
  });

  const [metadataEntries, setMetadataEntries] = useState<MetadataEntry[]>(() => {
    const meta = initialData?.metadata;
    if (meta && typeof meta === 'object') {
      return Object.entries(meta).map(([key, value]) => ({ key, value: String(value) }));
    }
    return [];
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: initialData
      ? {
          client_id: initialData.client_id,
          name: initialData.name,
          equipment_code: initialData.equipment_code,
          description: initialData.description || '',
          brand: initialData.brand || '',
          model: initialData.model,
          serial_number: initialData.serial_number,
          location: initialData.location || '',
          status: initialData.status,
          notes: initialData.notes || '',
        }
      : {
          status: EquipmentStatus.ACTIVE,
        },
  });

  const clients = clientsData?.data || [];
  const selectedClientId = watch('client_id');
  const isEditing = !!initialData;

  // Auto-generate equipment_code when client changes (only on create)
  useEffect(() => {
    if (isEditing || !selectedClientId) return;
    const client = clients.find((c) => c.id === Number(selectedClientId));
    if (!client) return;

    api.get<{ success: boolean; data: Equipment[] }>(`/clients/${client.id}/equipment`)
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const nextNum = String(list.length + 1).padStart(3, '0');
        setValue('equipment_code', `${client.code}-EQ-${nextNum}`);
      })
      .catch(() => {
        const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        setValue('equipment_code', `${client.code}-EQ-${rand}`);
      });
  }, [selectedClientId, clients, isEditing, setValue]);

  const clientOptions = clients.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const statusOptions = [
    { value: EquipmentStatus.ACTIVE, label: 'Activo' },
    { value: EquipmentStatus.INACTIVE, label: 'Inactivo' },
    { value: EquipmentStatus.MAINTENANCE, label: 'Mantenimiento' },
    { value: EquipmentStatus.RETIRED, label: 'Retirado' },
  ];

  const addMetadataEntry = () => {
    setMetadataEntries((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeMetadataEntry = (index: number) => {
    setMetadataEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMetadataEntry = (index: number, field: 'key' | 'value', val: string) => {
    setMetadataEntries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleFormSubmit = (data: EquipmentFormData) => {
    // Build metadata object from entries
    const metadata: Record<string, string> = {};
    metadataEntries.forEach((entry) => {
      const key = entry.key.trim();
      if (key) {
        metadata[key] = entry.value;
      }
    });

    onSubmit({
      ...data,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  };

  // Keys already used (to filter suggestions)
  const usedKeys = new Set(metadataEntries.map((e) => e.key));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          label="Cliente"
          options={clientOptions}
          placeholder="Seleccione un cliente"
          error={errors.client_id?.message}
          defaultValue={initialData ? String(initialData.client_id) : ''}
          {...register('client_id')}
        />
        <Input
          label="Nombre"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Codigo de Equipo"
          error={errors.equipment_code?.message}
          readOnly={!isEditing}
          className={!isEditing ? 'bg-gray-100' : ''}
          {...register('equipment_code')}
        />
        <Input
          label="Modelo"
          error={errors.model?.message}
          {...register('model')}
        />
        <Input
          label="N. Serie"
          error={errors.serial_number?.message}
          {...register('serial_number')}
        />
        <Input
          label="Marca"
          error={errors.brand?.message}
          {...register('brand')}
        />
        <Input
          label="Ubicacion"
          error={errors.location?.message}
          {...register('location')}
        />
        <Select
          label="Estado"
          options={statusOptions}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>
      <Input
        label="Descripcion"
        error={errors.description?.message}
        {...register('description')}
      />
      <Input
        label="Notas"
        error={errors.notes?.message}
        {...register('notes')}
      />

      {/* Metadata - Campos adicionales */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Campos Adicionales</h3>
            <p className="text-xs text-gray-500">Datos especificos del equipo (estructura, capacidad, normas, etc.)</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addMetadataEntry}>
            <Plus className="h-3 w-3 mr-1" />
            Agregar Campo
          </Button>
        </div>

        {metadataEntries.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
            Sin campos adicionales. Haga clic en &quot;Agregar Campo&quot; para comenzar.
          </p>
        )}

        <div className="space-y-2">
          {metadataEntries.map((entry, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="w-1/3">
                <select
                  value={SUGGESTED_KEYS.some((s) => s.value === entry.key) ? entry.key : '_custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '_custom') {
                      updateMetadataEntry(index, 'key', '');
                    } else {
                      updateMetadataEntry(index, 'key', val);
                    }
                  }}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar campo...</option>
                  {SUGGESTED_KEYS.filter((s) => !usedKeys.has(s.value) || s.value === entry.key).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                  <option value="_custom">-- Personalizado --</option>
                </select>
                {(!SUGGESTED_KEYS.some((s) => s.value === entry.key) && entry.key !== '') && (
                  <input
                    type="text"
                    value={entry.key}
                    onChange={(e) => updateMetadataEntry(index, 'key', e.target.value)}
                    placeholder="Nombre del campo"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              <div className="flex-1">
                {entry.key === 'normas_referencia' ? (
                  <textarea
                    value={entry.value}
                    onChange={(e) => updateMetadataEntry(index, 'value', e.target.value)}
                    placeholder="Valor"
                    rows={2}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : entry.key === 'proxima_inspeccion' ? (
                  <input
                    type="date"
                    value={entry.value}
                    onChange={(e) => updateMetadataEntry(index, 'value', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateMetadataEntry(index, 'value', e.target.value)}
                    placeholder="Valor"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeMetadataEntry(index)}
                className="mt-1 p-2 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Actualizar' : 'Crear'} Equipo
        </Button>
      </div>
    </form>
  );
}
