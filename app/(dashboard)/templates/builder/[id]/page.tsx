'use client';

import { useParams, useRouter } from 'next/navigation';
import { InspectionTemplate } from '@/types';
import { useToast } from '@/components/ui/toast';
import { TemplateBuilder } from '@/components/template-builder/template-builder';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = Number(params.id);

  const handleSaved = (template: InspectionTemplate) => {
    toast.success('Plantilla actualizada exitosamente');
    router.push(`/templates/${template.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          <span
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => router.push('/templates')}
          >
            Plantillas
          </span>
          {' > '}
          <span className="text-gray-700">Editar Plantilla</span>
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar Plantilla</h1>
      </div>

      <TemplateBuilder templateId={id} onSaved={handleSaved} />
    </div>
  );
}
