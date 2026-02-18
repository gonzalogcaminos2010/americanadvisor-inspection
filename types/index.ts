// === API Response Types ===
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  message: string;
}

// === Enums ===
export enum EquipmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum InspectionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// === Entities ===
export interface Client {
  id: number;
  code: string;
  name: string;
  tax_id: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  industry_type: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: number;
  client_id: number;
  name: string;
  equipment_code: string;
  description: string | null;
  brand: string | null;
  model: string;
  serial_number: string;
  location: string | null;
  status: EquipmentStatus;
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface ServiceType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface InspectionRequest {
  id: number;
  client_id: number;
  service_type_id: number;
  request_number: string;
  request_date: string;
  due_date: string | null;
  status: InspectionRequestStatus;
  priority: string;
  amount: number | null;
  currency: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  service_type?: ServiceType;
}

export interface WorkOrder {
  id: number;
  inspection_request_id: number;
  equipment_id: number;
  assigned_to: number | null;
  order_number: string;
  status: WorkOrderStatus;
  priority: string;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  findings: string | null;
  created_at: string;
  updated_at: string;
  inspection_request?: InspectionRequest;
  equipment?: Equipment;
  inspector?: User;
}

// === Form Data Types ===
export interface ClientFormData {
  code: string;
  name: string;
  tax_id: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  industry_type?: string;
  notes?: string;
  active?: boolean;
}

export interface EquipmentFormData {
  client_id: number;
  name: string;
  equipment_code: string;
  description?: string;
  brand?: string;
  model: string;
  serial_number: string;
  location?: string;
  status: EquipmentStatus;
  notes?: string;
}

export interface InspectionRequestFormData {
  client_id: number;
  service_type_id: number;
  request_date: string;
  due_date?: string;
  priority: string;
  amount?: number;
  currency?: string;
  description?: string;
  notes?: string;
}

export interface WorkOrderFormData {
  inspection_request_id: number;
  equipment_id: number;
  assigned_to?: number;
  priority: string;
  scheduled_date?: string;
  notes?: string;
}
