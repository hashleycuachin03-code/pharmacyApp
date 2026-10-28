import React, { useState } from 'react';
import { Search, PlusCircle, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { FactPrescription } from '../types/pharmacy';

interface PrescriptionDeskProps {
  prescriptions: FactPrescription[];
  onOpenDispenseModal: () => void;
  onOpenSlipModal: (rx: FactPrescription) => void;
}

export const PrescriptionDesk: React.FC<PrescriptionDeskProps> = ({
  prescriptions,
  onOpenDispenseModal,
  onOpenSlipModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = prescriptions.filter((rx) => {
    const term = searchTerm.toLowerCase();
    const patName = `${rx.dim_patient?.first_name || ''} ${rx.dim_patient?.last_name || ''}`.toLowerCase();
    const drugName = (rx.dim_drug?.drug_name || '').toLowerCase();
    const docName = `${rx.dim_prescriber?.first_name || ''} ${rx.dim_prescriber?.last_name || ''}`.toLowerCase();
    const rxId = String(rx.prescription_fact_id);
    return patName.includes(term) || drugName.includes(term) || docName.includes(term) || rxId.includes(term);
  });

  return (
    <div className="prescription-desk space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Prescription Desk</h2>
          <p className="mt-1 text-sm text-slate-500">Search and review patient dispensing records.</p>
        </div>
        <span className="record-count text-xs font-medium text-slate-500">
          {filtered.length.toLocaleString()} of {prescriptions.length.toLocaleString()} records
        </span>
      </div>
      {/* Dispensing Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="prescription-search relative w-full sm:max-w-xl sm:flex-1">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search prescription records"
            placeholder="Search by patient, medication, prescriber, or Rx ID..."
            className="prescription-search-input w-full pl-12 pr-4 py-3 text-sm font-medium bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition"
          />
        </div>

        <button
          type="button"
          onClick={onOpenDispenseModal}
          className="primary-action w-full sm:w-auto px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow transition active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Dispense New Prescription</span>
        </button>
      </div>

      {/* Fact Prescription Table */}
      <div className="prescription-table-panel bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="prescription-table w-full text-left text-xs text-slate-600">
            <thead className="prescription-table-head bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Rx ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Drug Dispensed</th>
                <th className="p-3.5">Prescriber (MD)</th>
                <th className="p-3.5 text-center">Qty / Days</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5 text-right">Out-of-Pocket</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No prescriptions found</p>
                    <p className="text-[11px] text-slate-400">
                      {searchTerm
                        ? 'Try modifying your search criteria'
                        : 'Click "Dispense New Prescription" to record one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((rx) => {
                  const drug = rx.dim_drug;
                  const patient = rx.dim_patient;
                  const doc = rx.dim_prescriber;
                  const dateStr = rx.dim_date?.full_date || 'N/A';

                  return (
                    <tr key={rx.prescription_fact_id} className="prescription-table-row hover:bg-slate-50 transition border-b border-slate-100">
                      <td className="p-4 font-mono text-[11px] font-bold text-amber-700">
                        #{rx.prescription_fact_id}
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{dateStr}</td>
                      <td className="p-4 font-bold text-slate-800">
                        {patient?.first_name || ''} {patient?.last_name || ''}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block">
                          {drug?.drug_name || 'Unknown Drug'}
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          {drug?.dosage_form || ''} {drug?.strength || ''}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        Dr. {doc?.first_name || ''} {doc?.last_name || ''}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700 whitespace-nowrap">
                        {rx.quantity_dispensed}{' '}
                        <span className="font-normal text-[10px] text-slate-400">
                          ({rx.days_supply}d)
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-slate-800 whitespace-nowrap">
                        ₱{Number(rx.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                        ₱{Number(rx.total_cost || 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenSlipModal(rx)}
                          className="prescription-slip-button px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
