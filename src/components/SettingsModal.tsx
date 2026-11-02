import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Database,
  Download,
  Monitor,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  X,
} from 'lucide-react';
import { DimDrug, DimPatient, DimPrescriber, FactPrescription } from '../types/pharmacy';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  dataSource: 'supabase' | 'cache';
  isLoading: boolean;
  onSync: () => void;
  drugs: DimDrug[];
  patients: DimPatient[];
  prescribers: DimPrescriber[];
  prescriptions: FactPrescription[];
}

type SettingsTab = 'appearance' | 'database' | 'account';

const csvCell = (value: string | number | null | undefined) => {
  const text = String(value ?? '');
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename: string, rows: Array<Array<string | number | null | undefined>>) => {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  themePreference,
  onThemeChange,
  dataSource,
  isLoading,
  onSync,
  drugs,
  patients,
  prescribers,
  prescriptions,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const exportSnapshot = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      medications: drugs,
      patients,
      prescribers,
      prescriptions,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pharmapulse-data-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="settings-heading">
          <div>
            <p className="settings-eyebrow">Workspace preferences</p>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button type="button" className="settings-close" aria-label="Close settings" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="settings-layout">
          <nav className="settings-tabs" aria-label="Settings sections">
            <button type="button" className={activeTab === 'appearance' ? 'is-active' : ''} onClick={() => setActiveTab('appearance')}>
              <Monitor className="h-4 w-4" /> Appearance
            </button>
            <button type="button" className={activeTab === 'database' ? 'is-active' : ''} onClick={() => setActiveTab('database')}>
              <Database className="h-4 w-4" /> Database &amp; sync
            </button>
            <button type="button" className={activeTab === 'account' ? 'is-active' : ''} onClick={() => setActiveTab('account')}>
              <Shield className="h-4 w-4" /> Account &amp; security
            </button>
          </nav>

          <div className="settings-content">
            {activeTab === 'appearance' && (
              <section aria-labelledby="appearance-heading">
                <h3 id="appearance-heading">Appearance</h3>
                <p className="settings-description">Choose how PharmaPulse looks on this device.</p>
                <div className="theme-options" role="radiogroup" aria-label="Color theme">
                  {([
                    { value: 'system', label: 'System', Icon: Monitor },
                    { value: 'light', label: 'Light', Icon: Sun },
                    { value: 'dark', label: 'Dark', Icon: Moon },
                  ] as const).map(({ value, label, Icon }) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={themePreference === value}
                      key={value}
                      className={`theme-option ${themePreference === value ? 'is-selected' : ''}`}
                      onClick={() => onThemeChange(value)}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                      <span>{label}</span>
                      {themePreference === value && <Check aria-hidden="true" className="theme-option-check h-4 w-4" />}
                    </button>
                  ))}
                </div>
                <p className="settings-footnote">System follows your device appearance preference.</p>
              </section>
            )}

            {activeTab === 'database' && (
              <section aria-labelledby="database-heading">
                <h3 id="database-heading">Database &amp; sync</h3>
                <p className="settings-description">Connection status and portable workspace data.</p>
                <div className="connection-card">
                  <span className={`connection-dot ${dataSource === 'supabase' ? 'is-live' : 'is-offline'}`} />
                  <div>
                    <strong>{dataSource === 'supabase' ? 'Supabase connected' : 'Local data mode'}</strong>
                    <p>{dataSource === 'supabase' ? 'Data is currently loaded from the connected workspace.' : 'Showing data available in the local session.'}</p>
                  </div>
                  <button type="button" className="settings-sync-button" disabled={isLoading} onClick={onSync}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Syncing' : 'Sync now'}
                  </button>
                </div>
                <div className="settings-export">
                  <h4>Export data</h4>
                  <p className="settings-description">Download a copy of the current workspace data.</p>
                  <div className="export-actions">
                    <button type="button" onClick={exportSnapshot}><Download className="h-4 w-4" />Full JSON export</button>
                    <button type="button" onClick={() => downloadCsv('pharmapulse-medications.csv', [
                      ['Medication ID', 'Name', 'Brand', 'Generic', 'Dosage form', 'Strength'],
                      ...drugs.map((drug) => [drug.drug_id, drug.drug_name, drug.brand_name, drug.generic_name, drug.dosage_form, drug.strength]),
                    ])}><Download className="h-4 w-4" />Medications CSV</button>
                    <button type="button" onClick={() => downloadCsv('pharmapulse-prescriptions.csv', [
                      ['Prescription ID', 'Date', 'Medication ID', 'Patient ID', 'Prescriber ID', 'Quantity', 'Days supply', 'Billed amount', 'Insurance covered', 'Cost'],
                      ...prescriptions.map((rx) => [rx.prescription_fact_id, rx.dim_date?.full_date, rx.drug_id, rx.patient_id, rx.prescriber_id, rx.quantity_dispensed, rx.days_supply, rx.total_amount, rx.insurance_covered, rx.total_cost]),
                    ])}><Download className="h-4 w-4" />Prescriptions CSV</button>
                    <button type="button" onClick={() => downloadCsv('pharmapulse-patients.csv', [
                      ['Patient ID', 'First name', 'Last name', 'Date of birth', 'Gender', 'Address'],
                      ...patients.map((patient) => [patient.patient_id, patient.first_name, patient.last_name, patient.dob, patient.gender, patient.address]),
                    ])}><Download className="h-4 w-4" />Patients CSV</button>
                    <button type="button" onClick={() => downloadCsv('pharmapulse-prescribers.csv', [
                      ['Prescriber ID', 'First name', 'Last name', 'NPI', 'Specialty'],
                      ...prescribers.map((prescriber) => [prescriber.prescriber_id, prescriber.first_name, prescriber.last_name, prescriber.npi_number, prescriber.specialty]),
                    ])}><Download className="h-4 w-4" />Prescribers CSV</button>
                  </div>
                  <p className="settings-footnote">Exports are saved to your device and may include sensitive patient or prescription information. Store them securely.</p>
                </div>
              </section>
            )}

            {activeTab === 'account' && (
              <section aria-labelledby="account-heading">
                <h3 id="account-heading">Account &amp; security</h3>
                <p className="settings-description">Identity and access information for this workspace.</p>
                <div className="account-card">
                  <div className="sidebar-avatar" aria-hidden="true">PP</div>
                  <div>
                    <strong>PharmaPulse user</strong>
                    <p>Local workspace session</p>
                  </div>
                </div>
                <dl className="account-details">
                  <div><dt>Permission level</dt><dd>Not configured</dd></div>
                  <div><dt>Authentication</dt><dd>Managed by workspace configuration</dd></div>
                </dl>
                <p className="settings-footnote">Account details are not available in the current app session.</p>
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
