import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types';

interface UseCrudOptions {
  endpoint: string;
  queryKey: string;
}

export function useCrud<TEntity, TFormData>({ endpoint, queryKey }: UseCrudOptions) {
  const queryClient = useQueryClient();

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
      queryFn: () => api.get(url),
    });
  }

  function useGetById(id: number | null) {
    return useQuery<ApiResponse<TEntity>>({
      queryKey: [queryKey, id],
      queryFn: () => api.get(`${endpoint}/${id}`),
      enabled: !!id,
    });
  }

  function useCreate() {
    return useMutation<ApiResponse<TEntity>, Error, TFormData>({
      mutationFn: (data) => api.post(endpoint, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useUpdate() {
    return useMutation<ApiResponse<TEntity>, Error, { id: number; data: TFormData }>({
      mutationFn: ({ id, data }) => api.put(`${endpoint}/${id}`, data),
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
