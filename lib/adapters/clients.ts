// Mappers for the /clients endpoint
// Translates field names between frontend and API representations.

export const clientToApi = (data: Record<string, unknown>) => ({
  name: data.name,
  ruc: data.tax_id || data.ruc,
  address: data.address,
  contact_name: data.contact_person || data.contact_name,
  contact_email: data.contact_email || data.email,
  contact_phone: data.contact_phone || data.phone,
  is_active: data.active ?? true,
});

export const clientFromApi = (data: Record<string, unknown>) => ({
  ...data,
  code: data.code || '',
  tax_id: data.ruc || '',
  email: data.contact_email || '',
  phone: data.contact_phone || '',
  contact_person: data.contact_name || '',
  active: data.is_active ?? true,
});
