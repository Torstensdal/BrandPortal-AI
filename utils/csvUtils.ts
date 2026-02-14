
import { Partner } from '../types';

const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }
    const stringField = String(field);
    // If the field contains a comma, a quote, or a newline, wrap it in double quotes
    if (/[",\n]/.test(stringField)) {
        // Also, double up any existing double quotes
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const exportPartnersToCsv = (partners: Partner[]): void => {
    if (partners.length === 0) {
        alert('No partners to export.');
        return;
    }

    const partnerHeaders = [
        'partner_id', 'partner_name', 'partner_website', 'partner_description', 'partner_language', 
        'partner_status', 'partner_role', 'partner_themeColor', 'partner_logoUrl', 
        'partner_socials_linkedin', 'partner_socials_facebook', 'partner_socials_instagram', 'partner_socials_tiktok', 'partner_socials_x'
    ];

    const contactHeaders = [
        'contact_id', 'contact_name', 'contact_role', 'contact_email', 'contact_linkedin'
    ];
    
    const headers = [...partnerHeaders, ...contactHeaders];

    const dataRows: string[][] = [];

    partners.forEach(partner => {
        const partnerData = [
            partner.id,
            partner.name,
            partner.website || '',
            partner.description || '',
            partner.language,
            partner.status,
            partner.role || '',
            partner.themeColor || '',
            partner.logoUrl || '',
            partner.socials?.linkedin || '',
            partner.socials?.facebook || '',
            partner.socials?.instagram || '',
            partner.socials?.tiktok || '',
            partner.socials?.x || '',
        ];

        if (partner.contacts && partner.contacts.length > 0) {
            partner.contacts.forEach(contact => {
                const contactData = [
                    contact.id,
                    contact.name,
                    contact.role,
                    contact.email || '',
                    contact.linkedin || '',
                ];
                dataRows.push([...partnerData, ...contactData]);
            });
        } else {
            // If no contacts, add one row for the partner with empty contact fields
            const emptyContactData = Array(contactHeaders.length).fill('');
            dataRows.push([...partnerData, ...emptyContactData]);
        }
    });

    const csvRows = dataRows.map(row => row.map(escapeCsvField).join(','));

    const csvContent = [
        headers.join(','),
        ...csvRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partners_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};