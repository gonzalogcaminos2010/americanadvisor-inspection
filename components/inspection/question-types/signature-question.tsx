/* eslint-disable @next/next/no-img-element */
'use client';

import { SignaturePad } from '@/components/inspection/signature-pad';

interface SignatureQuestionProps {
  value: string;
  onChange: (data: string) => void;
}

export function SignatureQuestion({ value, onChange }: SignatureQuestionProps) {
  return (
    <div>
      {value && !value.startsWith('data:') ? (
        <div className="mb-2">
          <img src={value} alt="Firma" className="max-h-24 rounded border border-gray-200" />
        </div>
      ) : null}
      <SignaturePad value={value} onChange={onChange} />
    </div>
  );
}
