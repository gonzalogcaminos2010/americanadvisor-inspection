'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FindingSeverity, type FindingFormData } from '@/types';

interface FindingCardProps {
  onSubmit: (data: FindingFormData) => void;
  isLoading: boolean;
  questionText?: string;
}

const severityOptions = [
  { value: FindingSeverity.LOW, label: 'Baja' },
  { value: FindingSeverity.MEDIUM, label: 'Media' },
  { value: FindingSeverity.HIGH, label: 'Alta' },
  { value: FindingSeverity.CRITICAL, label: 'Critico' },
];

export function FindingCard({ onSubmit, isLoading, questionText }: FindingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FindingFormData>({
    title: '',
    description: '',
    severity: FindingSeverity.MEDIUM,
    corrective_action: '',
    due_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    onSubmit(form);
    setForm({ title: '', description: '', severity: FindingSeverity.MEDIUM, corrective_action: '', due_date: '' });
    setIsOpen(false);
  };

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-orange-800"
      >
        <span>Agregar Hallazgo</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-orange-200 px-4 py-3">
          {questionText && (
            <p className="text-xs text-gray-500">Pregunta: {questionText}</p>
          )}
          <Input
            label="Titulo"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripcion</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              required
              className={cn(
                'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              )}
              placeholder="Describa el hallazgo..."
            />
          </div>
          <Select
            label="Severidad"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value as FindingSeverity })}
            options={severityOptions}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Accion Correctiva</label>
            <textarea
              value={form.corrective_action || ''}
              onChange={(e) => setForm({ ...form, corrective_action: e.target.value })}
              rows={2}
              className={cn(
                'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm',
                'placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              )}
              placeholder="Accion correctiva sugerida..."
            />
          </div>
          <Input
            label="Fecha Limite"
            type="date"
            value={form.due_date || ''}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isLoading}>
              Guardar Hallazgo
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
