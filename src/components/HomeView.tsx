import React from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  FileText,
  Pill,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { FactPrescription, TabType } from '../types/pharmacy';

interface HomeViewProps {
  prescriptions: FactPrescription[];
  onNavigate: (tab: TabType) => void;
  onNewPrescription: () => void;
}

const shortcuts: Array<{
  tab: TabType;
  title: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    tab: 'drugs',
    title: 'Drug Formulary',
    description: 'Browse and manage medications',
    icon: Pill,
  },
  {
    tab: 'patients',
    title: 'Patients',
    description: 'Open the patient directory',
    icon: Users,
  },
  {
    tab: 'prescribers',
    title: 'Prescribers',
    description: 'View clinician records',
    icon: Stethoscope,
  },
  {
    tab: 'analytics',
    title: 'Predictive Analytics',
    description: 'Review demand and budget forecasts',
    icon: BarChart3,
  },
  {
    tab: 'anomalies',
    title: 'Anomaly Insights',
    description: 'Review unusual dispensing patterns',
    icon: ShieldAlert,
  },
];

const formatDate = (date?: string) => {
  if (!date) return '—';
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? '—'
    : parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount: number) =>
  `₱${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const HomeView: React.FC<HomeViewProps> = ({
  prescriptions,
  onNavigate,
  onNewPrescription,
}) => {
  const recentPrescriptions = [...prescriptions]
    .sort((a, b) => {
      const dateDifference = (Date.parse(b.dim_date?.full_date || '') || 0)
        - (Date.parse(a.dim_date?.full_date || '') || 0);
      return dateDifference || b.prescription_fact_id - a.prescription_fact_id;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              <Activity aria-hidden="true" className="h-4 w-4" />
              Pharmacy operations overview
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Welcome to PharmaPulse
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Manage dispensing workflows and get a clear view of your pharmacy operations.
            </p>
          </div>
          <button
            type="button"
            className="primary-action inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition active:scale-[0.98]"
            onClick={onNewPrescription}
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            Record prescription
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section aria-labelledby="home-shortcuts-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 id="home-shortcuts-title" className="text-base font-bold text-slate-900">Quick access</h3>
            <p className="mt-1 text-sm text-slate-500">Go straight to a workflow or insight.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            onClick={() => onNavigate('prescriptions')}
          >
            Prescription desk <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {shortcuts.map(({ tab, title, description, icon: Icon }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="group flex min-h-28 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm focus-visible:outline-teal-600"
            >
              <span className="rounded-lg bg-teal-50 p-2.5 text-teal-700 transition group-hover:bg-teal-100">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-800">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="home-recent-title">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="home-recent-title" className="text-base font-bold text-slate-900">Recent prescriptions</h3>
            <p className="mt-1 text-sm text-slate-500">Latest records available in your workspace.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('prescriptions')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
          >
            View all <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {recentPrescriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Prescription</th>
                  <th scope="col" className="px-5 py-3">Patient</th>
                  <th scope="col" className="px-5 py-3">Medication</th>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-5 py-3 text-right">Billed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPrescriptions.map((prescription) => (
                  <tr key={prescription.prescription_fact_id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-700">
                      Rx #{prescription.prescription_fact_id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <UserRound aria-hidden="true" className="h-4 w-4 text-slate-400" />
                        {prescription.dim_patient
                          ? `${prescription.dim_patient.first_name} ${prescription.dim_patient.last_name || ''}`.trim()
                          : 'Patient record'}
                      </span>
                    </td>
                    <td className="max-w-56 truncate px-5 py-3.5 text-slate-600">
                      {prescription.dim_drug?.drug_name || 'Medication record'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {formatDate(prescription.dim_date?.full_date)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-slate-700">
                      {formatCurrency(prescription.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <FileText aria-hidden="true" className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-slate-700">No prescriptions to show yet</p>
            <p className="mt-1 text-sm text-slate-500">Newly recorded prescriptions will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
};
