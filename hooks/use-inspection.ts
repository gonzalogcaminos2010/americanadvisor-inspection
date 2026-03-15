'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Inspection,
  InspectionAnswer,
  TemplateSection,
  AnswerSubmission,
  ApiResponse,
  InspectionPhoto,
  Finding,
  FindingFormData,
} from '@/types';
import { mapTemplateFromApi } from '@/hooks/use-crud';

// === Progress tracking ===
export interface SectionProgress {
  sectionId: number;
  title: string;
  total: number;
  answered: number;
  required: number;
  requiredAnswered: number;
  hasFails: boolean;
}

// === Hook ===
export function useInspection(inspectionId: number | null) {
  const queryClient = useQueryClient();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, AnswerSubmission>>(new Map());
  const [pendingSync, setPendingSync] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef<Map<number, AnswerSubmission>>(answers);

  // Fetch full inspection with template, answers, findings
  const {
    data: inspectionData,
    isLoading,
    refetch,
  } = useQuery<ApiResponse<Inspection>>({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      const raw = await api.get<ApiResponse<Inspection>>(`/inspections/${inspectionId}`);
      // Map template section/question field names from API to frontend format
      if (raw?.data?.template) {
        raw.data.template = mapTemplateFromApi(
          raw.data.template as unknown as Record<string, unknown>
        ) as unknown as typeof raw.data.template;
      }
      return raw;
    },
    enabled: !!inspectionId,
  });

  const inspection = inspectionData?.data;
  const template = inspection?.template;
  const sections = template?.sections?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const currentSection = sections[currentSectionIndex];

  // Initialize answers from existing data
  useEffect(() => {
    if (inspection?.answers && answers.size === 0) {
      const map = new Map<number, AnswerSubmission>();
      inspection.answers.forEach((a: InspectionAnswer) => {
        map.set(a.question_id, {
          question_id: a.question_id,
          answer_value: a.answer_value || undefined,
          answer_number: a.answer_number ?? undefined,
          answer_boolean: a.answer_boolean ?? undefined,
          is_flagged: a.is_flagged,
          notes: a.notes || undefined,
        });
      });
      setAnswers(map);
    }
  }, [inspection?.answers, answers.size]);

  // Calculate progress per section
  const sectionProgress: SectionProgress[] = sections.map((section: TemplateSection) => {
    const questions = section.questions?.sort((a, b) => a.sort_order - b.sort_order) || [];
    const requiredQuestions = questions.filter((q) => q.is_required);
    let answered = 0;
    let requiredAnswered = 0;
    let hasFails = false;

    questions.forEach((q) => {
      const answer = answers.get(q.id);
      if (answer && (answer.answer_value || answer.answer_number !== undefined || answer.answer_boolean !== undefined)) {
        answered++;
        if (q.is_required) requiredAnswered++;
        if (answer.is_flagged) hasFails = true;
      }
    });

    return {
      sectionId: section.id,
      title: section.title,
      total: questions.length,
      answered,
      required: requiredQuestions.length,
      requiredAnswered,
      hasFails,
    };
  });

  const totalQuestions = sectionProgress.reduce((sum, s) => sum + s.total, 0);
  const totalAnswered = sectionProgress.reduce((sum, s) => sum + s.answered, 0);
  const progressPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  const allRequiredAnswered = sectionProgress.every(
    (s) => s.requiredAnswered >= s.required
  );

  // Keep ref in sync with state so debounced saves always read latest answers
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Batch save answers
  const saveAnswersMutation = useMutation<ApiResponse<InspectionAnswer[]>, Error, AnswerSubmission[]>({
    mutationFn: (answersBatch) =>
      api.post(`/inspections/${inspectionId}/answers`, { answers: answersBatch }),
    onSuccess: () => {
      setPendingSync(false);
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
    },
    onError: () => {
      setPendingSync(false);
    },
  });

  // Use a ref for the mutation so the debounced callback never goes stale
  const saveMutationRef = useRef(saveAnswersMutation);
  useEffect(() => {
    saveMutationRef.current = saveAnswersMutation;
  }, [saveAnswersMutation]);

  const syncAnswers = useCallback(() => {
    if (!inspectionId) return;
    const batch = Array.from(answersRef.current.values());
    if (batch.length > 0) {
      saveMutationRef.current.mutate(batch);
    }
  }, [inspectionId]);

  // Set answer for a question
  const setAnswer = useCallback(
    (questionId: number, submission: Partial<AnswerSubmission>) => {
      setAnswers((prev) => {
        const map = new Map(prev);
        const existing = map.get(questionId) || { question_id: questionId };
        map.set(questionId, { ...existing, ...submission, question_id: questionId });
        return map;
      });
      setPendingSync(true);

      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        syncAnswers();
      }, 2000);
    },
    [syncAnswers]
  );

  // Submit inspection (finalize)
  const submitMutation = useMutation<ApiResponse<Inspection>, Error, { signature_data?: string; gps_latitude?: number; gps_longitude?: number; notes?: string }>({
    mutationFn: (data) => api.post(`/inspections/${inspectionId}/submit`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });

  // Upload photo
  const uploadPhotoMutation = useMutation<ApiResponse<InspectionPhoto>, Error, { file: File; answerId?: number; findingId?: number; caption?: string }>({
    mutationFn: ({ file, answerId, findingId, caption }) => {
      const formData = new FormData();
      formData.append('photo', file);
      if (answerId) formData.append('answer_id', String(answerId));
      if (findingId) formData.append('finding_id', String(findingId));
      if (caption) formData.append('caption', caption);
      return api.upload(`/inspections/${inspectionId}/photos`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
    },
  });

  // Create finding
  const createFindingMutation = useMutation<ApiResponse<Finding>, Error, FindingFormData & { answer_id?: number }>({
    mutationFn: (data) => api.post(`/inspections/${inspectionId}/findings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
    },
  });

  // Navigation
  const goToSection = useCallback((index: number) => {
    setCurrentSectionIndex(index);
  }, []);

  const nextSection = useCallback(() => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((i) => i + 1);
    }
  }, [currentSectionIndex, sections.length]);

  const prevSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((i) => i - 1);
    }
  }, [currentSectionIndex]);

  // Start inspection
  const startMutation = useMutation<ApiResponse<Inspection>, Error, { work_order_id: number; template_id: number }>({
    mutationFn: (data) => api.post(`/work-orders/${data.work_order_id}/inspections`, { template_id: data.template_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });

  return {
    // Data
    inspection,
    template,
    sections,
    currentSection,
    currentSectionIndex,
    answers,
    isLoading,

    // Progress
    sectionProgress,
    totalQuestions,
    totalAnswered,
    progressPercent,
    allRequiredAnswered,
    pendingSync,

    // Actions
    setAnswer,
    syncAnswers,
    goToSection,
    nextSection,
    prevSection,
    refetch,

    // Mutations
    startMutation,
    saveAnswersMutation,
    submitMutation,
    uploadPhotoMutation,
    createFindingMutation,
  };
}
