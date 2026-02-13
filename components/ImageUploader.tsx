import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onFilesUploaded: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesUploaded }) => {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList) => {
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      onFilesUploaded(files);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFiles(event.target.files);
      // Reset the input so the same file can be selected again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  return (
    <label
      htmlFor="file-upload"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`mt-4 relative block w-full rounded-lg border-2 border-dashed border-[var(--border-primary)] p-8 text-center hover:border-[var(--brand-primary)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-app)] transition-colors duration-200 cursor-pointer ${isDragging ? 'border-[var(--brand-primary)] bg-[var(--bg-card)]/50' : ''}`}
    >
      <UploadIcon className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
      <span className="mt-2 block text-sm font-semibold text-[var(--text-tertiary)]">
        {t('setup_step1_dropzone')}
      </span>
      <input 
        ref={fileInputRef} 
        id="file-upload" 
        type="file" 
        className="sr-only" 
        accept="image/*" 
        multiple 
        onChange={handleFileChange}
      />
    </label>
  );
};
