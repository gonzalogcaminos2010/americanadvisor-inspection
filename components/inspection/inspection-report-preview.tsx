'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { FileText, X, Send } from 'lucide-react';

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

  // If preview failed or no PDF, show a simple confirmation modal instead
  if (!loading && (error || !pdfUrl)) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Confirmar Envio</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Esta a punto de enviar esta inspeccion para revision del supervisor. Una vez enviada no podra modificar las respuestas.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Volver a editar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={submitting}
              isLoading={submitting}
            >
              Confirmar y Enviar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen PDF preview
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
        ) : (
          <iframe
            src={pdfUrl!}
            className="w-full h-full border-0"
            title="Preview Informe Preliminar"
          />
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
