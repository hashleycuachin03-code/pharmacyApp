import React, { useState, useEffect } from 'react';
import { FilePlus, X, Calculator, ShieldCheck } from 'lucide-react';
import { DimDrug, DimPatient, DimPrescriber, DimPharmacy } from '../types/pharmacy';

interface DispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  drugs: DimDrug[];
  patients: DimPatient[];
  prescribers: DimPrescriber[];
  pharmacies: DimPharmacy[];
  onDispense: (payload: {
    patient_id: number;
    prescriber_id: number;
    drug_id: number;
    pharmacy_id: number;
    quantity_dispensed: number;
    days_supply: number;
    total_amount: number;
    insurance_covered: number;
    total_cost: number;
  }) => Promise<void>;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({
  isOpen,
  onClose,
  drugs,
  patients,
  prescribers,
  pharmacies,
  onDispense,
}) => {
  const [patientId, setPatientId] = useState<number | ''>('');
  const [prescriberId, setPrescriberId] = useState<number | ''>('');
  const [drugId, setDrugId] = useState<number | ''>('');
  const [pharmacyId, setPharmacyId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(30);
  const [daysSupply, setDaysSupply] = useState<number>(30);
  const [totalAmount, setTotalAmount] = useState<number>(350.0);
  const [insuranceCovered, setInsuranceCovered] = useState<number>(0.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize default pharmacy if available
  useEffect(() => {
    if (pharmacies.length > 0 && !pharmacyId) {
      setPharmacyId(pharmacies[0].pharmacy_id);
    }
  }, [pharmacies, pharmacyId]);

  if (!isOpen) return null;

  const outOfPocketCost = Math.max(0, (Number(totalAmount) || 0) - (Number(insuranceCovered) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !prescriberId || !drugId || !pharmacyId) {
      alert('Please select patient, doctor, drug, and dispensing branch.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onDispense({
        patient_id: Number(patientId),
        prescriber_id: Number(prescriberId),
        drug_id: Number(drugId),
        pharmacy_id: Number(pharmacyId),
        quantity_dispensed: Number(quantity),
        days_supply: Number(daysSupply),
        total_amount: Number(totalAmount),
        insurance_covered: Number(insuranceCovered),
        total_cost: outOfPocketCost,
      });
      onClose();
    } catch (err: any) {
      alert(`Dispense failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0b2545] text-white px-5 py-3.5 flex justify-between items-center">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <FilePlus className="w-4 h-4 text-amber-400" />
            <span>Dispense Prescription Fact</span>
            <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
              fact_prescription
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Patient & Prescriber Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Select Patient *
              </label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(Number(e.target.value) || '')}
                className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.last_name || ''}, {p.first_name || ''} (ID: #{p.patient_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Prescribing Doctor *
              </label>
              <select
                required
                value={prescriberId}
                onChange={(e) => setPrescriberId(Number(e.target.value) || '')}
                className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
              >
                <option value="">-- Choose Prescriber --</option>
                {prescribers.map((doc) => (
                  <option key={doc.prescriber_id} value={doc.prescriber_id}>
                    Dr. {doc.first_name || ''} {doc.last_name || ''} ({doc.specialty || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drug & Pharmacy Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Select Medication *
              </label>
              <select
                required
                value={drugId}
                onChange={(e) => setDrugId(Number(e.target.value) || '')}
                className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
              >
                <option value="">-- Choose Medication --</option>
                {drugs.map((d) => (
                  <option key={d.drug_id} value={d.drug_id}>
                    {d.drug_name} ({d.dosage_form || ''} {d.strength || ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Dispensing Pharmacy *
              </label>
              <select
                required
                value={pharmacyId}
                onChange={(e) => setPharmacyId(Number(e.target.value) || '')}
                className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
              >
                <option value="">-- Choose Branch --</option>
                {pharmacies.map((ph) => (
                  <option key={ph.pharmacy_id} value={ph.pharmacy_id}>
                    {ph.branch_name} ({ph.store_number || ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prescription Facts & Financial Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
              Prescription Facts &amp; Billing Calculation
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Qty Dispensed *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:ring-2 focus:ring-[#0b2545] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Days Supply *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={daysSupply}
                  onChange={(e) => setDaysSupply(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:ring-2 focus:ring-[#0b2545] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Total Amount (₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:ring-2 focus:ring-[#0b2545] outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Insurance Subsidy (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={insuranceCovered}
                  onChange={(e) => setInsuranceCovered(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white focus:ring-2 focus:ring-[#0b2545] outline-none font-semibold text-amber-700"
                />
              </div>
            </div>

            {/* Calculated Out of pocket */}
            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Calculated Patient Out-of-Pocket Cost:
              </span>
              <span className="text-base font-extrabold text-emerald-700">
                ₱{outOfPocketCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#0b2545] hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Dispensation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
