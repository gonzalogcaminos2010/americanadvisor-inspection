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

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  YES_NO = 'yes_no',
  MULTIPLE_CHOICE = 'multiple_choice',
  PHOTO = 'photo',
  SIGNATURE = 'signature',
  DATE = 'date',
  RATING = 'rating',
}

export enum InspectionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
}

export enum InspectionResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

export enum FindingSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FindingStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  CORRECTIVE_ACTION = 'CORRECTIVE_ACTION',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
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
  template_id?: number | null;
  template?: InspectionTemplate;
}

// === Inspection System Entities ===

export interface InspectionTemplate {
  id: number;
  name: string;
  code: string;
  description: string | null;
  version: string | null;
  category: string;
  client_id: number | null;
  is_active: boolean;
  created_by: number | null;
  sections?: TemplateSection[];
  client?: Client;
  sections_count?: number;
  questions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateSection {
  id: number;
  template_id: number;
  title: string;
  description: string | null;
  sort_order: number;
  is_required: boolean;
  questions?: TemplateQuestion[];
  created_at: string;
  updated_at: string;
}

export interface TemplateQuestion {
  id: number;
  section_id: number;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  sort_order: number;
  options: string[] | null;
  help_text: string | null;
  fail_values: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: number;
  work_order_id: number;
  template_id: number;
  inspector_id: number;
  status: InspectionStatus;
  started_at: string | null;
  completed_at: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  overall_result: InspectionResult | null;
  notes: string | null;
  signature_data: string | null;
  template?: InspectionTemplate;
  work_order?: WorkOrder;
  inspector?: User;
  answers?: InspectionAnswer[];
  photos?: InspectionPhoto[];
  findings?: Finding[];
  created_at: string;
  updated_at: string;
}

export interface InspectionAnswer {
  id: number;
  inspection_id: number;
  question_id: number;
  answer_value: string | null;
  answer_number: number | null;
  answer_boolean: boolean | null;
  is_flagged: boolean;
  notes: string | null;
  question?: TemplateQuestion;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionPhoto {
  id: number;
  inspection_id: number;
  answer_id: number | null;
  finding_id: number | null;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  caption: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  taken_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: number;
  inspection_id: number;
  answer_id: number | null;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  corrective_action: string | null;
  due_date: string | null;
  resolved_at: string | null;
  resolved_by: number | null;
  inspection?: Inspection;
  photos?: InspectionPhoto[];
  created_at: string;
  updated_at: string;
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
  template_id?: number;
  priority: string;
  scheduled_date?: string;
  notes?: string;
}

export interface InspectionTemplateFormData {
  name: string;
  code: string;
  description?: string;
  version?: string;
  category: string;
  client_id?: number | null;
  is_active?: boolean;
}

export interface TemplateSectionFormData {
  title: string;
  description?: string;
  sort_order: number;
  is_required: boolean;
}

export interface TemplateQuestionFormData {
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  sort_order: number;
  options?: string[];
  help_text?: string;
  fail_values?: string[];
}

export interface FindingFormData {
  title: string;
  description: string;
  severity: FindingSeverity;
  status?: FindingStatus;
  corrective_action?: string;
  due_date?: string;
}

export interface InspectionFormData {
  work_order_id: number;
  template_id: number;
}

// === Answer submission types ===
export interface AnswerSubmission {
  question_id: number;
  answer_value?: string;
  answer_number?: number;
  answer_boolean?: boolean;
  is_flagged?: boolean;
  notes?: string;
}

// === Template category labels ===
export const TEMPLATE_CATEGORIES: Record<string, string> = {
  vehiculo_liviano: 'Vehículo Liviano',
  camioneta_4x4: 'Camioneta 4x4',
  perforadora_diamantina: 'Perforadora Diamantina',
  equipo_pesado_mineria: 'Equipo Pesado Minería',
  grua_izaje: 'Grúa/Izaje',
  compresor: 'Compresor',
  generador: 'Generador',
  instalacion_electrica: 'Instalación Eléctrica',
  instalacion_industrial: 'Instalación Industrial',
  otro: 'Otro',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.TEXT]: 'Texto',
  [QuestionType.NUMBER]: 'Número',
  [QuestionType.YES_NO]: 'Sí/No',
  [QuestionType.MULTIPLE_CHOICE]: 'Opción Múltiple',
  [QuestionType.PHOTO]: 'Foto',
  [QuestionType.SIGNATURE]: 'Firma',
  [QuestionType.DATE]: 'Fecha',
  [QuestionType.RATING]: 'Calificación',
};
