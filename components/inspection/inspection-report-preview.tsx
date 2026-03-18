'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FileText, X, AlertTriangle } from 'lucide-react';

interface InspectionReportPreviewProps {
  open: boolean;
  onClose: () => void;
  onConfirmSubmit: () => Promise<void>;
  pdfUrl: string | null;
  loading: boolean;
  error?: string | null;
}

export function InspectionReportPreview({
  open,
  onClose,
  onConfirmSubmit,
  pdfUrl,
  loading,
  error,
}: InspectionReportPreviewProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirmSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Preview — Informe Preliminar de Inspeccion
          </h2>
        </div>
        <button
          onClick={onClose}
          disabled={submitting}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* PDF Content */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Spinner size="lg" />
            <span className="text-sm text-gray-500">Generando preview del informe...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <div className="text-center max-w-md">
              <p className="text-base font-semibold text-gray-900 mb-1">Preview no disponible</p>
              <p className="text-sm text-gray-500">
                {error}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Puede enviar la inspeccion de todas formas usando el boton de abajo.
            </p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Preview Informe Preliminar"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
            <AlertTriangle className="h-10 w-10 text-gray-400" />
            <p className="text-sm">No se pudo generar el preview</p>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-4 py-3 flex-shrink-0 bg-gray-50">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Volver a editar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={submitting || loading}
          isLoading={submitting}
        >
          Confirmar y Enviar
        </Button>
      </div>
    </div>
  );
}
