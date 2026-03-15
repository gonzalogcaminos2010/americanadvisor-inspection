'use client';

import { useReducer, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  InspectionTemplate,
  TemplateSection,
  TemplateQuestion,
  QuestionType,
  ApiResponse,
} from '@/types';

// === State ===
export interface TemplateBuilderState {
  name: string;
  code: string;
  description: string;
  version: string;
  category: string;
  client_id: number | null;
  is_active: boolean;
  sections: BuilderSection[];
  isDirty: boolean;
}

export interface BuilderSection {
  id?: number;
  tempId: string;
  title: string;
  description: string;
  sort_order: number;
  is_required: boolean;
  questions: BuilderQuestion[];
}

export interface BuilderQuestion {
  id?: number;
  tempId: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  sort_order: number;
  options: string[];
  help_text: string;
  fail_values: string[];
}

// === Actions ===
type Action =
  | { type: 'SET_FIELD'; field: string; value: string | number | boolean | null }
  | { type: 'LOAD_TEMPLATE'; template: InspectionTemplate }
  | { type: 'ADD_SECTION' }
  | { type: 'REMOVE_SECTION'; tempId: string }
  | { type: 'UPDATE_SECTION'; tempId: string; field: string; value: string | boolean }
  | { type: 'REORDER_SECTIONS'; fromIndex: number; toIndex: number }
  | { type: 'ADD_QUESTION'; sectionTempId: string }
  | { type: 'REMOVE_QUESTION'; sectionTempId: string; questionTempId: string }
  | { type: 'UPDATE_QUESTION'; sectionTempId: string; questionTempId: string; field: string; value: unknown }
  | { type: 'REORDER_QUESTIONS'; sectionTempId: string; fromIndex: number; toIndex: number }
  | { type: 'MARK_CLEAN' };

let tempIdCounter = 0;
function generateTempId(): string {
  return `temp_${++tempIdCounter}_${Date.now()}`;
}

function createEmptySection(sortOrder: number): BuilderSection {
  return {
    tempId: generateTempId(),
    title: '',
    description: '',
    sort_order: sortOrder,
    is_required: true,
    questions: [],
  };
}

function createEmptyQuestion(sortOrder: number): BuilderQuestion {
  return {
    tempId: generateTempId(),
    question_text: '',
    question_type: QuestionType.TEXT,
    is_required: false,
    sort_order: sortOrder,
    options: [],
    help_text: '',
    fail_values: [],
  };
}

function sectionFromApi(section: TemplateSection): BuilderSection {
  return {
    id: section.id,
    tempId: generateTempId(),
    title: section.title,
    description: section.description || '',
    sort_order: section.sort_order,
    is_required: section.is_required,
    questions: (section.questions || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(questionFromApi),
  };
}

function questionFromApi(question: TemplateQuestion): BuilderQuestion {
  return {
    id: question.id,
    tempId: generateTempId(),
    question_text: question.question_text,
    question_type: question.question_type,
    is_required: question.is_required,
    sort_order: question.sort_order,
    options: question.options || [],
    help_text: question.help_text || '',
    fail_values: question.fail_values || [],
  };
}

const initialState: TemplateBuilderState = {
  name: '',
  code: '',
  description: '',
  version: '1.0',
  category: '',
  client_id: null,
  is_active: true,
  sections: [createEmptySection(0)],
  isDirty: false,
};

function reducer(state: TemplateBuilderState, action: Action): TemplateBuilderState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, isDirty: true };

    case 'LOAD_TEMPLATE':
      return {
        name: action.template.name,
        code: action.template.code,
        description: action.template.description || '',
        version: action.template.version || '1.0',
        category: action.template.category,
        client_id: action.template.client_id,
        is_active: action.template.is_active,
        sections: (action.template.sections || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(sectionFromApi),
        isDirty: false,
      };

    case 'ADD_SECTION':
      return {
        ...state,
        sections: [...state.sections, createEmptySection(state.sections.length)],
        isDirty: true,
      };

    case 'REMOVE_SECTION':
      return {
        ...state,
        sections: state.sections
          .filter((s) => s.tempId !== action.tempId)
          .map((s, i) => ({ ...s, sort_order: i })),
        isDirty: true,
      };

    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.tempId === action.tempId ? { ...s, [action.field]: action.value } : s
        ),
        isDirty: true,
      };

    case 'REORDER_SECTIONS': {
      const sections = [...state.sections];
      const [moved] = sections.splice(action.fromIndex, 1);
      sections.splice(action.toIndex, 0, moved);
      return {
        ...state,
        sections: sections.map((s, i) => ({ ...s, sort_order: i })),
        isDirty: true,
      };
    }

    case 'ADD_QUESTION':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.tempId === action.sectionTempId
            ? {
                ...s,
                questions: [
                  ...s.questions,
                  createEmptyQuestion(s.questions.length),
                ],
              }
            : s
        ),
        isDirty: true,
      };

    case 'REMOVE_QUESTION':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.tempId === action.sectionTempId
            ? {
                ...s,
                questions: s.questions
                  .filter((q) => q.tempId !== action.questionTempId)
                  .map((q, i) => ({ ...q, sort_order: i })),
              }
            : s
        ),
        isDirty: true,
      };

    case 'UPDATE_QUESTION':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.tempId === action.sectionTempId
            ? {
                ...s,
                questions: s.questions.map((q) =>
                  q.tempId === action.questionTempId
                    ? { ...q, [action.field]: action.value }
                    : q
                ),
              }
            : s
        ),
        isDirty: true,
      };

    case 'REORDER_QUESTIONS': {
      return {
        ...state,
        sections: state.sections.map((s) => {
          if (s.tempId !== action.sectionTempId) return s;
          const questions = [...s.questions];
          const [moved] = questions.splice(action.fromIndex, 1);
          questions.splice(action.toIndex, 0, moved);
          return {
            ...s,
            questions: questions.map((q, i) => ({ ...q, sort_order: i })),
          };
        }),
        isDirty: true,
      };
    }

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// === Hook ===
export function useTemplateBuilder(templateId?: number) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const queryClient = useQueryClient();

  const loadTemplate = useCallback((template: InspectionTemplate) => {
    dispatch({ type: 'LOAD_TEMPLATE', template });
  }, []);

  const setField = useCallback((field: string, value: string | number | boolean | null) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const addSection = useCallback(() => {
    dispatch({ type: 'ADD_SECTION' });
  }, []);

  const removeSection = useCallback((tempId: string) => {
    dispatch({ type: 'REMOVE_SECTION', tempId });
  }, []);

  const updateSection = useCallback((tempId: string, field: string, value: string | boolean) => {
    dispatch({ type: 'UPDATE_SECTION', tempId, field, value });
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_SECTIONS', fromIndex, toIndex });
  }, []);

  const addQuestion = useCallback((sectionTempId: string) => {
    dispatch({ type: 'ADD_QUESTION', sectionTempId });
  }, []);

  const removeQuestion = useCallback((sectionTempId: string, questionTempId: string) => {
    dispatch({ type: 'REMOVE_QUESTION', sectionTempId, questionTempId });
  }, []);

  const updateQuestion = useCallback(
    (sectionTempId: string, questionTempId: string, field: string, value: unknown) => {
      dispatch({ type: 'UPDATE_QUESTION', sectionTempId, questionTempId, field, value });
    },
    []
  );

  const reorderQuestions = useCallback(
    (sectionTempId: string, fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER_QUESTIONS', sectionTempId, fromIndex, toIndex });
    },
    []
  );

  // Build payload for API
  // Send both frontend field names (title, sort_order, question_text, question_type)
  // and API field names (name, order, text, type) for maximum compatibility.
  const buildPayload = useCallback(() => {
    return {
      name: state.name,
      code: state.code,
      description: state.description || null,
      version: state.version || null,
      category: state.category,
      client_id: state.client_id,
      is_active: state.is_active,
      sections: state.sections.map((s) => ({
        id: s.id,
        // frontend field names
        title: s.title,
        sort_order: s.sort_order,
        // API field names
        name: s.title,
        order: s.sort_order,
        description: s.description || null,
        is_required: s.is_required,
        questions: s.questions.map((q) => ({
          id: q.id,
          // frontend field names
          question_text: q.question_text,
          question_type: q.question_type,
          sort_order: q.sort_order,
          // API field names
          text: q.question_text,
          type: q.question_type,
          order: q.sort_order,
          is_required: q.is_required,
          options: q.options.length > 0 ? q.options : null,
          help_text: q.help_text || null,
          fail_values: q.fail_values.length > 0 ? q.fail_values : null,
        })),
      })),
    };
  }, [state]);

  const saveMutation = useMutation<ApiResponse<InspectionTemplate>, Error, void>({
    mutationFn: () => {
      const payload = buildPayload();
      if (templateId) {
        return api.put(`/inspection-templates/${templateId}`, payload);
      }
      return api.post('/inspection-templates', payload);
    },
    onSuccess: () => {
      dispatch({ type: 'MARK_CLEAN' });
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
    },
  });

  const duplicateMutation = useMutation<ApiResponse<InspectionTemplate>, Error, number>({
    mutationFn: (id) => api.post(`/inspection-templates/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
    },
  });

  return {
    state,
    dispatch,
    loadTemplate,
    setField,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    addQuestion,
    removeQuestion,
    updateQuestion,
    reorderQuestions,
    buildPayload,
    saveMutation,
    duplicateMutation,
  };
}
