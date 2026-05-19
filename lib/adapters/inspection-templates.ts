// Mappers for the /inspection-templates endpoint
// Translates field names between frontend and API representations.
//
// API returns: section.name, section.order, question.text, question.type, question.order
// Frontend expects: section.title, section.sort_order, question.question_text, question.question_type, question.sort_order

// Map API question type values to frontend QuestionType enum values
export const QUESTION_TYPE_MAP: Record<string, string> = {
  select: 'multiple_choice',
};

export function mapQuestionFromApi(q: Record<string, unknown>): Record<string, unknown> {
  const rawType = String(q.question_type || q.type || 'text');
  const mappedType = QUESTION_TYPE_MAP[rawType] || rawType;
  return {
    ...q,
    question_text: q.question_text || q.text || '',
    question_type: mappedType,
    sort_order: q.sort_order ?? q.order ?? 0,
  };
}

export function mapSectionFromApi(s: Record<string, unknown>): Record<string, unknown> {
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
  // Backend stores the category as `vehicle_type`; frontend code uses `category`.
  const category = (data.category as string | undefined) ?? (data.vehicle_type as string | undefined);
  const base = category !== undefined ? { ...data, category } : data;
  if (sections) {
    return { ...base, sections: sections.map(mapSectionFromApi) } as T;
  }
  return base as T;
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

export const inspectionTemplateFromApi = (data: Record<string, unknown>) => mapTemplateFromApi(data);
