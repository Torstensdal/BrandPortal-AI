
import {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    ImageRun,
    AlignmentType,
    PageNumber,
    Header,
    Footer,
    VerticalAlign
} from 'docx';
import { ProspectProposal } from '../types';
import * as assetStorage from './assetStorage';

const cleanText = (text: string | undefined | null): string => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').replace(/__/g, '').replace(/#/g, '');
};

const createStyledTableCell = (text: string, isHeader = false, bgColor = "FFFFFF") => {
    return new TableCell({
        children: [
            new Paragraph({
                children: [
                    new TextRun({
                        text: cleanText(text),
                        bold: isHeader,
                        color: isHeader ? "FFFFFF" : "334155",
                        size: isHeader ? 20 : 18,
                    }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 120, after: 120 },
            }),
        ],
        shading: isHeader ? { fill: bgColor } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
    });
};

const fetchImage = async (url: string | undefined): Promise<{buffer: ArrayBuffer, width: number, height: number} | undefined> => {
    if (!url) return undefined;
    
    const getImageData = (source: string): Promise<{buffer: ArrayBuffer, width: number, height: number}> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; 
            const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);

            img.onload = () => {
                clearTimeout(timeout);
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context not available'));
                
                try {
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async (blob) => {
                        if (!blob) return reject(new Error('Canvas to Blob failed'));
                        const buffer = await blob.arrayBuffer();
                        resolve({ buffer, width: img.width, height: img.height });
                    }, 'image/png');
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Image loading failed for ${source}`));
            };
            img.src = source;
        });
    };

    if (url.startsWith('data:')) return await getImageData(url);
    
    if (url.startsWith('asset:')) {
        const assetId = url.substring(6);
        const file = await assetStorage.getAsset(assetId);
        if (file) {
            const objectURL = URL.createObjectURL(file);
            try { return await getImageData(objectURL); } finally { URL.revokeObjectURL(objectURL); }
        }
    }
    return undefined;
};

export const generateProposalDoc = async (proposal: ProspectProposal): Promise<Blob> => {
    const brandColor = (proposal.brandColors?.primary || "#6366f1").replace('#', '');
    const logoData = await fetchImage(proposal.prospectLogoUrl);
    
    const children: (Paragraph | Table)[] = [];

    // --- FORSIDE ---
    children.push(new Paragraph({ text: "", spacing: { before: 1000 } }));
    if (logoData) {
        children.push(new Paragraph({
            children: [new ImageRun({ data: logoData.buffer, transformation: { width: 100, height: 100 } })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }));
    }
    
    children.push(new Paragraph({
        children: [
            new TextRun({
                text: proposal.name.toUpperCase(),
                bold: true,
                size: 64,
                color: brandColor,
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
    }));

    children.push(new Paragraph({
        children: [
            new TextRun({
                text: `STRATEGISK VÆKSTPLAN FOR ${proposal.prospectName.toUpperCase()}`,
                size: 20,
                color: "64748b",
            })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 2000 }
    }));

    // --- INDHOLD ---
    children.push(new Paragraph({ text: proposal.introduction.title, heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
    children.push(new Paragraph({ children: [new TextRun({ text: cleanText(proposal.introduction.executiveSummary), size: 22 })], spacing: { before: 200, after: 400 } }));

    // SWOT Tabel
    if (proposal.businessPairs?.swot) {
        const swot = proposal.businessPairs.swot;
        children.push(new Paragraph({ text: "Strategisk SWOT Analyse", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
        
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        createStyledTableCell("Styrker", true, brandColor),
                        createStyledTableCell("Svagheder", true, brandColor)
                    ]
                }),
                new TableRow({
                    children: [
                        createStyledTableCell(swot.strengths.join('\n• '), false),
                        createStyledTableCell(swot.weaknesses.join('\n• '), false)
                    ]
                }),
                new TableRow({
                    children: [
                        createStyledTableCell("Muligheder", true, brandColor),
                        createStyledTableCell("Trusler", true, brandColor)
                    ]
                }),
                new TableRow({
                    children: [
                        createStyledTableCell(swot.opportunities.join('\n• '), false),
                        createStyledTableCell(swot.threats.join('\n• '), false)
                    ]
                })
            ]
        }));
    }

    // KPI Tabel
    if (proposal.businessPairs?.kpis && proposal.businessPairs.kpis.length > 0) {
        children.push(new Paragraph({ text: "Målsætninger & KPI'er", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        createStyledTableCell("KPI Navn", true, brandColor),
                        createStyledTableCell("Baseline", true, brandColor),
                        createStyledTableCell("Target", true, brandColor)
                    ]
                }),
                ...proposal.businessPairs.kpis.map(kpi => new TableRow({
                    children: [
                        createStyledTableCell(kpi.name, false),
                        createStyledTableCell(kpi.baseline || "-", false),
                        createStyledTableCell(kpi.target, false)
                    ]
                }))
            ]
        }));
    }

    // Dynamiske Sektioner (De 21 trin)
    if (proposal.customSections) {
        proposal.customSections.forEach(section => {
            children.push(new Paragraph({ 
                text: section.title, 
                heading: HeadingLevel.HEADING_1, 
                spacing: { before: 400, after: 200 },
                pageBreakBefore: proposal.pageBreaks?.includes(section.id)
            }));
            
            const bodyParagraphs = section.body.split('\n').filter(p => p.trim() !== '').map(p => {
                return new Paragraph({
                    children: [new TextRun({ text: cleanText(p), size: 20 })],
                    spacing: { after: 150 }
                });
            });
            children.push(...bodyParagraphs);
        });
    }

    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    run: { size: 32, bold: true, color: brandColor },
                    paragraph: { spacing: { before: 400, after: 200 } }
                }
            ]
        },
        sections: [{
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [ new TextRun({ text: `${proposal.prospectName} // Vækstplan`, size: 16, color: "94a3b8" }) ],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [ new TextRun({ children: ["Side ", PageNumber.CURRENT, " af ", PageNumber.TOTAL_PAGES], size: 16, color: "94a3b8" }) ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
            },
            children: children,
        }],
    });
    
    return Packer.toBlob(doc);
};
