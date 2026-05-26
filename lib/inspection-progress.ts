// Cálculo de progreso/score de una Inspección — función pura extraída del
// hook useInspection para poder testearla sin montar React ni mockear queries.

import { TemplateSection, AnswerSubmission } from '@/types';

export interface SectionProgress {
  sectionId: number;
  title: string;
  total: number;
  answered: number;
  required: number;
  requiredAnswered: number;
  hasFails: boolean;
}

export interface InspectionProgress {
  sectionProgress: SectionProgress[];
  totalQuestions: number;
  totalAnswered: number;
  /** 0–100, redondeado. */
  progressPercent: number;
  /** ¿Todas las preguntas requeridas están respondidas? */
  allRequiredAnswered: boolean;
}

/** Una respuesta cuenta como "respondida" si tiene texto, número o booleano. */
export function isAnswered(answer?: AnswerSubmission): boolean {
  return (
    !!answer &&
    (!!answer.answer_value ||
      answer.answer_number !== undefined ||
      answer.answer_boolean !== undefined)
  );
}

export function computeInspectionProgress(
  sections: TemplateSection[],
  answers: Map<number, AnswerSubmission>,
): InspectionProgress {
  const sectionProgress: SectionProgress[] = sections.map((section) => {
    const questions = section.questions?.slice().sort((a, b) => a.sort_order - b.sort_order) || [];
    let answered = 0;
    let requiredAnswered = 0;
    let hasFails = false;

    questions.forEach((q) => {
      const answer = answers.get(q.id);
      if (isAnswered(answer)) {
        answered++;
        if (q.is_required) requiredAnswered++;
        if (answer!.is_flagged) hasFails = true;
      }
    });

    return {
      sectionId: section.id,
      title: section.title,
      total: questions.length,
      answered,
      required: questions.filter((q) => q.is_required).length,
      requiredAnswered,
      hasFails,
    };
  });

  const totalQuestions = sectionProgress.reduce((sum, s) => sum + s.total, 0);
  const totalAnswered = sectionProgress.reduce((sum, s) => sum + s.answered, 0);
  const progressPercent =
    totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
  const allRequiredAnswered = sectionProgress.every((s) => s.requiredAnswered >= s.required);

  return { sectionProgress, totalQuestions, totalAnswered, progressPercent, allRequiredAnswered };
}
