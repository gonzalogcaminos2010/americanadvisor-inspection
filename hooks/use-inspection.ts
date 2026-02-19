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

  // Fetch full inspection with template, answers, findings
  const {
    data: inspectionData,
    isLoading,
    refetch,
  } = useQuery<ApiResponse<Inspection>>({
    queryKey: ['inspection', inspectionId],
    queryFn: () => api.get(`/inspections/${inspectionId}`),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inspectionId]
  );

  // Batch save answers
  const saveAnswersMutation = useMutation<ApiResponse<InspectionAnswer[]>, Error, AnswerSubmission[]>({
    mutationFn: (answersBatch) =>
      api.post(`/inspections/${inspectionId}/answers`, { answers: answersBatch }),
    onSuccess: () => {
      setPendingSync(false);
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
    },
  });

  const syncAnswers = useCallback(() => {
    if (!inspectionId) return;
    const batch = Array.from(answers.values());
    if (batch.length > 0) {
      saveAnswersMutation.mutate(batch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionId, answers]);

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
