import React, { useState } from 'react';
import { Company, Lead } from '../types';
import { InboxIcon } from './icons/InboxIcon';
import { stripMarkdown } from '../utils/formatters';

export const LeadsScreen = ({ company, onUpdateLeadStatus }: any) => {
    const sortedLeads = (company.leads || []).sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    
    if (sortedLeads.length === 0) return <div className="text-center py-32"><InboxIcon className="h-16 w-16 mx-auto mb-6 opacity-20" /><h3 className="text-xl font-black uppercase tracking-widest">Ingen leads endnu</h3></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Lead Center</h1>
            <p className="text-slate-500 font-medium mb-10">Hold styr på jeres salgsflow.</p>
            <div className="overflow-hidden shadow-2xl border rounded-[3rem] bg-white">
                <table className="min-w-full divide-y">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="py-6 pl-10 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Kunde</th>
                            <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                            <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sortedLeads.map((lead: any) => (
                            <tr key={lead.id} className="hover:bg-slate-50 cursor-pointer">
                                <td className="py-6 pl-10"><div className="font-bold">{stripMarkdown(lead.name)}</div><div className="text-[10px] text-slate-400">{lead.email}</div></td>
                                <td className="px-6 py-6"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase">{lead.status}</span></td>
                                <td className="px-6 py-6 font-black text-indigo-600">{lead.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};