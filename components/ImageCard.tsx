import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface ImageCardProps {
  fileName: string;
  previewUrl: string;
  onRemove: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ fileName, previewUrl, onRemove }) => {
  return (
    <div className="relative aspect-square rounded-md overflow-hidden group shadow bg-[var(--bg-card)]/50">
      <img src={previewUrl} alt={fileName} className="w-full h-full object-contain" />
      <button 
        onClick={onRemove} 
        className="absolute top-1 right-1 p-0.5 bg-[var(--bg-transparent-dark)] text-[var(--text-primary)] rounded-full opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-transparent-medium)] transition-opacity"
        aria-label={`Remove ${fileName}`}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
