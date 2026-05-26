import { describe, it, expect } from 'vitest';
import { TemplateSection, AnswerSubmission } from '@/types';
import { computeInspectionProgress, isAnswered } from './inspection-progress';

// Helpers para armar secciones/preguntas sin completar todos los campos del tipo.
type Q = { id: number; is_required: boolean; sort_order: number };
const q = (id: number, is_required: boolean, sort_order = id): Q => ({ id, is_required, sort_order });

const section = (id: number, title: string, questions: Q[]): TemplateSection =>
  ({ id, title, sort_order: id, is_required: false, questions } as unknown as TemplateSection);

const ans = (question_id: number, extra: Partial<AnswerSubmission> = {}): [number, AnswerSubmission] => [
  question_id,
  { question_id, ...extra },
];

describe('isAnswered', () => {
  it('cuenta texto, número o booleano; no cuenta vacío', () => {
    expect(isAnswered({ question_id: 1, answer_value: 'x' })).toBe(true);
    expect(isAnswered({ question_id: 1, answer_number: 0 })).toBe(true);
    expect(isAnswered({ question_id: 1, answer_boolean: false })).toBe(true);
    expect(isAnswered({ question_id: 1 })).toBe(false);
    expect(isAnswered(undefined)).toBe(false);
  });
});

describe('computeInspectionProgress', () => {
  const sections = [
    section(1, 'Frenos', [q(1, true), q(2, true), q(3, false)]),
    section(2, 'Luces', [q(4, true), q(5, false)]),
  ];

  it('sin respuestas: todo en cero, requeridas no completas', () => {
    const p = computeInspectionProgress(sections, new Map());
    expect(p.totalQuestions).toBe(5);
    expect(p.totalAnswered).toBe(0);
    expect(p.progressPercent).toBe(0);
    expect(p.allRequiredAnswered).toBe(false);
  });

  it('cuenta respondidas y requeridas por sección', () => {
    const answers = new Map<number, AnswerSubmission>([
      ans(1, { answer_value: 'ok' }),
      ans(2, { answer_boolean: true }),
      ans(4, { answer_number: 5 }),
    ]);
    const p = computeInspectionProgress(sections, answers);
    expect(p.sectionProgress[0]).toMatchObject({
      sectionId: 1,
      total: 3,
      answered: 2,
      required: 2,
      requiredAnswered: 2,
    });
    expect(p.totalAnswered).toBe(3);
    expect(p.progressPercent).toBe(60); // 3/5
  });

  it('allRequiredAnswered true solo cuando TODAS las requeridas están', () => {
    const answers = new Map<number, AnswerSubmission>([
      ans(1, { answer_value: 'a' }),
      ans(2, { answer_value: 'b' }),
      ans(4, { answer_value: 'c' }),
    ]);
    // requeridas son 1,2,4 → todas respondidas (3 y 5 son opcionales)
    expect(computeInspectionProgress(sections, answers).allRequiredAnswered).toBe(true);
  });

  it('marca hasFails cuando una respuesta está flageada', () => {
    const answers = new Map<number, AnswerSubmission>([ans(1, { answer_value: 'mal', is_flagged: true })]);
    const p = computeInspectionProgress(sections, answers);
    expect(p.sectionProgress[0].hasFails).toBe(true);
    expect(p.sectionProgress[1].hasFails).toBe(false);
  });

  it('una respuesta vacía (sin valor) no cuenta', () => {
    const answers = new Map<number, AnswerSubmission>([ans(1, {})]);
    expect(computeInspectionProgress(sections, answers).totalAnswered).toBe(0);
  });
});
