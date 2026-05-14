/* eslint-disable @next/next/no-img-element */
'use client';

import { InspectionExecutor } from '@/components/inspection/inspection-executor';
import { Inspection } from '@/types';

interface InspectorExecutorViewProps {
  inspection: Inspection;
}

/**
 * View rendered when an inspection is in an active/editable state
 * (NOT_STARTED or IN_PROGRESS). Wraps the InspectionExecutor component.
 */
export function InspectorExecutorView({ inspection }: InspectorExecutorViewProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden" style={{ minHeight: '60vh' }}>
      <InspectionExecutor inspectionId={inspection.id} />
    </div>
  );
}
