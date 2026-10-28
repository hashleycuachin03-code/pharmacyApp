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
  Database,
  Moon,
  Sun,
  Search,
} from 'lucide-react';
import { TabType } from '../types/pharmacy';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dataSource: 'supabase' | 'cache';
  onReload: () => void;
  isLoading: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  dataSource,
  onReload,
  isLoading,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header className="app-header sticky top-0 z-40 border-b text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {/* Brand / Logo */}
        <div className="flex min-w-0 flex-1 items-center space-x-3 md:flex-none">
          <div className="brand-mark w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-[11px] sm:text-base tracking-wide uppercase text-white flex items-center gap-2">
              PHARMAPULSE
              <span className="hidden sm:inline bg-teal-300/15 text-teal-200 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                ANALYTICS
              </span>
            </h1>
            <p className="hidden sm:block text-xs text-slate-400">Real-time pharmacy insights</p>
          </div>
        </div>

        {/* Database Status & Reload */}
        <div className="app-header-controls order-2 ml-auto flex shrink-0 items-center gap-2 md:order-none md:ml-0">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'explore' ? 'analytics' : 'explore')}
            aria-label={activeTab === 'explore' ? 'Close pharmacy search' : 'Open pharmacy search'}
            aria-expanded={activeTab === 'explore'}
            aria-controls="main-content"
            title="Ask & Explore"
            className={`app-header-control search-toggle flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              activeTab === 'explore' ? 'is-active' : ''
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Current theme: ${isDarkMode ? 'dark' : 'light'} mode. Switch to ${isDarkMode ? 'light' : 'dark'} mode.`}
            className="app-header-control flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-lg transition"
          >
            {isDarkMode ? <Moon className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <button
            type="button"
            onClick={onReload}
            disabled={isLoading}
            title="Sync with Supabase"
            className="app-header-control hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>{dataSource === 'supabase' ? 'Cloud Supabase' : 'Offline Mode'}</span>
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Primary navigation" className="order-3 flex min-w-0 basis-full items-center gap-2 overflow-x-auto py-1 md:order-none md:basis-auto">
          <div role="group" aria-label="Daily workflow" className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('prescriptions')}
            aria-current={activeTab === 'prescriptions' ? 'page' : undefined}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'prescriptions'
                ? 'font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prescription Desk</span>
            <span className="sm:hidden">Prescriptions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drugs')}
            aria-current={activeTab === 'drugs' ? 'page' : undefined}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'drugs'
                ? 'font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Drug Formulary</span>
            <span className="sm:hidden">Drugs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            aria-current={activeTab === 'patients' ? 'page' : undefined}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'patients'
                ? 'font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Patients</span>
            <span className="sm:hidden">Patients</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prescribers')}
            aria-current={activeTab === 'prescribers' ? 'page' : undefined}
            className={`tab-btn px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'prescribers'
                ? 'font-bold shadow'
                : 'font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prescribers</span>
            <span className="sm:hidden">Doctors</span>
          </button>
          </div>
          <span aria-hidden="true" className="nav-divider mx-1 h-7 shrink-0 border-l" />
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
            className={`analytics-tab px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'analytics' ? 'is-active' : ''
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Predictive Analytics</span>
            <span className="sm:hidden">Analytics</span>
            <span className="analytics-badge hidden lg:inline-flex">INSIGHTS</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
