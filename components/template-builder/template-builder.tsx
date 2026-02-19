'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SectionEditor } from './section-editor';
import { TemplatePreview } from './template-preview';
import { useTemplateBuilder } from '@/hooks/use-template-builder';
import {
  InspectionTemplate,
  ApiResponse,
  TEMPLATE_CATEGORIES,
} from '@/types';
import { Plus, Save, Eye, EyeOff } from 'lucide-react';

interface TemplateBuilderProps {
  templateId?: number;
  onSaved?: (template: InspectionTemplate) => void;
}

const categoryOptions = Object.entries(TEMPLATE_CATEGORIES).map(
  ([value, label]) => ({ value, label })
);

export function TemplateBuilder({ templateId, onSaved }: TemplateBuilderProps) {
  const {
    state,
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
    saveMutation,
  } = useTemplateBuilder(templateId);

  const [showPreview, setShowPreview] = useState(false);

  // Fetch template for edit mode
  const { data: templateData } = useQuery<ApiResponse<InspectionTemplate>>({
    queryKey: ['inspection-templates', templateId],
    queryFn: () =>
      api.get<ApiResponse<InspectionTemplate>>(
        `/inspection-templates/${templateId}`
      ),
    enabled: !!templateId,
  });

  useEffect(() => {
    if (templateData?.data) {
      loadTemplate(templateData.data);
    }
  }, [templateData, loadTemplate]);

  const handleSave = () => {
    saveMutation.mutate(undefined, {
      onSuccess: (response) => {
        onSaved?.(response.data);
      },
    });
  };

  return (
    <div className="pb-20">
      {/* Header form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {templateId ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Nombre"
            value={state.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Nombre de la plantilla"
          />
          <Input
            label="Codigo"
            value={state.code}
            onChange={(e) => setField('code', e.target.value)}
            placeholder="COD-001"
          />
          <Select
            label="Categoria"
            value={state.category}
            onChange={(e) => setField('category', e.target.value)}
            options={categoryOptions}
            placeholder="Seleccionar categoria"
          />
          <Input
            label="Version"
            value={state.version}
            onChange={(e) => setField('version', e.target.value)}
            placeholder="1.0"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descripcion
          </label>
          <textarea
            value={state.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Descripcion de la plantilla (opcional)"
            rows={2}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={state.is_active}
              onChange={(e) => setField('is_active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Plantilla activa
          </label>
        </div>
      </div>

      {/* Preview or Editor */}
      {showPreview ? (
        <div className="mt-6">
          <TemplatePreview state={state} />
        </div>
      ) : (
        <>
          {/* Sections */}
          <div className="mt-6 space-y-4">
            {state.sections.map((section, sIndex) => (
              <SectionEditor
                key={section.tempId}
                section={section}
                sectionIndex={sIndex}
                totalSections={state.sections.length}
                onUpdate={(field, value) =>
                  updateSection(section.tempId, field, value)
                }
                onRemove={() => removeSection(section.tempId)}
                onAddQuestion={() => addQuestion(section.tempId)}
                onRemoveQuestion={(questionTempId) =>
                  removeQuestion(section.tempId, questionTempId)
                }
                onUpdateQuestion={(questionTempId, field, value) =>
                  updateQuestion(section.tempId, questionTempId, field, value)
                }
                onReorderQuestions={(fromIndex, toIndex) =>
                  reorderQuestions(section.tempId, fromIndex, toIndex)
                }
                onMoveUp={() => {
                  if (sIndex > 0) reorderSections(sIndex, sIndex - 1);
                }}
                onMoveDown={() => {
                  if (sIndex < state.sections.length - 1)
                    reorderSections(sIndex, sIndex + 1);
                }}
              />
            ))}
          </div>

          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={addSection}>
              <Plus className="h-4 w-4" />
              Agregar Seccion
            </Button>
          </div>
        </>
      )}

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between z-10">
        <div className="text-sm text-gray-500">
          {state.sections.length} secciones,{' '}
          {state.sections.reduce((sum, s) => sum + s.questions.length, 0)}{' '}
          preguntas
          {state.isDirty && (
            <span className="ml-2 text-amber-600">
              (cambios sin guardar)
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          isLoading={saveMutation.isPending}
          disabled={!state.name || !state.code || !state.category}
        >
          <Save className="h-4 w-4" />
          Guardar Plantilla
        </Button>
      </div>
    </div>
  );
}
