// Mappers for the /findings endpoint
// Translates field names between frontend and API representations.

export const findingFromApi = (data: Record<string, unknown>) => ({
  ...data,
  title: data.title || data.description || '',
  corrective_action: data.corrective_action || data.recommendation || '',
  status: data.status || (data.is_resolved ? 'RESOLVED' : 'OPEN'),
  due_date: data.due_date || null,
});
