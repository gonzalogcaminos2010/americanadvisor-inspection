// Mappers for the /equipment endpoint
// Translates field names between frontend and API representations.

export const equipmentToApi = (data: Record<string, unknown>) => ({
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

export const equipmentFromApi = (data: Record<string, unknown>) => ({
  ...data,
  equipment_code: data.internal_code || '',
  location: '',
  description: '',
  status: data.status ? String(data.status).toUpperCase() : 'ACTIVE',
  active: data.status === 'active',
  metadata: data.metadata || null,
});
