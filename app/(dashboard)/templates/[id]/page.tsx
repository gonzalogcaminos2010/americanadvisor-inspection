'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  InspectionTemplate,
  TEMPLATE_CATEGORIES,
  QUESTION_TYPE_LABELS,
  QuestionType,
  ApiResponse,
} from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Pencil, Copy, CheckCircle2, ClipboardList } from 'lucide-react';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: response, isLoading } = useQuery<ApiResponse<InspectionTemplate>>({
    queryKey: ['inspection-templates', id],
    queryFn: () => api.get(`/inspection-templates/${id}`),
    enabled: !!id,
  });

  const template = response?.data;

  const duplicateMutation = useMutation<ApiResponse<InspectionTemplate>, Error, void>({
    mutationFn: () => api.post(`/inspection-templates/${id}/duplicate`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      toast.success('Plantilla duplicada exitosamente');
      router.push(`/templates/${res.data.id}`);
    },
    onError: () => {
      toast.error('Error al duplicar la plantilla');
    },
  });

  const handleDuplicate = () => {
    if (!template) return;
    duplicateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Plantilla no encontrada</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/templates')}>
          Volver a plantillas
        </Button>
      </div>
    );
  }

  const categoryLabel = TEMPLATE_CATEGORIES[template.category] || template.category;
  const sections = template.sections ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Código: {template.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/templates')}>
            Volver
          </Button>
          <Button variant="secondary" onClick={handleDuplicate} isLoading={duplicateMutation.isPending}>
            <Copy className="h-4 w-4 mr-1" />
            Duplicar
          </Button>
          <Button onClick={() => router.push(`/templates/builder/${template.id}`)}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push(`/inspections/new?template_id=${template.id}`)}
          >
            <ClipboardList className="h-4 w-4 mr-1" />
            Crear Inspección
          </Button>
        </div>
      </div>

      {/* Template info card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
            {categoryLabel}
          </span>
          {template.version && (
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-xs font-medium">
              v{template.version}
            </span>
          )}
          <Badge status={template.is_active ? 'ACTIVE' : 'INACTIVE'} />
        </div>
        {template.description && (
          <p className="text-sm text-gray-600">{template.description}</p>
        )}
        <div className="flex gap-6 mt-4 text-sm text-gray-500">
          <span>{sections.length} secciones</span>
          <span>
            {sections.reduce((sum, s) => sum + (s.questions?.length ?? 0), 0)} preguntas
          </span>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Esta plantilla no tiene secciones definidas
        </div>
      ) : (
        sections
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((section, sIndex) => (
            <div key={section.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-blue-600">{sIndex + 1}.</span>
                <h3 className="text-base font-medium text-gray-900">{section.title}</h3>
                {section.is_required && (
                  <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
                    Requerida
                  </span>
                )}
              </div>
              {section.description && (
                <p className="text-sm text-gray-500 mb-3">{section.description}</p>
              )}

              {(!section.questions || section.questions.length === 0) ? (
                <p className="text-sm text-gray-400 italic">Sin preguntas en esta sección</p>
              ) : (
                <div className="space-y-2">
                  {section.questions
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((question, qIndex) => (
                      <div
                        key={question.id}
                        className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm text-gray-400 w-6 text-right shrink-0 pt-0.5">
                          {qIndex + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-900">{question.question_text}</span>
                            {question.is_required && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(question.question_type)}`}>
                              {QUESTION_TYPE_LABELS[question.question_type]}
                            </span>
                            {question.help_text && (
                              <span className="text-xs text-gray-400">{question.help_text}</span>
                            )}
                          </div>
                          {question.question_type === QuestionType.MULTIPLE_CHOICE &&
                            question.options &&
                            question.options.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {question.options.map((opt, i) => (
                                  <span
                                    key={i}
                                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${
                                      question.fail_values?.includes(opt)
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))
      )}
    </div>
  );
}

function getTypeColor(type: QuestionType): string {
  const colors: Record<QuestionType, string> = {
    [QuestionType.TEXT]: 'bg-gray-100 text-gray-700',
    [QuestionType.NUMBER]: 'bg-purple-100 text-purple-700',
    [QuestionType.YES_NO]: 'bg-green-100 text-green-700',
    [QuestionType.MULTIPLE_CHOICE]: 'bg-blue-100 text-blue-700',
    [QuestionType.PHOTO]: 'bg-yellow-100 text-yellow-700',
    [QuestionType.SIGNATURE]: 'bg-pink-100 text-pink-700',
    [QuestionType.DATE]: 'bg-orange-100 text-orange-700',
    [QuestionType.RATING]: 'bg-indigo-100 text-indigo-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}
