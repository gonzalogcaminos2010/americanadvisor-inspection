// Mappers for the /inspections endpoint
// Translates field names between frontend and API representations.

export const inspectionFromApi = (data: Record<string, unknown>) => {
  const woItem = data.work_order_item as Record<string, unknown> | undefined;
  return {
    ...data,
    work_order_id: data.work_order_id || woItem?.work_order_id || '',
  };
};
