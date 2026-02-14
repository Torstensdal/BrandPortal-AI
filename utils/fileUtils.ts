
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const fileToBase64 = (file: File, includeMimeType: boolean = false): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            if (includeMimeType) {
                resolve(result);
            } else {
                const base64String = result.split(',')[1];
                resolve(base64String);
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Genererer en visuel forside til en PDF fil.
 */
export const getPdfPreview = async (file: File): Promise<string | null> => {
    const pdfjsLib = (window as any).pdfjsLib || (window as any)['pdfjs-dist/build/pdf'];
    
    if (!pdfjsLib) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                const retryLib = (window as any).pdfjsLib || (window as any)['pdfjs-dist/build/pdf'];
                if (retryLib) {
                    resolve(await generatePdfPreview(retryLib, file));
                } else {
                    resolve(null);
                }
            }, 500);
        });
    }
    
    return generatePdfPreview(pdfjsLib, file);
};

const generatePdfPreview = async (pdfjsLib: any, file: File): Promise<string | null> => {
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return null;
        const desiredWidth = 500;
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        await page.render({ 
            canvasContext: context, 
            viewport: scaledViewport,
            intent: 'display'
        }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        canvas.width = 0;
        canvas.height = 0;
        return dataUrl;
    } catch (error) {
        console.error('Fejl ved generering af PDF forside:', error);
        return null;
    }
};

/**
 * Genererer en professionel PDF fra et HTML-element.
 */
export const exportPdf = async (element: HTMLElement, filename: string = 'dokument.pdf') => {
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Høj opløsning
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(filename);
    } catch (error) {
        console.error('PDF export failed:', error);
        throw error;
    }
};

export const sanitizeFilename = (prompt: string): string => {
    if (!prompt) return `generated_image`;
    return prompt.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').substring(0, 50) || `generated_image`;
};

export const printElementAsPdf = async (element: HTMLElement | null, documentTitle: string = 'Vækstplan') => {
    if (!element) return;
    window.print();
};
