'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { getInspectionReportPreview } from '@/lib/api';
import { SignaturePad } from './signature-pad';
import { InspectionReportPreview } from './inspection-report-preview';
import type { Inspection, AnswerSubmission } from '@/types';
import type { SectionProgress } from '@/hooks/use-inspection';

interface InspectionSummaryProps {
  sectionProgress: SectionProgress[];
  answers: Map<number, AnswerSubmission>;
  inspection: Inspection;
  onSubmit: (data: { signature_data?: string; gps_latitude?: number; gps_longitude?: number; notes?: string }) => void;
  isSubmitting: boolean;
}

export function InspectionSummary({ sectionProgress, answers, inspection, onSubmit, isSubmitting }: InspectionSummaryProps) {
  const [signature, setSignature] = useState<string>(inspection.signature_data || '');
  const [notes, setNotes] = useState<string>(inspection.notes || '');
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(
    inspection.gps_latitude && inspection.gps_longitude
      ? { lat: inspection.gps_latitude, lng: inspection.gps_longitude }
      : null
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const { toast } = useToast();

  const hasFails = sectionProgress.some((s) => s.hasFails);
  const flaggedAnswers = Array.from(answers.values()).filter((a) => a.is_flagged);
  const overallResult = hasFails ? 'FAIL' : 'PASS';

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      }
    );
  };

  const handleEnviarClick = async () => {
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const url = await getInspectionReportPreview(inspection.id);
      setPreviewUrl(url);
    } catch {
      setPreviewError('No se pudo generar el preview del informe. Puede continuar con el envio.');
      toast.error('Error al generar preview del informe');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    onSubmit({
      signature_data: signature || undefined,
      gps_latitude: gps?.lat,
      gps_longitude: gps?.lng,
      notes: notes || undefined,
    });
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Resumen de Inspeccion</h2>
        <p className="text-sm text-gray-500">Revise los resultados antes de enviar</p>
      </div>

      {/* Overall result */}
      <div className={cn(
        'flex items-center gap-3 rounded-lg border p-4',
        overallResult === 'PASS' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      )}>
        {overallResult === 'PASS' ? (
          <CheckCircle className="h-6 w-6 text-green-600" />
        ) : (
          <XCircle className="h-6 w-6 text-red-600" />
        )}
        <div>
          <p className="font-medium text-gray-900">Resultado General</p>
          <Badge status={overallResult} size="md" />
        </div>
      </div>

      {/* Section summary */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900">Secciones</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {sectionProgress.map((section) => (
            <div key={section.sectionId} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                {section.hasFails ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : section.requiredAnswered >= section.required ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm text-gray-700">{section.title}</span>
              </div>
              <span className="text-sm text-gray-500">{section.answered}/{section.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Flagged answers */}
      {flaggedAnswers.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-orange-800">
            Hallazgos Detectados ({flaggedAnswers.length})
          </h3>
          <ul className="space-y-1">
            {flaggedAnswers.map((a) => (
              <li key={a.question_id} className="text-sm text-orange-700">
                Pregunta #{a.question_id} - marcada como hallazgo
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notas Generales</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={cn(
            'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm',
            'placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
          )}
          placeholder="Observaciones adicionales..."
        />
      </div>

      {/* Signature */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Firma del Inspector</label>
        <SignaturePad value={signature} onChange={setSignature} />
      </div>

      {/* GPS */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Ubicacion</label>
        {gps ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}</span>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={handleGetLocation} isLoading={gpsLoading} type="button">
            <MapPin className="h-4 w-4" />
            Obtener Ubicacion
          </Button>
        )}
      </div>

      {/* Submit */}
      <div className="border-t border-gray-200 pt-4">
        <Button
          onClick={handleEnviarClick}
          isLoading={isSubmitting}
          size="lg"
          className="w-full"
        >
          Enviar Inspeccion
        </Button>
      </div>

      {/* Report Preview */}
      <InspectionReportPreview
        open={showPreview}
        onClose={handleClosePreview}
        onConfirmSubmit={handleConfirmSubmit}
        pdfUrl={previewUrl}
        loading={previewLoading}
        error={previewError}
      />
    </div>
  );
}
