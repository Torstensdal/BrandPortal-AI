import React, { useState, useEffect, useMemo } from 'react';
import { Company, Partner, AppCalendarEvent } from '../types';
import { Calendar } from './Calendar';
import { WeekView } from './WeekView';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { CalendarIcon } from './icons/CalendarIcon';

export const CalendarScreen = ({ company, token, onUpdateCompany }: any) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-1">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Publiceringsplan</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
                        <button onClick={() => setViewMode('month')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'month' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}>
                            <CalendarIcon className="h-4 w-4" /> Måned
                        </button>
                        <button onClick={() => setViewMode('week')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}>
                            <ListBulletIcon className="h-4 w-4" /> Uge
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'month' ? (
                <Calendar currentDate={currentDate} setCurrentDate={setCurrentDate} events={company.events || []} company={company} onDayClick={() => {}} onSelectEvent={() => {}} onUpdateEventDate={() => {}} activePartner={null} campaigns={[]} />
            ) : (
                <WeekView currentDate={currentDate} events={company.events || []} company={company} onDayClick={() => {}} onSelectEvent={() => {}} onUpdateEventDate={() => {}} activePartner={null} />
            )}
        </div>
    );
};