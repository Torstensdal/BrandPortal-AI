
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

export const resizeImageAndGetBase64 = (file: File, maxSize: number = 1024): Promise<{base64: string, mimeType: string} | null> => {
  if (typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined') {
    return new Promise<{base64: string, mimeType: string} | null>((resolve) => {
      const workerCode = `
        self.onmessage = async (e) => {
          const { file, maxSize } = e.data;
          try {
            const bitmap = await createImageBitmap(file);
            let { width, height } = bitmap;
            if (width > height) {
              if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
              }
            }
            width = Math.round(width);
            height = Math.round(height);
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                self.postMessage({ error: 'Could not get OffscreenCanvas context' });
                return;
            }
            ctx.drawImage(bitmap, 0, 0, width, height);
            const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.75 });
            self.postMessage({ blob });
          } catch (error) {
            self.postMessage({ error: 'Failed to process image in worker: ' + (error instanceof Error ? error.message : String(error)) });
          }
        };
      `;
      const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      const worker = new Worker(workerUrl);
      const cleanup = () => {
          URL.revokeObjectURL(workerUrl);
          worker.terminate();
      };
      worker.onmessage = (e) => {
        cleanup();
        if (e.data.error) {
          resolve(null);
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64String = dataUrl.split(',')[1];
            resolve({ base64: base64String, mimeType: 'image/jpeg' });
          };
          reader.readAsDataURL(e.data.blob);
        }
      };
      worker.onerror = (e) => {
        cleanup();
        resolve(null);
      };
      worker.postMessage({ file, maxSize });
    });
  } else {
    return Promise.resolve(null);
  }
};

export const sanitizeFilename = (prompt: string): string => {
    if (!prompt) return `generated_image`;
    return prompt.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').substring(0, 50) || `generated_image`;
};

/**
 * Forsøger at konvertere et billede til en Data-URL.
 * Håndterer CORS problematikker ved at bruge absolutte URL'er og fetch.
 */
const resolveImageToDataUrl = async (img: HTMLImageElement): Promise<string | null> => {
    try {
        if (!img.src) return null;
        if (img.src.startsWith('data:')) return img.src;

        // Brug altid absolut URL for at undgå DNS-mangling i sandboxed miljøer
        const absoluteUrl = new URL(img.src, window.location.href).href;

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 100;
        canvas.height = img.naturalHeight || img.height || 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        try {
            // Prøv direkte tegning (virker hvis samme origin eller korrekt CORS header)
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL('image/png');
        } catch (canvasError) {
            // Hvis det fejler (CORS), prøv fetch med absolut URL
            if (absoluteUrl.startsWith('http')) {
                const response = await fetch(absoluteUrl);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }
            return null;
        }
    } catch (e) {
        console.warn("Could not resolve image for PDF baking", e);
        return null;
    }
};

export const printElementAsPdf = async (element: HTMLElement | null, documentTitle: string = 'Vækstplan') => {
    if (!element) return;

    // Vi arbejder på en klon for at bage billeder ind
    const clone = element.cloneNode(true) as HTMLElement;
    const originalImages = Array.from(element.getElementsByTagName('img'));
    const clonedImages = Array.from(clone.getElementsByTagName('img'));

    const bakePromises = originalImages.map(async (origImg, i) => {
        const clonedImg = clonedImages[i];
        if (!clonedImg) return;
        
        // Vent på indlæsning
        if (!origImg.complete) {
            await new Promise((resolve) => {
                origImg.onload = resolve;
                origImg.onerror = resolve;
            });
        }

        const bakedSrc = await resolveImageToDataUrl(origImg);
        if (bakedSrc) {
            clonedImg.src = bakedSrc;
        } else {
            // Hvis vi ikke kan bage billedet, fjerner vi det for at undgå DNS fejl
            clonedImg.style.display = 'none';
        }
    });

    await Promise.all(bakePromises);

    const printWindow = window.open('', '_blank', 'height=1000,width=1200');
    if (!printWindow) {
        alert('Kunne ikke åbne print-vindue. Tjek venligst din popup-blocker.');
        return;
    }

    // Byg en komplet HTML streng for at undgå relative referencer og DNS fejl
    let headHtml = `<title>${documentTitle}</title>`;
    
    // Inline alle styles
    const styleElements = Array.from(document.querySelectorAll('style'));
    styleElements.forEach(style => {
        headHtml += style.outerHTML;
    });

    // Inkluder eksterne Google Fonts direkte (vi antager de er globale)
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    links.forEach(link => {
        const href = (link as HTMLLinkElement).href;
        if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) {
            headHtml += `<link rel="stylesheet" href="${href}">`;
        }
    });

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${headHtml}
            <style>
                @page { size: A4 portrait; margin: 0; }
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background-color: white !important;
                    color: #0B1D39 !important;
                    margin: 0; padding: 0;
                    width: 210mm;
                    font-family: 'Inter', sans-serif !important;
                }
                .pdf-wrapper { width: 210mm; margin: 0 auto; }
                #section-cover {
                    width: 210mm !important;
                    height: 297mm !important; 
                    page-break-after: always;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: center !important;
                    background-color: #0B1D39 !important;
                    color: white !important;
                    box-sizing: border-box !important;
                }
                #section-cover h1 { font-size: 48pt !important; text-align: center !important; color: white !important; }
                .section-container { margin: 10mm 0 !important; padding: 10mm 0 !important; page-break-inside: avoid; position: relative; }
                h2 { font-size: 18pt !important; border-bottom: 2pt solid #f1f5f9 !important; text-transform: uppercase !important; }
                table { width: 100% !important; border-collapse: collapse !important; border: 0.5pt solid #e2e8f0 !important; margin: 8mm 0 !important; }
                th, td { padding: 4mm !important; border: 0.5pt solid #e2e8f0 !important; text-align: left; }
                .no-print { display: none !important; }
                .print-break-before { page-break-before: always !important; }
            </style>
        </head>
        <body>
            <div class="pdf-wrapper">
                ${clone.outerHTML}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.focus();
                        window.print();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
};