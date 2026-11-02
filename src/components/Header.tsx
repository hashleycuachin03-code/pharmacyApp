import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Command,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { TabType } from '../types/pharmacy';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenMobileNav: () => void;
  onNotification: () => void;
}

const pageDetails: Record<TabType, { group: string; title: string }> = {
  prescriptions: { group: 'Operations', title: 'Prescription Desk' },
  drugs: { group: 'Operations', title: 'Drug Formulary' },
  patients: { group: 'Operations', title: 'Patients' },
  prescribers: { group: 'Operations', title: 'Prescribers' },
  analytics: { group: 'Analytics & insights', title: 'Predictive Analytics' },
  anomalies: { group: 'Analytics & insights', title: 'Anomaly Insights' },
  explore: { group: 'Explore', title: 'Quick search' },
};

const searchablePages: Array<{ id: TabType; title: string; group: string }> = [
  { id: 'prescriptions', title: 'Prescription Desk', group: 'Operations' },
  { id: 'drugs', title: 'Drug Formulary', group: 'Operations' },
  { id: 'patients', title: 'Patients', group: 'Operations' },
  { id: 'prescribers', title: 'Prescribers', group: 'Operations' },
  { id: 'analytics', title: 'Predictive Analytics', group: 'Analytics & insights' },
  { id: 'anomalies', title: 'Anomaly Insights', group: 'Analytics & insights' },
  { id: 'explore', title: 'Quick search', group: 'Explore' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileNav,
  onNotification,
}) => {
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const page = pageDetails[activeTab];
  const matchingPages = searchablePages.filter((item) =>
    `${item.title} ${item.group}`.toLowerCase().includes(query.trim().toLowerCase())
  );
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }

      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setQuery('');
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !searchContainerRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('keydown', handleShortcut);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    setIsSearchOpen(false);
    setQuery('');
    searchInputRef.current?.blur();
  };

  return (
    <header className="context-header">
      <div className="context-heading">
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="context-breadcrumb">
            <span>{page.group}</span>
            <span aria-hidden="true">/</span>
            <strong>{page.title}</strong>
          </div>
          <h1 className="context-title">{page.title}</h1>
        </div>
      </div>

      <div className="context-actions">
        <div className="global-search-wrap" ref={searchContainerRef}>
          <div className={`global-search ${isSearchOpen ? 'is-focused' : ''}`}>
            <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && matchingPages[0]) {
                  navigateTo(matchingPages[0].id);
                }
              }}
              aria-label="Search dashboard pages"
              aria-expanded={isSearchOpen}
              aria-controls="global-search-results"
              placeholder="Search pages..."
            />
            <kbd><Command aria-hidden="true" className="h-3 w-3" /> K</kbd>
          </div>
          {isSearchOpen && (
            <div id="global-search-results" className="global-search-results" role="listbox" aria-label="Dashboard pages">
              <p className="search-results-label">{query ? 'Matching pages' : 'Quick navigation'}</p>
              {matchingPages.length > 0 ? matchingPages.map((item) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={activeTab === item.id}
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className="global-search-result"
                >
                  <span>{item.title}</span>
                  <small>{item.group}</small>
                </button>
              )) : (
                <p className="search-empty">No pages match “{query}”.</p>
              )}
            </div>
          )}
        </div>

        <button type="button" className="header-icon-button notification-button" aria-label="Notifications" onClick={onNotification}>
          <Bell aria-hidden="true" className="h-[18px] w-[18px]" />
        </button>

        {isSearchOpen && (
          <button
            type="button"
            className="global-search-close"
            onClick={() => {
              setIsSearchOpen(false);
              setQuery('');
            }}
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};
