import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { BarChart3, Search, Sparkles } from 'lucide-react';
import { DimDrug, DimPrescriber, FactPrescription } from '../types/pharmacy';

ChartJS.register(...registerables);

type ExplorerResult =
  | {
      type: 'summary';
      title: string;
      description: string;
      value: string;
    }
  | {
      type: 'chart';
      title: string;
      description: string;
      labels: string[];
      values: number[];
      datasetLabel: string;
      valuePrefix: string;
    }
  | {
      type: 'records';
      title: string;
      description: string;
      prescriptions: FactPrescription[];
      drugs: DimDrug[];
      prescribers: DimPrescriber[];
      showPrescriptionRecords: boolean;
      totals?: Array<{ label: string; value: string }>;
    }
  | {
      type: 'empty';
      title: string;
      description: string;
    };

interface PharmacyExplorerProps {
  prescriptions: FactPrescription[];
  drugs: DimDrug[];
  prescribers: DimPrescriber[];
  isDarkMode: boolean;
}

const formatCurrency = (value: number) =>
  `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const normalizeText = (value: string | number | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\bhealth\s+care\b/g, 'healthcare')
    .replace(/\b(?:no|number)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const prescriptionDate = (prescription: FactPrescription) =>
  prescription.dim_date?.full_date || '';

function answerQuestion(
  question: string,
  prescriptions: FactPrescription[],
  drugs: DimDrug[],
  prescribers: DimPrescriber[]
): ExplorerResult {
  const query = question.trim().toLowerCase();
  const yearMatch = query.match(/\b(?:19|20)\d{2}\b/);
  const requestedYear = yearMatch?.[0];
  const filterByYear = (prescription: FactPrescription) =>
    !requestedYear || prescriptionDate(prescription).startsWith(requestedYear);
  const yearFilteredPrescriptions = prescriptions.filter(filterByYear);
  const isInsuranceQuery = /\b(insurance|subsidy|covered)\b/.test(query);
  const isOutOfPocketQuery = /\b(out[- ]of[- ]pocket|patient cost|total cost)\b/.test(query);
  const isBilledQuery = /\b(billed|billing|revenue|sales|total amount)\b/.test(query);
  const metricLabel = isInsuranceQuery
    ? 'Insurance covered'
    : isOutOfPocketQuery
      ? 'Patient out-of-pocket cost'
      : isBilledQuery
        ? 'Total billed'
        : 'Units dispensed';
  const valuePrefix = isInsuranceQuery || isOutOfPocketQuery || isBilledQuery ? '₱' : '';
  const amountFor = (prescription: FactPrescription) =>
    isInsuranceQuery
      ? Number(prescription.insurance_covered || 0)
      : isOutOfPocketQuery
        ? Number(prescription.total_cost || 0)
        : isBilledQuery
          ? Number(prescription.total_amount || 0)
          : Number(prescription.quantity_dispensed || 0);

  if (prescriptions.length === 0) {
    return {
      type: 'empty',
      title: 'No prescription data yet',
      description: 'Add or load prescription records, then ask a question about them here.',
    };
  }

  const asksForTrend = /\b(trend|over time|monthly|month|by date|daily)\b/.test(query);
  const asksByPrescriber = /\b(prescriber|doctor|physician)\b/.test(query);
  const asksByPharmacy = /\b(pharmacy|branch|location)\b/.test(query);
  const asksForBreakdown = /\b(breakdown|distribution|compare|chart|graph|per|by)\b/.test(query);
  const asksForRanking = /\b(top|most|highest)\b/.test(query);
  const asksForTotal = /\b(total|overall|how many|count|average|avg)\b/.test(query);
  const mentionsPrescription = /\b(prescription|prescriptions|transaction|transactions|dispense|dispensed)\b/.test(query);
  const asksForCostTotals = /\b(total cost|insurance|covered|subsidy)\b/.test(query);
  const normalizedQuery = normalizeText(query);
  const knownPatients = [...new Map(
    prescriptions
      .filter((prescription) => prescription.dim_patient)
      .map((prescription) => [
        prescription.patient_id,
        {
          id: prescription.patient_id,
          name: `${prescription.dim_patient?.first_name || ''} ${prescription.dim_patient?.last_name || ''}`.trim(),
        },
      ])
  ).values()];
  const knownPrescribersById = new Map(
    prescribers.map((prescriber) => [
      prescriber.prescriber_id,
      {
        id: prescriber.prescriber_id,
        name: `${prescriber.first_name || ''} ${prescriber.last_name || ''}`.trim(),
      },
    ])
  );
  prescriptions.forEach((prescription) => {
    const joinedPrescriber = prescription.dim_prescriber;
    if (joinedPrescriber && !knownPrescribersById.has(prescription.prescriber_id)) {
      knownPrescribersById.set(prescription.prescriber_id, {
        id: prescription.prescriber_id,
        name: `${joinedPrescriber.first_name || ''} ${joinedPrescriber.last_name || ''}`.trim(),
      });
    }
  });
  const knownPrescribers = [...knownPrescribersById.values()];
  const namedPatient = knownPatients
    .filter((patient) => patient.name && normalizedQuery.includes(normalizeText(patient.name)))
    .sort((patientA, patientB) => patientB.name.length - patientA.name.length)[0];
  const namedPrescriber = knownPrescribers
    .filter((prescriber) => prescriber.name && normalizedQuery.includes(normalizeText(prescriber.name)))
    .sort((prescriberA, prescriberB) => prescriberB.name.length - prescriberA.name.length)[0];
  const mentionsPatient = /\bpatient\b/.test(query);
  const mentionsPrescriber = /\b(prescriber|doctor|physician)\b/.test(query);
  const pharmacyNumber = query.match(/\bpharmacy\s*(?:no\.?|number|#)?\s*(\d+)\b/)?.[1];
  const pharmacyEntries = [...new Map(
    prescriptions
      .filter((prescription) => prescription.dim_pharmacy)
      .map((prescription) => [prescription.pharmacy_id, prescription])
  ).values()];
  const matchingPharmacy = pharmacyEntries.find((prescription) => {
    const branchName = normalizeText(prescription.dim_pharmacy?.branch_name);
    const storeNumber = normalizeText(prescription.dim_pharmacy?.store_number);
    const storeDigits = storeNumber.match(/\d+/g) || [];
    const pharmacyNumberMatch = pharmacyNumber && (
      storeNumber === pharmacyNumber
      || storeDigits.some((digits) => Number(digits) === Number(pharmacyNumber))
      || branchName.match(new RegExp(`(?:no|number)?\\s*${pharmacyNumber}$`))
      || String(prescription.pharmacy_id) === pharmacyNumber
    );
    const branchMentioned = branchName.length > 3 && normalizedQuery.includes(branchName);
    return Boolean(branchMentioned && (!pharmacyNumber || pharmacyNumberMatch));
  });
  const mentionsPharmacy = /\b(pharmacy|branch|location)\b/.test(query);

  if (mentionsPrescription || namedPatient || namedPrescriber || pharmacyNumber) {
    const matchingRecords = yearFilteredPrescriptions.filter((prescription) => {
      const matchesPatient = !mentionsPatient && !namedPatient
        || Boolean(namedPatient && prescription.patient_id === namedPatient.id);
      const matchesPrescriber = !mentionsPrescriber && !namedPrescriber
        || Boolean(namedPrescriber && prescription.prescriber_id === namedPrescriber.id);
      const matchesPharmacy = !mentionsPharmacy
        || Boolean(matchingPharmacy && prescription.pharmacy_id === matchingPharmacy.pharmacy_id);
      return matchesPatient && matchesPrescriber && matchesPharmacy;
    });

    const totals = asksForCostTotals
      ? [
          {
            label: 'Total patient cost',
            value: formatCurrency(matchingRecords.reduce((sum, record) => sum + Number(record.total_cost || 0), 0)),
          },
          {
            label: 'Total insurance covered',
            value: formatCurrency(matchingRecords.reduce((sum, record) => sum + Number(record.insurance_covered || 0), 0)),
          },
        ]
      : undefined;
    const involvedDrugsById = new Map<number, DimDrug>();
    matchingRecords.forEach((record) => {
      if (record.dim_drug) involvedDrugsById.set(record.drug_id, record.dim_drug);
    });
    const involvedDrugs = [...involvedDrugsById.values()];

    const filters = [
      requestedYear ? `year ${requestedYear}` : '',
      namedPatient ? `patient ${namedPatient.name}` : mentionsPatient ? 'requested patient' : '',
      namedPrescriber ? `prescriber ${namedPrescriber.name}` : mentionsPrescriber ? 'requested prescriber' : '',
      matchingPharmacy?.dim_pharmacy?.branch_name || (pharmacyNumber ? `pharmacy no. ${pharmacyNumber}` : ''),
    ].filter(Boolean);

    return {
      type: 'records',
      title: requestedYear ? `Prescriptions for ${requestedYear}` : 'Matching prescriptions',
      description: matchingRecords.length
        ? `${matchingRecords.length.toLocaleString()} matching transaction${matchingRecords.length === 1 ? '' : 's'}${requestedYear ? ` and ${involvedDrugs.length} distinct medication${involvedDrugs.length === 1 ? '' : 's'}` : ''}${filters.length ? ` for ${filters.join(' · ')}` : ''}.${matchingRecords.length > 100 ? ' Showing the first 100 rows.' : ''}`
        : `No prescriptions found${filters.length ? ` for ${filters.join(' · ')}` : ' matching those details'}.`,
      prescriptions: matchingRecords.slice(0, 100),
      drugs: involvedDrugs,
      prescribers: [],
      showPrescriptionRecords: true,
      totals,
    };
  }

  if (asksForTrend) {
    const monthly = /\b(month|monthly)\b/.test(query);
    const grouped = new Map<string, number>();
    for (const prescription of yearFilteredPrescriptions) {
      const date = prescription.dim_date?.full_date;
      if (!date) continue;
      const key = monthly ? date.slice(0, 7) : date;
      grouped.set(key, (grouped.get(key) || 0) + amountFor(prescription));
    }
    const entries = [...grouped.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
    if (entries.length === 0) {
      return {
        type: 'empty',
        title: 'No dated records found',
        description: 'The available prescriptions do not include dates to build a trend.',
      };
    }
    return {
      type: 'chart',
      title: `${metricLabel} over time`,
      description: `${monthly ? 'Monthly' : 'Daily'} totals from the loaded prescription records.`,
      labels: entries.map(([date]) => date),
      values: entries.map(([, value]) => value),
      datasetLabel: metricLabel,
      valuePrefix,
    };
  }

  const asksForDrugBreakdown = asksForBreakdown && /\b(drug|medicine|medication|formulary)\b/.test(query);
  if (asksByPrescriber || asksByPharmacy || asksForDrugBreakdown || asksForRanking) {
    const grouped = new Map<string, number>();
    for (const prescription of prescriptions) {
      const key = asksByPrescriber
        ? `${prescription.dim_prescriber?.first_name || ''} ${prescription.dim_prescriber?.last_name || ''}`.trim() || 'Unknown prescriber'
        : asksByPharmacy
          ? prescription.dim_pharmacy?.branch_name || 'Unknown pharmacy'
          : prescription.dim_drug?.drug_name || 'Unknown medication';
      grouped.set(key, (grouped.get(key) || 0) + amountFor(prescription));
    }
    const entries = [...grouped.entries()]
      .sort(([, valueA], [, valueB]) => valueB - valueA)
      .slice(0, 10);
    const groupLabel = asksByPrescriber ? 'prescriber' : asksByPharmacy ? 'pharmacy' : 'medication';
    return {
      type: 'chart',
      title: `${metricLabel} by ${groupLabel}`,
      description: `Top ${entries.length} ${groupLabel}${entries.length === 1 ? '' : 's'} by ${metricLabel.toLowerCase()}.`,
      labels: entries.map(([label]) => label),
      values: entries.map(([, value]) => value),
      datasetLabel: metricLabel,
      valuePrefix,
    };
  }

  if (asksForTotal) {
    if (/\b(average|avg)\b/.test(query)) {
      const total = yearFilteredPrescriptions.reduce((sum, prescription) => sum + amountFor(prescription), 0);
      const average = total / prescriptions.length;
      return {
        type: 'summary',
        title: `Average ${metricLabel.toLowerCase()} per prescription`,
        description: `Calculated across ${prescriptions.length.toLocaleString()} loaded prescriptions.`,
        value: `${valuePrefix}${average.toLocaleString(undefined, {
          minimumFractionDigits: valuePrefix ? 2 : 0,
          maximumFractionDigits: 2,
        })}`,
      };
    }
    if (/\b(patient|patients)\b/.test(query)) {
      const patientCount = new Set(prescriptions.map((prescription) => prescription.patient_id)).size;
      return {
        type: 'summary',
        title: 'Patients with prescription records',
        description: 'Unique patients represented in the loaded prescriptions.',
        value: patientCount.toLocaleString(),
      };
    }
    if (/\b(drug|medicine|medication|formulary)\b/.test(query)) {
      return {
        type: 'summary',
        title: 'Medications in the formulary',
        description: 'Current medication records available to this dashboard.',
        value: drugs.length.toLocaleString(),
      };
    }
    if (/\b(prescriber|doctor|physician)\b/.test(query)) {
      return {
        type: 'summary',
        title: 'Prescribers with prescription records',
        description: 'Unique prescribers represented in the loaded prescriptions.',
        value: new Set(prescriptions.map((prescription) => prescription.prescriber_id)).size.toLocaleString(),
      };
    }
    if (/\b(prescription|dispense|record)\b/.test(query)) {
      return {
        type: 'summary',
        title: 'Prescription records',
        description: 'Total number of prescriptions currently loaded.',
        value: prescriptions.length.toLocaleString(),
      };
    }
    const total = prescriptions.reduce((sum, prescription) => sum + amountFor(prescription), 0);
    return {
      type: 'summary',
      title: `Total ${metricLabel.toLowerCase()}`,
      description: `Sum across ${prescriptions.length.toLocaleString()} loaded prescriptions.`,
      value: `${valuePrefix}${total.toLocaleString(undefined, {
        minimumFractionDigits: valuePrefix ? 2 : 0,
        maximumFractionDigits: 2,
      })}`,
    };
  }

  const ignoredTerms = new Set([
    'a', 'an', 'and', 'are', 'about', 'find', 'for', 'in', 'involve', 'involves',
    'me', 'of', 'on', 'please', 'prescription', 'prescriptions', 'record', 'records',
    'search', 'show', 'tell', 'the', 'transaction', 'transactions', 'what', 'which',
  ]);
  const terms = normalizeText(query)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !ignoredTerms.has(term));
  const matchingPrescriptions = yearFilteredPrescriptions.filter((prescription) => {
    const searchable = [
      prescription.dim_drug?.drug_name,
      prescription.dim_drug?.generic_name,
      prescription.dim_drug?.brand_name,
      prescription.dim_patient?.first_name,
      prescription.dim_patient?.last_name,
      prescription.dim_prescriber?.first_name,
      prescription.dim_prescriber?.last_name,
      prescription.dim_pharmacy?.branch_name,
      prescription.dim_pharmacy?.store_number,
      prescription.dim_date?.full_date,
      prescription.prescription_fact_id,
    ].map(normalizeText).join(' ');
    return terms.every((term) => searchable.includes(term));
  });
  const matchingDrugs = drugs.filter((drug) =>
    [drug.drug_name, drug.generic_name, drug.brand_name].some((name) =>
      terms.every((term) => (name || '').toLowerCase().includes(term))
    )
  );
  const matchingPrescribers = prescribers.filter((prescriber) =>
    terms.every((term) =>
      `${prescriber.first_name || ''} ${prescriber.last_name || ''} ${prescriber.specialty || ''}`
        .toLowerCase()
        .includes(term)
    )
  );
  const matchedRecords = matchingPrescriptions.slice(0, 25);

  if (matchedRecords.length === 0 && matchingDrugs.length === 0 && matchingPrescribers.length === 0) {
    return {
      type: 'empty',
      title: 'No matching records',
      description: 'Try a medication, patient, prescriber, date, or a question such as “top medications” or “monthly units”.',
    };
  }

  const resultLines = [
    matchingDrugs.length > 0 ? `${matchingDrugs.length} medication match${matchingDrugs.length === 1 ? '' : 'es'}` : '',
    matchingPrescribers.length > 0 ? `${matchingPrescribers.length} prescriber match${matchingPrescribers.length === 1 ? '' : 'es'}` : '',
    matchingPrescriptions.length > 0 ? `${matchingPrescriptions.length} prescription match${matchingPrescriptions.length === 1 ? '' : 'es'}` : '',
  ].filter(Boolean);

  return {
    type: 'records',
    title: `Search results for “${question.trim()}”`,
    description: `${resultLines.join(' · ')}${matchingPrescriptions.length > matchedRecords.length ? ' · Showing first 25 prescriptions' : ''}.`,
    prescriptions: matchedRecords,
    drugs: matchingDrugs,
    prescribers: matchingPrescribers,
    showPrescriptionRecords: true,
  };
}

export const PharmacyExplorer: React.FC<PharmacyExplorerProps> = ({
  prescriptions,
  drugs,
  prescribers,
  isDarkMode,
}) => {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<ExplorerResult | null>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    chartRef.current?.destroy();
    chartRef.current = null;
    if (result?.type !== 'chart' || !chartCanvasRef.current) return;
    const horizontal = result.labels.length > 6 && !result.description.startsWith('Monthly');

    chartRef.current = new ChartJS(chartCanvasRef.current, {
      type: 'bar',
      data: {
        labels: result.labels,
        datasets: [{
          label: result.datasetLabel,
          data: result.values,
          backgroundColor: isDarkMode ? '#5eead4' : '#0f766e',
          borderRadius: 6,
          maxBarThickness: 36,
        }],
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: isDarkMode ? '#cbd5e1' : '#475569',
              ...(horizontal
                ? { callback: (value: string | number) => `${result.valuePrefix}${Number(value).toLocaleString()}` }
                : {}),
            },
            grid: { color: isDarkMode ? '#334155' : '#e2e8f0' },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: isDarkMode ? '#cbd5e1' : '#475569',
              ...(!horizontal
                ? {
                    callback: (value: string | number) => result.valuePrefix
                      ? `${result.valuePrefix}${Number(value).toLocaleString()}`
                      : value,
                  }
                : {}),
            },
            grid: { color: isDarkMode ? '#334155' : '#e2e8f0' },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: { color: isDarkMode ? '#cbd5e1' : '#475569' },
          },
          tooltip: {
            callbacks: {
              label: (context) => `${result.datasetLabel}: ${result.valuePrefix}${Number(context.raw).toLocaleString(undefined, {
                minimumFractionDigits: result.valuePrefix ? 2 : 0,
                maximumFractionDigits: 2,
              })}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [result, isDarkMode]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    setResult(answerQuestion(question, prescriptions, drugs, prescribers));
  };

  const askExample = (example: string) => {
    setQuestion(example);
    setResult(answerQuestion(example, prescriptions, drugs, prescribers));
  };

  return (
    <div className="pharmacy-explorer space-y-6">
      <section className="explorer-search-panel bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="explorer-heading-icon w-5 h-5 text-indigo-600" />
            Ask &amp; Explore
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Search pharmacy records or ask about transactions, medications, prescribers, and yearly costs. Your data stays in this app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="explorer-search-form flex flex-col sm:flex-row gap-2">
          <label htmlFor="pharmacy-question" className="sr-only">Search or ask about pharmacy records</label>
          <input
            id="pharmacy-question"
            type="search"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question, e.g. prescriptions for 2023 by William Hernandez"
            className="explorer-search-input min-w-0 flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button type="submit" className="explorer-submit primary-action rounded-xl px-5 py-3 text-sm font-bold inline-flex items-center justify-center gap-2 transition active:scale-[0.98]">
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>

        <div className="explorer-examples flex flex-wrap gap-2" aria-label="Example questions">
          {[
            'Top medications',
            'Monthly units dispensed',
            'What are the transactions that involve Health Care Pharmacy No. 6 and patient David Brown?',
            'What are the prescriptions for 2023 and which drugs were involved?',
            'What are the prescriptions for 2023 that involve prescriber William Hernandez?',
            'Total cost and total insurance covered for prescriptions in 2023',
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => askExample(example)}
              className="explorer-example rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              {example}
            </button>
          ))}
        </div>
      </section>

      <section aria-live="polite" aria-atomic="true" className="explorer-results bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 min-h-64">
        {!result ? (
          <div className="explorer-empty min-h-52 flex flex-col items-center justify-center text-center text-slate-500">
            <BarChart3 className="explorer-empty-icon w-8 h-8 text-indigo-500 mb-3" />
            <h3 className="font-bold text-slate-700">Your results will appear here</h3>
            <p className="text-sm mt-1">Ask about totals, trends, top medications, or search for a record.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{result.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{result.description}</p>
            </div>

            {result.type === 'summary' && (
              <div className="explorer-metric rounded-xl bg-indigo-50 border border-indigo-100 p-5">
                <p className="text-sm font-semibold text-indigo-800">{result.title}</p>
                <p className="text-3xl font-extrabold text-indigo-700 mt-1">{result.value}</p>
              </div>
            )}

            {result.type === 'chart' && (
              <div className="explorer-chart h-80 relative">
                <canvas ref={chartCanvasRef} role="img" aria-label={`${result.title} bar chart`}></canvas>
              </div>
            )}

            {result.type === 'records' && result.showPrescriptionRecords && result.prescriptions.length === 0 && (
              <div className="explorer-no-results rounded-xl border p-4" role="status">
                <p className="font-semibold">No matching prescriptions in the loaded data</p>
                <p className="mt-1 text-sm">{result.description}</p>
                <p className="mt-2 text-xs">
                  Check the prescriber’s name and year, or try a broader search without one of the filters.
                </p>
              </div>
            )}

            {result.type === 'records' && result.totals && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.totals.map((total) => (
                  <div key={total.label} className="explorer-metric rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                    <p className="text-sm font-semibold text-indigo-800">{total.label}</p>
                    <p className="text-2xl font-extrabold text-indigo-700 mt-1">{total.value}</p>
                  </div>
                ))}
              </div>
            )}

            {result.type === 'records' && result.showPrescriptionRecords && result.prescriptions.length > 0 && (
              <div className="explorer-table-wrap overflow-x-auto border border-slate-200 rounded-lg">
                <table className="explorer-table w-full text-left text-xs text-slate-600">
                  <thead className="explorer-table-head bg-slate-100 text-slate-700 uppercase font-bold">
                    <tr>
                      <th scope="col" className="p-3">Rx ID</th>
                      <th scope="col" className="p-3">Date</th>
                      <th scope="col" className="p-3">Pharmacy</th>
                      <th scope="col" className="p-3">Medication</th>
                      <th scope="col" className="p-3">Patient</th>
                      <th scope="col" className="p-3">Prescriber</th>
                      <th scope="col" className="p-3 text-right">Units</th>
                      <th scope="col" className="p-3 text-right">Total cost</th>
                      <th scope="col" className="p-3 text-right">Insurance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.prescriptions.map((prescription) => (
                      <tr key={prescription.prescription_fact_id} className="explorer-table-row hover:bg-slate-50">
                        <td className="p-3 font-mono text-teal-700">#{prescription.prescription_fact_id}</td>
                        <td className="p-3 whitespace-nowrap">{prescription.dim_date?.full_date || '—'}</td>
                        <td className="p-3 whitespace-nowrap">
                          {prescription.dim_pharmacy?.branch_name || '—'}
                          {prescription.dim_pharmacy?.store_number ? ` #${prescription.dim_pharmacy.store_number}` : ''}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{prescription.dim_drug?.drug_name || 'Unknown medication'}</td>
                        <td className="p-3">{`${prescription.dim_patient?.first_name || ''} ${prescription.dim_patient?.last_name || ''}`.trim() || '—'}</td>
                        <td className="p-3">{`${prescription.dim_prescriber?.first_name || ''} ${prescription.dim_prescriber?.last_name || ''}`.trim() || '—'}</td>
                        <td className="p-3 text-right font-semibold">{Number(prescription.quantity_dispensed || 0).toLocaleString()}</td>
                        <td className="p-3 text-right whitespace-nowrap">{formatCurrency(Number(prescription.total_cost || 0))}</td>
                        <td className="p-3 text-right whitespace-nowrap">{formatCurrency(Number(prescription.insurance_covered || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.type === 'records' && result.drugs.length > 0 && (
              <div className="explorer-table-wrap overflow-x-auto border border-slate-200 rounded-lg">
                <table className="explorer-table w-full text-left text-xs text-slate-600">
                  <thead className="explorer-table-head bg-slate-100 text-slate-700 uppercase font-bold">
                    <tr>
                      <th scope="col" className="p-3">Medication</th>
                      <th scope="col" className="p-3">Brand</th>
                      <th scope="col" className="p-3">Generic</th>
                      <th scope="col" className="p-3">Form</th>
                      <th scope="col" className="p-3">Strength</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.drugs.map((drug) => (
                      <tr key={drug.drug_id} className="explorer-table-row">
                        <td className="p-3 font-semibold text-slate-800">{drug.drug_name}</td>
                        <td className="p-3">{drug.brand_name || '—'}</td>
                        <td className="p-3">{drug.generic_name || '—'}</td>
                        <td className="p-3">{drug.dosage_form || '—'}</td>
                        <td className="p-3">{drug.strength || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.type === 'records' && !result.showPrescriptionRecords && result.prescribers.length > 0 && (
              <div className="explorer-table-wrap overflow-x-auto border border-slate-200 rounded-lg">
                <table className="explorer-table w-full text-left text-xs text-slate-600">
                  <thead className="explorer-table-head bg-slate-100 text-slate-700 uppercase font-bold">
                    <tr>
                      <th scope="col" className="p-3">Prescriber</th>
                      <th scope="col" className="p-3">Specialty</th>
                      <th scope="col" className="p-3">NPI / License</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.prescribers.map((prescriber) => (
                      <tr key={prescriber.prescriber_id} className="explorer-table-row">
                        <td className="p-3 font-semibold text-slate-800">{`${prescriber.first_name || ''} ${prescriber.last_name || ''}`.trim() || 'Unknown prescriber'}</td>
                        <td className="p-3">{prescriber.specialty || '—'}</td>
                        <td className="p-3">{prescriber.npi_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.type === 'empty' && (
              <p className="explorer-empty rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{result.description}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
