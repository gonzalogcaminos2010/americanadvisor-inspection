// Mappers for the /inspection-requests endpoint
// Translates field names between frontend and API representations.

export const inspectionRequestToApi = (data: Record<string, unknown>) => ({
  client_id: data.client_id,
  service_type_id: data.service_type_id,
  requested_date: data.request_date || data.requested_date,
  scheduled_date: data.due_date || data.scheduled_date,
  status: data.status ? String(data.status).toLowerCase() : undefined,
  notes: data.notes || data.description,
});

export const inspectionRequestFromApi = (data: Record<string, unknown>) => ({
  ...data,
  number: data.request_number || '',
  request_date: data.requested_date || '',
  due_date: data.scheduled_date || '',
  priority: 'MEDIUM',
  inspection_type: '',
  requested_by: '',
  description: data.notes || '',
});
