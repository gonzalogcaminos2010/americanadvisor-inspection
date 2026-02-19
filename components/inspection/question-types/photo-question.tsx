/* eslint-disable @next/next/no-img-element */
'use client';

import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InspectionPhoto } from '@/types';

interface PhotoQuestionProps {
  photos: InspectionPhoto[];
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function PhotoQuestion({ photos, onUpload, isUploading }: PhotoQuestionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        isLoading={isUploading}
        type="button"
      >
        <Camera className="h-4 w-4" />
        Tomar Foto
      </Button>

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-md border border-gray-200">
              <img
                src={photo.file_path}
                alt={photo.caption || photo.file_name}
                className="h-32 w-full object-cover"
              />
              {photo.caption && (
                <p className="truncate px-2 py-1 text-xs text-gray-500">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
