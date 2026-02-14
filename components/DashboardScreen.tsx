import React from 'react';
import { Company, AppState } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { UsersIcon } from './icons/UsersIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';

export const DashboardScreen = ({ company, onNavigate }: any) => {
  const { t } = useLanguage();
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Velkommen, {company.name}</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Her er din status</p>
          </div>
          <button onClick={() => onNavigate('onboarding_plan')} className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-xl hover:brightness-110 flex items-center gap-3"><RocketLaunchIcon className="h-4 w-4" /> Vækstplan</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 cursor-pointer" onClick={() => onNavigate('partners')}>
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><UsersIcon className="h-8 w-8" /></div>
              <div><p className="text-3xl font-black text-slate-900 leading-none mb-1">{company.partners?.length || 0}</p><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aktive partnere</p></div>
          </div>
          <div className="bg-white border p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 cursor-pointer" onClick={() => onNavigate('media_library')}>
              <div className="p-4 bg-teal-50 rounded-2xl text-teal-600"><PhotoIcon className="h-8 w-8" /></div>
              <div><p className="text-3xl font-black text-slate-900 leading-none mb-1">{company.mediaLibrary?.length || 0}</p><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filer i arkiv</p></div>
          </div>
          <div className="bg-white border p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 cursor-pointer" onClick={() => onNavigate('analytics')}>
              <div className="p-4 bg-purple-50 rounded-2xl text-purple-600"><ChartBarIcon className="h-8 w-8" /></div>
              <div><p className="text-3xl font-black text-slate-900 leading-none mb-1">84k</p><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reach</p></div>
          </div>
      </div>
    </div>
  );
};