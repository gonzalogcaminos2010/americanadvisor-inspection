'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface OptionListEditorProps {
  options: string[];
  failValues: string[];
  onOptionsChange: (options: string[]) => void;
  onFailValuesChange: (failValues: string[]) => void;
}

export function OptionListEditor({
  options,
  failValues,
  onOptionsChange,
  onFailValuesChange,
}: OptionListEditorProps) {
  const handleOptionChange = (index: number, value: string) => {
    const oldOption = options[index];
    const next = [...options];
    next[index] = value;
    onOptionsChange(next);

    // Update fail values if the renamed option was a fail value
    if (failValues.includes(oldOption)) {
      onFailValuesChange(
        failValues.map((fv) => (fv === oldOption ? value : fv))
      );
    }
  };

  const handleAdd = () => {
    onOptionsChange([...options, '']);
  };

  const handleRemove = (index: number) => {
    const removed = options[index];
    onOptionsChange(options.filter((_, i) => i !== index));
    if (failValues.includes(removed)) {
      onFailValuesChange(failValues.filter((fv) => fv !== removed));
    }
  };

  const toggleFail = (option: string) => {
    if (failValues.includes(option)) {
      onFailValuesChange(failValues.filter((fv) => fv !== option));
    } else {
      onFailValuesChange([...failValues, option]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Opciones</p>
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Opcion ${index + 1}`}
            className="flex-1"
          />
          <label className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
            <input
              type="checkbox"
              checked={failValues.includes(option)}
              onChange={() => toggleFail(option)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Es falla
          </label>
          <button
            type="button"
            onClick={() => handleRemove(index)}
            disabled={options.length <= 2}
            className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={handleAdd}>
        <Plus className="h-4 w-4" />
        Agregar opcion
      </Button>
    </div>
  );
}
