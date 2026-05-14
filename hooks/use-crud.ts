import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types';

// ── Field mappers imported from dedicated adapter files ──
import { clientToApi, clientFromApi } from '@/lib/adapters/clients';
import { equipmentToApi, equipmentFromApi } from '@/lib/adapters/equipment';
import { inspectionRequestToApi, inspectionRequestFromApi } from '@/lib/adapters/inspection-requests';
import { workOrderToApi, workOrderFromApi } from '@/lib/adapters/work-orders';
import { inspectionTemplateFromApi } from '@/lib/adapters/inspection-templates';
import { findingFromApi } from '@/lib/adapters/findings';
import { inspectionFromApi } from '@/lib/adapters/inspections';

// Re-export the public template mappers so existing callers don't break
export { mapTemplateFromApi, mapTemplateSectionsToApi } from '@/lib/adapters/inspection-templates';

// Map of endpoint → { toApi, fromApi }
const mappers: Record<string, { toApi?: (d: Record<string, unknown>) => unknown; fromApi?: (d: Record<string, unknown>) => unknown }> = {
  '/clients': { toApi: clientToApi, fromApi: clientFromApi },
  '/equipment': { toApi: equipmentToApi, fromApi: equipmentFromApi },
  '/inspection-requests': { toApi: inspectionRequestToApi, fromApi: inspectionRequestFromApi },
  '/work-orders': { toApi: workOrderToApi, fromApi: workOrderFromApi },
  '/inspection-templates': { fromApi: inspectionTemplateFromApi },
  '/findings': { fromApi: findingFromApi },
  '/inspections': { fromApi: inspectionFromApi },
};

// Normalize API paginated response to what frontend expects
function normalizePaginated(raw: Record<string, unknown>): Record<string, unknown> {
  const pagination = raw.pagination as Record<string, unknown> | undefined;
  if (pagination && !raw.meta) {
    return {
      ...raw,
      meta: {
        current_page: pagination.current_page,
        last_page: pagination.last_page,
        per_page: pagination.per_page,
        total: pagination.total,
        from: 1,
        to: pagination.total,
      },
    };
  }
  return raw;
}

interface UseCrudOptions {
  endpoint: string;
  queryKey: string;
}

export function useCrud<TEntity, TFormData>({ endpoint, queryKey }: UseCrudOptions) {
  const queryClient = useQueryClient();
  const mapper = mappers[endpoint];

  function useList(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return useQuery<PaginatedResponse<TEntity>>({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const raw = await api.get<Record<string, unknown>>(url);
        const normalized = normalizePaginated(raw as Record<string, unknown>);
        if (mapper?.fromApi && Array.isArray(normalized.data)) {
          normalized.data = (normalized.data as Record<string, unknown>[]).map(mapper.fromApi);
        }
        return normalized as unknown as PaginatedResponse<TEntity>;
      },
    });
  }

  function useGetById(id: number | null) {
    return useQuery<ApiResponse<TEntity>>({
      queryKey: [queryKey, id],
      queryFn: async () => {
        const raw = await api.get<Record<string, unknown>>(`${endpoint}/${id}`);
        if (mapper?.fromApi && raw && typeof raw === 'object' && (raw as Record<string, unknown>).data) {
          (raw as Record<string, unknown>).data = mapper.fromApi((raw as Record<string, unknown>).data as Record<string, unknown>);
        }
        return raw as unknown as ApiResponse<TEntity>;
      },
      enabled: !!id,
    });
  }

  function useCreate() {
    return useMutation<ApiResponse<TEntity>, Error, TFormData>({
      mutationFn: (data) => {
        const payload = mapper?.toApi ? mapper.toApi(data as Record<string, unknown>) : data;
        return api.post(endpoint, payload);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useUpdate() {
    return useMutation<ApiResponse<TEntity>, Error, { id: number; data: TFormData }>({
      mutationFn: ({ id, data }) => {
        const payload = mapper?.toApi ? mapper.toApi(data as Record<string, unknown>) : data;
        return api.put(`${endpoint}/${id}`, payload);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useDelete() {
    return useMutation<ApiResponse<void>, Error, number>({
      mutationFn: (id) => api.delete(`${endpoint}/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  return { useList, useGetById, useCreate, useUpdate, useDelete };
}

// Pre-configured hooks for each entity
import {
  Client, ClientFormData,
  Equipment, EquipmentFormData,
  InspectionRequest, InspectionRequestFormData,
  WorkOrder, WorkOrderFormData,
  InspectionTemplate, InspectionTemplateFormData,
  Inspection, InspectionFormData,
  Finding, FindingFormData,
} from '@/types';

export const clientsCrud = () => useCrud<Client, ClientFormData>({ endpoint: '/clients', queryKey: 'clients' });
export const equipmentCrud = () => useCrud<Equipment, EquipmentFormData>({ endpoint: '/equipment', queryKey: 'equipment' });
export const inspectionRequestsCrud = () => useCrud<InspectionRequest, InspectionRequestFormData>({ endpoint: '/inspection-requests', queryKey: 'inspection-requests' });
export const workOrdersCrud = () => useCrud<WorkOrder, WorkOrderFormData>({ endpoint: '/work-orders', queryKey: 'work-orders' });
export const inspectionTemplatesCrud = () => useCrud<InspectionTemplate, InspectionTemplateFormData>({ endpoint: '/inspection-templates', queryKey: 'inspection-templates' });
export const inspectionsCrud = () => useCrud<Inspection, InspectionFormData>({ endpoint: '/inspections', queryKey: 'inspections' });
export const findingsCrud = () => useCrud<Finding, FindingFormData>({ endpoint: '/findings', queryKey: 'findings' });
