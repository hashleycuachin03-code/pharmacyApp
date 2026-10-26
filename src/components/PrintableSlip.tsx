import React from 'react';
import { Printer, X, CheckCircle, Shield } from 'lucide-react';
import { FactPrescription } from '../types/pharmacy';

interface PrintableSlipProps {
  prescription: FactPrescription | null;
  onClose: () => void;
}

export const PrintableSlip: React.FC<PrintableSlipProps> = ({ prescription, onClose }) => {
  if (!prescription) return null;

  const rx = prescription;
  const drug = rx.dim_drug;
  const patient = rx.dim_patient;
  const doc = rx.dim_prescriber;
  const pharm = rx.dim_pharmacy;
  const dateStr = rx.dim_date?.full_date || new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* On-screen Modal View */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
          {/* Modal Header */}
          <div className="bg-[#0b2545] text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-extrabold text-sm tracking-wide uppercase">
                  Prescription Dispensing Slip
                </h3>
                <p className="text-[11px] text-slate-300">
                  Official BUPC Infirmary Receipt &amp; Records
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Slip Body Preview */}
          <div className="p-6 bg-slate-50 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* The actual printable card */}
            <div
              id="printableSlip"
              className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-xs space-y-5 text-slate-800 font-sans"
            >
              {/* Slip Header */}
              <div className="border-b-2 border-slate-800 pb-4 text-center relative">
                <div className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] uppercase rounded mb-1 tracking-widest">
                  Official Health Services Record
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#0b2545] tracking-tight uppercase">
                  Bicol University Polangui Campus Infirmary
                </h2>
                <p className="text-xs text-slate-500">
                  Polangui, Albay 4506, Philippines • Student &amp; Personnel Health Division
                </p>
                <div className="mt-2 flex justify-between items-center text-xs font-semibold text-slate-600 px-2">
                  <span>Rx Fact ID: <strong className="text-amber-700 font-mono">#{rx.prescription_fact_id}</strong></span>
                  <span>Date: <strong>{dateStr}</strong></span>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {patient?.first_name || ''} {patient?.last_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender &amp; DOB</span>
                  <span className="font-semibold text-slate-700">
                    {patient?.gender || '-'} • {patient?.dob || 'DOB N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Affiliation / College</span>
                  <span className="font-medium text-slate-700">{patient?.address || 'BUPC Campus'}</span>
                </div>
              </div>

              {/* Rx Symbol & Medication Dispensed */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-serif font-black text-[#0b2545]">℞</span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Dispensed Medication
                  </span>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900">
                        {drug?.drug_name || 'Generic Medicine'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Generic: <strong className="text-slate-800">{drug?.generic_name || '-'}</strong>
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded">
                      {drug?.dosage_form || 'Form'} {drug?.strength || ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                    <div>
                      <span className="text-slate-500">Quantity Dispensed:</span>{' '}
                      <strong className="text-slate-900">{rx.quantity_dispensed} units</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Days Supply:</span>{' '}
                      <strong className="text-slate-900">{rx.days_supply} days</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial & Insurance Breakdown */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Medication Value:</span>
                  <span className="font-semibold">₱{Number(rx.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>Infirmary / PhilHealth Subsidy:</span>
                  <span className="font-semibold">- ₱{Number(rx.insurance_covered || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                  <span>Net Patient Out-of-Pocket:</span>
                  <span className="text-emerald-700 font-black">₱{Number(rx.total_cost || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Prescriber & Pharmacy Signature Section */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-xs">
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                    Dr. {doc?.first_name || ''} {doc?.last_name || ''}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">
                    Attending Physician
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Lic / NPI: {doc?.npi_number || 'N/A'} • {doc?.specialty || 'General'}
                  </p>
                </div>

                <div className="text-center space-y-1">
                  <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                    BUPC Infirmary Pharmacy
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">
                    Dispensing Pharmacist
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {pharm?.branch_name || 'BUPC Main Dispensary'}
                  </p>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-[9px] text-center text-slate-400 pt-2 border-t border-slate-100">
                This document is generated by the BUPC Pharmacy Infirmary AI &amp; DW portal. Valid only when signed by licensed infirmary medical staff.
              </p>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#0b2545] hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-lg shadow flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Official Slip</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
