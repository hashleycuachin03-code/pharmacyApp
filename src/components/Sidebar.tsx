import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pill,
  Settings,
  Users,
  Stethoscope,
  RefreshCw,
  Search,
} from 'lucide-react';
import { TabType } from '../types/pharmacy';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  dataSource: 'supabase' | 'cache';
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isLoading: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onSync: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
}

const operations: Array<{ id: TabType; label: string; icon: typeof FileText }> = [
  { id: 'prescriptions', label: 'Prescription Desk', icon: FileText },
  { id: 'drugs', label: 'Drug Formulary', icon: Pill },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'prescribers', label: 'Prescribers', icon: Stethoscope },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  dataSource,
  isCollapsed,
  isMobileOpen,
  isLoading,
  onToggleCollapsed,
  onCloseMobile,
  onSync,
  onOpenSettings,
  onOpenSearch,
}) => {
  const collapsed = isCollapsed && !isMobileOpen;
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.matchMedia('(max-width: 760px)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 760px)');
    const handleViewportChange = (event: MediaQueryListEvent) => setIsMobileViewport(event.matches);
    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  const navigate = (tab: TabType) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const navButton = (tab: TabType, label: string, Icon: typeof FileText) => (
    <button
      key={tab}
      type="button"
      onClick={() => navigate(tab)}
      aria-current={activeTab === tab ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={`sidebar-nav-item ${activeTab === tab ? 'is-active' : ''}`}
    >
      <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
      <span className="sidebar-nav-label">{label}</span>
    </button>
  );

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`app-sidebar ${collapsed ? 'is-collapsed' : ''} ${isMobileOpen ? 'is-mobile-open' : ''}`}
        aria-hidden={isMobileViewport && !isMobileOpen}
        inert={isMobileViewport && !isMobileOpen}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <Activity aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="sidebar-brand-copy">
            <p className="sidebar-brand-title">PharmaPulse</p>
            <p className="sidebar-brand-subtitle">Analytics</p>
          </div>
          <span className={`sidebar-live ${dataSource === 'cache' ? 'is-offline' : ''}`} aria-label={dataSource === 'supabase' ? 'Live data connection' : 'Offline data mode'}>
            <span aria-hidden="true" />{dataSource === 'supabase' ? 'Live' : 'Offline'}
          </span>
          <button
            type="button"
            className="sidebar-collapse-button"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          className={`sidebar-search ${activeTab === 'explore' ? 'is-active' : ''}`}
          onClick={onOpenSearch}
          aria-label="Open quick search"
          aria-current={activeTab === 'explore' ? 'page' : undefined}
          title={collapsed ? 'Quick search' : undefined}
        >
          <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="sidebar-nav-label">Quick search</span>
          {!collapsed && <kbd>⌘ K</kbd>}
        </button>

        <nav className="sidebar-navigation" aria-label="Primary navigation">
          <div className="sidebar-nav-group">
            <p className="sidebar-section-label">Operations</p>
            {operations.map(({ id, label, icon }) => navButton(id, label, icon))}
          </div>
          <div className="sidebar-nav-group">
            <p className="sidebar-section-label">Analytics &amp; insights</p>
            {navButton('analytics', 'Predictive Analytics', Brain)}
            {navButton('anomalies', 'Anomaly Insights', AlertTriangle)}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-footer-action" onClick={onSync} disabled={isLoading} aria-label="Sync data" title={collapsed ? 'Sync data' : undefined}>
            <RefreshCw aria-hidden="true" className={`h-4 w-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sidebar-nav-label">Sync data</span>
          </button>
          <button type="button" className="sidebar-footer-action" onClick={onOpenSettings} aria-label="Settings" title={collapsed ? 'Settings' : undefined}>
            <Settings aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="sidebar-nav-label">Settings</span>
          </button>

          <div className="sidebar-profile">
            <div className="sidebar-avatar" aria-hidden="true">PP</div>
            <div className="sidebar-profile-copy">
              <p>PharmaPulse user</p>
              <span>Role not configured</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
