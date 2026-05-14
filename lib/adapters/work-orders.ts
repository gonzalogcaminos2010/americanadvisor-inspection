// Mappers for the /work-orders endpoint
// Translates field names between frontend and API representations.

export const workOrderToApi = (data: Record<string, unknown>) => {
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

export const workOrderFromApi = (data: Record<string, unknown>) => ({
  ...data,
  code: data.order_number || '',
  priority: 'MEDIUM',
});
