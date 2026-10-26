import React, { useState } from 'react';
import { UserCheck, Stethoscope, Search, X } from 'lucide-react';
import { DimPrescriber } from '../types/pharmacy';

interface PrescriberDirectoryProps {
  prescribers: DimPrescriber[];
  onAddPrescriber: (prescriber: Omit<DimPrescriber, 'prescriber_id'>) => Promise<void>;
}

export const PrescriberDirectory: React.FC<PrescriberDirectoryProps> = ({
  prescribers,
  onAddPrescriber,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [npiNumber, setNpiNumber] = useState('');
  const [specialty, setSpecialty] = useState('');

  const filtered = prescribers.filter((doc) => {
    const q = searchTerm.toLowerCase();
    const fullName = `${doc.first_name || ''} ${doc.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      (doc.specialty || '').toLowerCase().includes(q) ||
      String(doc.npi_number).includes(q) ||
      String(doc.prescriber_id).includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npiNumber.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddPrescriber({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        npi_number: npiNumber.trim(),
        specialty: specialty.trim() || null,
      });
      // Reset form
      setFirstName('');
      setLastName('');
      setNpiNumber('');
      setSpecialty('');
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
            <Stethoscope className="w-4 h-4 text-amber-500" />
            Prescribing Clinicians <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono">dim_prescriber</code>
          </h3>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {prescribers.length} physicians
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search prescribers..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b2545] outline-none"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-[#0b2545] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Prescriber</span>
          </button>
        </div>
      </div>

      {/* Prescribers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Physician Name</th>
                <th className="p-3.5">NPI / License #</th>
                <th className="p-3.5">Medical Specialty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No prescribing clinicians found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.prescriber_id} className="hover:bg-slate-50 transition border-b border-slate-100">
                    <td className="p-3.5 font-mono text-slate-500">#{doc.prescriber_id}</td>
                    <td className="p-3.5 font-bold text-slate-800">
                      Dr. {doc.first_name || ''} {doc.last_name || ''}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-semibold">{doc.npi_number}</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {doc.specialty || 'General Practitioner'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Prescriber Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0b2545] text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-amber-400" />
                Register Prescriber (<code className="text-amber-400 font-mono">dim_prescriber</code>)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maria"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Santos, MD"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    NPI / License # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1049281726"
                    value={npiNumber}
                    onChange={(e) => setNpiNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-[#0b2545] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Medical Specialty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pediatrics"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
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
                  className="px-4 py-2 text-xs bg-[#0b2545] hover:bg-slate-800 text-amber-400 font-bold rounded shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Prescriber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
