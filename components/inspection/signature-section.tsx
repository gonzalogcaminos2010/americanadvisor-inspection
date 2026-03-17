'use client';

import { useState, useRef, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Inspection } from '@/types';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { PenTool, CheckCircle, Clock } from 'lucide-react';

interface SignatureSectionProps {
  inspection: Inspection;
}

interface SignatureSlotProps {
  label: string;
  signatureUrl: string | null;
  signedAt: string | null;
  canSign: boolean;
  onSign: () => void;
}

function SignatureSlot({ label, signatureUrl, signedAt, canSign, onSign }: SignatureSlotProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
        {signatureUrl ? (
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Firmado</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Pendiente</span>
          </div>
        )}
      </div>

      {signatureUrl ? (
        <div>
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center" style={{ minHeight: 100 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signatureUrl} alt={`Firma ${label}`} className="max-h-24 object-contain" />
          </div>
          {signedAt && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {new Date(signedAt).toLocaleString('es-ES')}
            </p>
          )}
        </div>
      ) : canSign ? (
        <Button size="sm" variant="primary" onClick={onSign} className="w-full">
          <PenTool className="h-3.5 w-3.5 mr-1.5" />
          Firmar como {label}
        </Button>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-xs text-gray-400">Sin firma</p>
        </div>
      )}
    </div>
  );
}

export function SignatureSection({ inspection }: SignatureSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signingRole, setSigningRole] = useState<'supervisor' | null>(null);

  const signMutation = useMutation({
    mutationFn: (data: { role: string; signature: string }) =>
      api.post(`/inspections/${inspection.id}/sign`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', String(inspection.id)] });
      toast.success('Firma registrada exitosamente');
      setShowSignModal(false);
      setSigningRole(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(axiosErr?.response?.data?.message || axiosErr?.message || 'Error al firmar');
    },
  });

  const handleOpenSign = useCallback(() => {
    setSigningRole('supervisor');
    setShowSignModal(true);
  }, []);

  const handleSign = useCallback(() => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error('Debe dibujar su firma antes de confirmar');
      return;
    }
    const dataUrl = sigCanvasRef.current.toDataURL('image/png');
    signMutation.mutate({ role: 'supervisor', signature: dataUrl });
  }, [signMutation, toast]);

  const handleClear = useCallback(() => {
    sigCanvasRef.current?.clear();
  }, []);

  const isCompleted = inspection.status?.toLowerCase() === 'completed';
  const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'admin';
  const canSupervisorSign = isCompleted && isSupervisorOrAdmin && !inspection.supervisor_signature;

  if (!isCompleted) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-indigo-500" />
          Firmas
        </h3>
        {inspection.all_signatures_complete && (
          <Badge status="approved" />
        )}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SignatureSlot
          label="Inspector"
          signatureUrl={inspection.inspector_signature}
          signedAt={inspection.inspector_signed_at}
          canSign={false}
          onSign={() => {}}
        />
        <SignatureSlot
          label="Supervisor"
          signatureUrl={inspection.supervisor_signature}
          signedAt={inspection.supervisor_signed_at}
          canSign={canSupervisorSign}
          onSign={handleOpenSign}
        />
        <SignatureSlot
          label="Cliente"
          signatureUrl={inspection.client_signature}
          signedAt={inspection.client_signed_at}
          canSign={false}
          onSign={() => {}}
        />
      </div>

      {/* Signature Modal */}
      <Modal
        isOpen={showSignModal}
        onClose={() => { setShowSignModal(false); setSigningRole(null); }}
        title={`Firmar como ${signingRole === 'supervisor' ? 'Supervisor' : ''}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Dibuje su firma en el recuadro. Esta firma quedara registrada en la inspeccion.
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <SignatureCanvas
              ref={sigCanvasRef}
              canvasProps={{
                className: 'w-full',
                style: { width: '100%', height: 200 },
              }}
              backgroundColor="white"
            />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Limpiar
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowSignModal(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSign} isLoading={signMutation.isPending}>
                <PenTool className="h-3.5 w-3.5 mr-1.5" />
                Confirmar Firma
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
