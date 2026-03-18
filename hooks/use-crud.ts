import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types';

// ── Field mappers: frontend → API ──
// The frontend uses different field names than the API in some cases.
// These mappers translate before sending and after receiving.

const clientToApi = (data: Record<string, unknown>) => ({
  name: data.name,
  ruc: data.tax_id || data.ruc,
  address: data.address,
  contact_name: data.contact_person || data.contact_name,
  contact_email: data.contact_email || data.email,
  contact_phone: data.contact_phone || data.phone,
  is_active: data.active ?? true,
});

const clientFromApi = (data: Record<string, unknown>) => ({
  ...data,
  code: data.code || '',
  tax_id: data.ruc || '',
  email: data.contact_email || '',
  phone: data.contact_phone || '',
  contact_person: data.contact_name || '',
  active: data.is_active ?? true,
});

const equipmentToApi = (data: Record<string, unknown>) => ({
  client_id: data.client_id,
  name: data.name,
  type: data.type || '',
  brand: data.brand,
  model: data.model,
  year: data.year,
  plate: data.plate || '',
  serial_number: data.serial_number,
  internal_code: data.equipment_code || data.internal_code,
  status: data.status ? String(data.status).toLowerCase() : 'active',
  metadata: data.metadata || undefined,
});

const equipmentFromApi = (data: Record<string, unknown>) => ({
  ...data,
  equipment_code: data.internal_code || '',
  location: '',
  description: '',
  status: data.status ? String(data.status).toUpperCase() : 'ACTIVE',
  active: data.status === 'active',
  metadata: data.metadata || null,
});

const inspectionRequestToApi = (data: Record<string, unknown>) => ({
  client_id: data.client_id,
  service_type_id: data.service_type_id,
  requested_date: data.request_date || data.requested_date,
  scheduled_date: data.due_date || data.scheduled_date,
  status: data.status ? String(data.status).toLowerCase() : undefined,
  notes: data.notes || data.description,
});

const inspectionRequestFromApi = (data: Record<string, unknown>) => ({
  ...data,
  number: data.request_number || '',
  request_date: data.requested_date || '',
  due_date: data.scheduled_date || '',
  priority: 'MEDIUM',
  inspection_type: '',
  requested_by: '',
  description: data.notes || '',
});

const workOrderToApi = (data: Record<string, unknown>) => {
  const items = data.items as Array<Record<string, unknown>> | undefined;
  return {
    inspection_request_id: data.inspection_request_id,
    inspector_id: data.inspector_id,
    scheduled_date: data.scheduled_date,
    notes: data.notes,
    items: items?.map(item => ({
      equipment_id: item.equipment_id,
      inspection_template_id: item.template_id || item.inspection_template_id,
    })),
  };
};

const workOrderFromApi = (data: Record<string, unknown>) => ({
  ...data,
  code: data.order_number || '',
  priority: 'MEDIUM',
});

// ── Inspection template mappers ──
// API returns: section.name, section.order, question.text, question.type, question.order
// Frontend expects: section.title, section.sort_order, question.question_text, question.question_type, question.sort_order

function mapQuestionFromApi(q: Record<string, unknown>): Record<string, unknown> {
  return {
    ...q,
    question_text: q.question_text || q.text || '',
    question_type: q.question_type || q.type || 'text',
    sort_order: q.sort_order ?? q.order ?? 0,
  };
}

function mapSectionFromApi(s: Record<string, unknown>): Record<string, unknown> {
  const questions = s.questions as Record<string, unknown>[] | undefined;
  return {
    ...s,
    title: s.title || s.name || '',
    sort_order: s.sort_order ?? s.order ?? 0,
    is_required: s.is_required ?? true,
    questions: questions?.map(mapQuestionFromApi),
  };
}

/** Map an InspectionTemplate object from API field names to frontend field names.
 *  Exported so pages that fetch templates directly (outside useCrud) can reuse it. */
export function mapTemplateFromApi<T extends Record<string, unknown>>(data: T): T {
  const sections = data.sections as Record<string, unknown>[] | undefined;
  if (sections) {
    return { ...data, sections: sections.map(mapSectionFromApi) } as T;
  }
  return data;
}

/** Map template builder payload from frontend field names back to API field names. */
export function mapTemplateSectionsToApi(sections: Record<string, unknown>[]): Record<string, unknown>[] {
  return sections.map((s) => {
    const questions = s.questions as Record<string, unknown>[] | undefined;
    return {
      ...s,
      name: s.title || s.name,
      order: s.sort_order ?? s.order ?? 0,
      // keep title/sort_order too so the API can pick whichever it prefers
      questions: questions?.map((q) => ({
        ...q,
        text: q.question_text || q.text,
        type: q.question_type || q.type,
        order: q.sort_order ?? q.order ?? 0,
      })),
    };
  });
}

const inspectionTemplateFromApi = (data: Record<string, unknown>) => mapTemplateFromApi(data);

const findingFromApi = (data: Record<string, unknown>) => ({
  ...data,
  title: data.title || data.description || '',
  corrective_action: data.corrective_action || data.recommendation || '',
  status: data.status || (data.is_resolved ? 'RESOLVED' : 'OPEN'),
  due_date: data.due_date || null,
});

const inspectionFromApi = (data: Record<string, unknown>) => {
  const woItem = data.work_order_item as Record<string, unknown> | undefined;
  return {
    ...data,
    work_order_id: data.work_order_id || woItem?.work_order_id || '',
  };
};

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
