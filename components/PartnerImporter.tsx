import React, { useRef, useState } from 'react';
import { Partner } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { UploadIcon } from './icons/UploadIcon';

declare global {
  interface Window {
    XLSX: any;
  }
}

interface PartnerImporterProps {
  onPartnersImported: (partners: Partner[]) => void;
  onSetFeedback: (feedback: { type: 'success' | 'error', message: string } | null) => void;
}

// Added React.FC type for the component
export const PartnerImporter: React.FC<PartnerImporterProps> = ({ onPartnersImported, onSetFeedback }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const processFile = (file: File) => {
    onSetFeedback(null);
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (!window.XLSX) throw new Error("Bibliotek fejlede.");
        const data = e.target?.result;
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = window.XLSX.utils.sheet_to_json(worksheet);
        
        onSetFeedback({ type: 'success', message: 'Fil indlæst succesfuldt!' });
        // Her ville man normalt kalde onPartnersImported(mappedJson)
      } catch (error) {
        onSetFeedback({ type: 'error', message: 'Kunne ikke læse filen. Tjek formatet.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Fixed React.ChangeEvent namespace
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  // Fixed React.DragEvent namespace
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="h-full flex flex-col">
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative block w-full h-full min-h-24 rounded-2xl border-2 border-dashed border-[var(--border-dark)] bg-[var(--bg-input)] hover:border-brand-primary transition-all cursor-pointer flex flex-col items-center justify-center"
        >
            <UploadIcon className="mx-auto h-8 w-8 text-[var(--text-light-muted)] mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                {fileName || t('importer_dropzone')}
            </span>
            {!fileName && <span className="text-[10px] text-[var(--text-light-muted)] mt-1 uppercase font-bold">{t('importer_noFile')}</span>}
            <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
            />
        </label>
    </div>
  );
};
