'use client';

import { useRouter } from 'next/navigation';
import { InspectionTemplate } from '@/types';
import { useToast } from '@/components/ui/toast';
import { TemplateBuilder } from '@/components/template-builder/template-builder';

export default function NewTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaved = (template: InspectionTemplate) => {
    toast.success('Plantilla creada exitosamente');
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
          <span className="text-gray-700">Nueva Plantilla</span>
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nueva Plantilla</h1>
      </div>

      <TemplateBuilder onSaved={handleSaved} />
    </div>
  );
}
