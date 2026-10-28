import React, { useState, useEffect, useCallback } from 'react';
import { 
  DimDrug, 
  DimPatient, 
  DimPrescriber, 
  DimPharmacy, 
  FactPrescription, 
  TabType 
} from './types/pharmacy';
import { 
  fetchDimensions, 
  fetchPrescriptions, 
  addDrug, 
  addPatient, 
  addPrescriber, 
  dispensePrescription 
} from './services/supabase';
import { Header } from './components/Header';
import { KpiMetrics } from './components/KpiMetrics';
import { AnalyticsView } from './components/AnalyticsView';
import { PrescriptionDesk } from './components/PrescriptionDesk';
import { DrugFormulary } from './components/DrugFormulary';
import { PatientDirectory } from './components/PatientDirectory';
import { PrescriberDirectory } from './components/PrescriberDirectory';
import { PharmacyExplorer } from './components/PharmacyExplorer';
import { DispenseModal } from './components/DispenseModal';
import { PrintableSlip } from './components/PrintableSlip';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [drugs, setDrugs] = useState<DimDrug[]>([]);
  const [patients, setPatients] = useState<DimPatient[]>([]);
  const [prescribers, setPrescribers] = useState<DimPrescriber[]>([]);
  const [pharmacies, setPharmacies] = useState<DimPharmacy[]>([]);
  const [prescriptions, setPrescriptions] = useState<FactPrescription[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'cache'>('cache');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.localStorage.getItem('bupc-theme') === 'dark'
  );

  // Modals
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [slipPrescription, setSlipPrescription] = useState<FactPrescription | null>(null);

  // KPI numbers derived from AnalyticsView
  const [projected30DayUnits, setProjected30DayUnits] = useState(0);
  const [projected30DayCost, setProjected30DayCost] = useState(0);
  const handleUpdateMetrics = useCallback((units: number, cost: number) => {
    setProjected30DayUnits(units);
    setProjected30DayCost(cost);
  }, []);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dimResult, factResult] = await Promise.all([
        fetchDimensions(),
        fetchPrescriptions(),
      ]);

      setDrugs(dimResult.drugs);
      setPatients(dimResult.patients);
      setPrescribers(dimResult.prescribers);
      setPharmacies(dimResult.pharmacies);
      setPrescriptions(factResult.data);
      setDataSource(dimResult.source === 'supabase' && factResult.source === 'supabase' ? 'supabase' : 'cache');
    } catch (err) {
      console.error("Failed to load pharmacy data:", err);
      showToast("Notice: Using local offline clinic cache for data operations.", "info");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('bupc-theme', theme);
  }, [isDarkMode]);

  // Handlers for dimension creation
  const handleAddDrug = async (payload: Omit<DimDrug, 'drug_id'>) => {
    try {
      const created = await addDrug(payload);
      setDrugs((prev) => [created, ...prev]);
      showToast(`Drug "${created.drug_name}" registered successfully.`);
    } catch (err: any) {
      showToast(`Failed to register drug: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleAddPatient = async (payload: Omit<DimPatient, 'patient_id'>) => {
    try {
      const created = await addPatient(payload);
      setPatients((prev) => [created, ...prev]);
      showToast(`Patient "${created.first_name} ${created.last_name || ''}" registered.`);
    } catch (err: any) {
      showToast(`Failed to register patient: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleAddPrescriber = async (payload: Omit<DimPrescriber, 'prescriber_id'>) => {
    try {
      const created = await addPrescriber(payload);
      setPrescribers((prev) => [created, ...prev]);
      showToast(`Prescriber Dr. ${created.first_name || ''} ${created.last_name || ''} registered.`);
    } catch (err: any) {
      showToast(`Failed to register prescriber: ${err.message}`, 'error');
      throw err;
    }
  };

  const handleDispense = async (payload: {
    patient_id: number;
    prescriber_id: number;
    drug_id: number;
    pharmacy_id: number;
    quantity_dispensed: number;
    days_supply: number;
    total_amount: number;
    insurance_covered: number;
    total_cost: number;
  }) => {
    try {
      const newRx = await dispensePrescription(payload);
      setPrescriptions((prev) => [newRx, ...prev]);
      showToast(`Prescription #${newRx.prescription_fact_id} recorded & dispensed.`);
      // Optionally open slip
      setSlipPrescription(newRx);
    } catch (err: any) {
      showToast(`Dispensation failed: ${err.message}`, 'error');
      throw err;
    }
  };

  return (
    <div className="app-canvas min-h-screen flex flex-col antialiased">
      {/* Toast Alert */}
      {toast && (
        <div role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'} aria-atomic="true" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold bg-white animate-in slide-in-from-bottom-5 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
          <span className="text-slate-800">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataSource={dataSource}
        onReload={loadAllData}
        isLoading={isLoading}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((darkMode) => !darkMode)}
      />

      {/* Metric KPI Bar */}
      <KpiMetrics
        totalRx={prescriptions.length}
        projected30DayUnits={projected30DayUnits}
        projected30DayCost={projected30DayCost}
        drugCount={drugs.length}
      />

      {/* Main View Area */}
      <main id="main-content" aria-label="Pharmacy management dashboard" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* VIEW 0: PREDICTIVE ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            prescriptions={prescriptions}
            drugs={drugs}
            isDarkMode={isDarkMode}
            onRefresh={loadAllData}
            onUpdateMetrics={handleUpdateMetrics}
          />
        )}

        {/* VIEW 1: PRESCRIPTION DESK */}
        {activeTab === 'prescriptions' && (
          <PrescriptionDesk
            prescriptions={prescriptions}
            onOpenDispenseModal={() => setIsDispenseModalOpen(true)}
            onOpenSlipModal={(rx) => setSlipPrescription(rx)}
          />
        )}

        {activeTab === 'explore' && (
          <PharmacyExplorer
            prescriptions={prescriptions}
            drugs={drugs}
            prescribers={prescribers}
            isDarkMode={isDarkMode}
          />
        )}

        {/* VIEW 2: DRUG FORMULARY */}
        {activeTab === 'drugs' && (
          <DrugFormulary
            drugs={drugs}
            onAddDrug={handleAddDrug}
          />
        )}

        {/* VIEW 3: PATIENT DIRECTORY */}
        {activeTab === 'patients' && (
          <PatientDirectory
            patients={patients}
            onAddPatient={handleAddPatient}
          />
        )}

        {/* VIEW 4: PRESCRIBERS */}
        {activeTab === 'prescribers' && (
          <PrescriberDirectory
            prescribers={prescribers}
            onAddPrescriber={handleAddPrescriber}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
          <p>Pharmacy Operations &amp; Analytics • Prescription Management &amp; Inventory Planning</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dataSource === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{dataSource === 'supabase' ? 'Supabase Live Connected' : 'Local Storage Mode'}</span>
            </span>
            <span>Star Schema (Facts &amp; Dims)</span>
          </div>
        </div>
      </footer>

      {/* Dispense Modal */}
      <DispenseModal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        drugs={drugs}
        patients={patients}
        prescribers={prescribers}
        pharmacies={pharmacies}
        onDispense={handleDispense}
      />

      {/* Printable Prescription Slip Modal */}
      <PrintableSlip
        prescription={slipPrescription}
        onClose={() => setSlipPrescription(null)}
      />
    </div>
  );
}
