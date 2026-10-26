import React from 'react';
import { 
  TrendingUp, 
  Brain, 
  FileText, 
  Pill, 
  Users, 
  Stethoscope, 
  Building2,
  RefreshCw,
  Database
} from 'lucide-react';
import { TabType } from '../types/pharmacy';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dataSource: 'supabase' | 'cache';
  onReload: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dataSource,
  onReload,
  isLoading
}) => {
  return (
    <header className="bg-[#0b2545] text-white border-b-4 border-amber-500 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-[#0b2545] flex items-center justify-center font-black text-xl shadow">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-wide uppercase text-white flex items-center gap-2">
              BUPC PHARMACY INFIRMARY
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                AI &amp; DW
              </span>
            </h1>
            <p className="text-xs text-slate-300">Bicol University Polangui Campus</p>
          </div>
        </div>

        {/* Database Status & Reload */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onReload}
            disabled={isLoading}
            title="Sync with Supabase"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>{dataSource === 'supabase' ? 'Cloud Supabase' : 'Offline Mode'}</span>
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-900 font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Predictive Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'prescriptions'
                ? 'bg-amber-500 text-slate-900 font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prescription Desk</span>
            <span className="sm:hidden">Prescriptions</span>
          </button>

          <button
            onClick={() => setActiveTab('drugs')}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'drugs'
                ? 'bg-amber-500 text-slate-900 font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Drug Formulary</span>
            <span className="sm:hidden">Drugs</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'patients'
                ? 'bg-amber-500 text-slate-900 font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Patients</span>
            <span className="sm:hidden">Patients</span>
          </button>

          <button
            onClick={() => setActiveTab('prescribers')}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'prescribers'
                ? 'bg-amber-500 text-slate-900 font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prescribers</span>
            <span className="sm:hidden">Doctors</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
