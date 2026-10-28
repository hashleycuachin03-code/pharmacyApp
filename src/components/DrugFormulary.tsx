import React, { useState } from 'react';
import { Plus, Pill, Search, X } from 'lucide-react';
import { DimDrug } from '../types/pharmacy';

interface DrugFormularyProps {
  drugs: DimDrug[];
  onAddDrug: (drug: Omit<DimDrug, 'drug_id'>) => Promise<void>;
}

export const DrugFormulary: React.FC<DrugFormularyProps> = ({ drugs, onAddDrug }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [drugName, setDrugName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosageForm, setDosageForm] = useState('');
  const [strength, setStrength] = useState('');

  const filtered = drugs.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.drug_name.toLowerCase().includes(q) ||
      (d.brand_name || '').toLowerCase().includes(q) ||
      (d.generic_name || '').toLowerCase().includes(q) ||
      String(d.drug_id).includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddDrug({
        drug_name: drugName.trim(),
        brand_name: brandName.trim() || null,
        generic_name: genericName.trim() || null,
        dosage_form: dosageForm.trim() || null,
        strength: strength.trim() || null,
      });
      // Reset form
      setDrugName('');
      setBrandName('');
      setGenericName('');
      setDosageForm('');
      setStrength('');
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-4 h-4 text-amber-500" />
            Drug Formulary <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono">dim_drug</code>
          </h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {drugs.length} medications
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search formulary..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b2545] outline-none"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="primary-action px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add New Drug</span>
          </button>
        </div>
      </div>

      {/* Formulary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Drug ID</th>
                <th className="p-3.5">Drug Name</th>
                <th className="p-3.5">Brand Name</th>
                <th className="p-3.5">Generic Name</th>
                <th className="p-3.5">Dosage Form</th>
                <th className="p-3.5">Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No medications found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.drug_id} className="hover:bg-slate-50 transition border-b border-slate-100">
                    <td className="p-3.5 font-mono text-slate-500">{d.drug_id}</td>
                    <td className="p-3.5 font-bold text-slate-800">{d.drug_name}</td>
                    <td className="p-3.5 text-slate-600">{d.brand_name || '-'}</td>
                    <td className="p-3.5 text-slate-600">{d.generic_name || '-'}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {d.dosage_form || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-semibold">{d.strength || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Drug Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0b2545] text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                <Pill className="w-4 h-4 text-amber-400" />
                Add Drug Record (<code className="text-amber-400 font-mono">dim_drug</code>)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Drug Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxil"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin Trihydrate"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Dosage Form
                  </label>
                  <input
                    type="text"
                    placeholder="Capsule, Tablet, Syrup"
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Strength
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500 mg"
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="primary-action px-4 py-2 text-xs font-bold rounded shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Drug'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
