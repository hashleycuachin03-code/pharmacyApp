import { createClient } from '@supabase/supabase-js';
import { DimDrug, DimPatient, DimPrescriber, DimPharmacy, DimDate, FactPrescription } from '../types/pharmacy';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file.');
}

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_PUBLISHABLE_KEY = supabaseKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export let localDrugs: DimDrug[] = [];
export let localPatients: DimPatient[] = [];
export let localPrescribers: DimPrescriber[] = [];
export let localPharmacies: DimPharmacy[] = [];
export let localDates: DimDate[] = [];
export let localPrescriptions: FactPrescription[] = [];

export interface LoadDimensionsResult {
  drugs: DimDrug[];
  patients: DimPatient[];
  prescribers: DimPrescriber[];
  pharmacies: DimPharmacy[];
  source: 'supabase' | 'cache';
}

export async function fetchDimensions(): Promise<LoadDimensionsResult> {
  try {
    const [drugRes, patRes, docRes, pharmRes] = await Promise.all([
      supabase.from('dim_drug').select('*').order('drug_name'),
      supabase.from('dim_patient').select('*').order('last_name'),
      supabase.from('dim_prescriber').select('*').order('last_name'),
      supabase.from('dim_pharmacy').select('*').order('branch_name')
    ]);

    localDrugs = !drugRes.error && drugRes.data ? drugRes.data : [];
    localPatients = !patRes.error && patRes.data ? patRes.data : [];
    localPrescribers = !docRes.error && docRes.data ? docRes.data : [];
    localPharmacies = !pharmRes.error && pharmRes.data ? pharmRes.data : [];

    const isConnected = !drugRes.error && !patRes.error && !docRes.error && !pharmRes.error;

    return {
      drugs: localDrugs,
      patients: localPatients,
      prescribers: localPrescribers,
      pharmacies: localPharmacies,
      source: isConnected ? 'supabase' : 'cache'
    };
  } catch (err) {
    console.warn('Supabase fetch dimensions failed:', err);
    return {
      drugs: [],
      patients: [],
      prescribers: [],
      pharmacies: [],
      source: 'cache'
    };
  }
}

export async function fetchPrescriptions(): Promise<{ data: FactPrescription[]; source: 'supabase' | 'cache' }> {
  try {
    const { data, error } = await supabase
      .from('fact_prescription')
      .select(`
        prescription_fact_id,
        quantity_dispensed,
        days_supply,
        total_amount,
        insurance_covered,
        total_cost,
        pharmacy_id,
        prescriber_id,
        drug_id,
        patient_id,
        date_id,
        dim_drug (drug_name, brand_name, dosage_form, strength),
        dim_patient (first_name, last_name, dob, gender),
        dim_prescriber (first_name, last_name, specialty),
        dim_pharmacy (branch_name, store_number),
        dim_date (full_date)
      `)
      .order('prescription_fact_id', { ascending: false });

    if (!error && data) {
      const mapped = data.map((item: any) => ({
        prescription_fact_id: item.prescription_fact_id,
        pharmacy_id: item.pharmacy_id,
        prescriber_id: item.prescriber_id,
        drug_id: item.drug_id,
        patient_id: item.patient_id,
        date_id: item.date_id,
        quantity_dispensed: Number(item.quantity_dispensed),
        days_supply: Number(item.days_supply),
        total_amount: Number(item.total_amount),
        insurance_covered: Number(item.insurance_covered),
        total_cost: Number(item.total_cost),
        dim_drug: item.dim_drug,
        dim_patient: item.dim_patient,
        dim_prescriber: item.dim_prescriber,
        dim_pharmacy: item.dim_pharmacy,
        dim_date: item.dim_date,
      }));

      localPrescriptions = mapped;
      return { data: mapped, source: 'supabase' };
    }

    return { data: [], source: 'cache' };
  } catch (err) {
    console.warn('Supabase fetch prescriptions failed:', err);
    return { data: [], source: 'cache' };
  }
}

export async function addDrug(payload: Omit<DimDrug, 'drug_id'>): Promise<DimDrug> {
  const { data, error } = await supabase.from('dim_drug').insert([payload]).select().single();

  if (error) throw error;
  if (!data) throw new Error('No drug was returned from Supabase.');

  localDrugs = [data, ...localDrugs];
  return data;
}

export async function addPatient(payload: Omit<DimPatient, 'patient_id'>): Promise<DimPatient> {
  const { data, error } = await supabase.from('dim_patient').insert([payload]).select().single();

  if (error) throw error;
  if (!data) throw new Error('No patient was returned from Supabase.');

  localPatients = [data, ...localPatients];
  return data;
}

export async function addPrescriber(payload: Omit<DimPrescriber, 'prescriber_id'>): Promise<DimPrescriber> {
  const { data, error } = await supabase.from('dim_prescriber').insert([payload]).select().single();

  if (error) throw error;
  if (!data) throw new Error('No prescriber was returned from Supabase.');

  localPrescribers = [data, ...localPrescribers];
  return data;
}

export async function dispensePrescription(params: {
  patient_id: number;
  prescriber_id: number;
  drug_id: number;
  pharmacy_id: number;
  quantity_dispensed: number;
  days_supply: number;
  total_amount: number;
  insurance_covered: number;
  total_cost: number;
}): Promise<FactPrescription> {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let { data: existingDateRows } = await supabase
    .from('dim_date')
    .select('date_id')
    .eq('full_date', todayIso)
    .limit(1);

  let resolvedDateId = existingDateRows && existingDateRows.length > 0 ? existingDateRows[0].date_id : null;

  if (!resolvedDateId) {
    const { data: insertedDate, error: dateError } = await supabase
      .from('dim_date')
      .insert([{
        full_date: todayIso,
        day_of_week: dayNames[today.getDay()],
        month: today.getMonth() + 1,
        quarter: Math.floor(today.getMonth() / 3) + 1,
        year: today.getFullYear(),
      }])
      .select('date_id')
      .single();

    if (dateError) throw dateError;
    resolvedDateId = insertedDate?.date_id ?? null;
  }

  if (!resolvedDateId) {
    throw new Error('Could not resolve a valid date_id for this prescription.');
  }

  const { data: insertedFact, error } = await supabase
    .from('fact_prescription')
    .insert([{ ...params, date_id: resolvedDateId }])
    .select()
    .single();

  if (error) throw error;
  if (!insertedFact) throw new Error('No prescription was created in Supabase.');

  const drug = localDrugs.find(d => d.drug_id === params.drug_id);
  const pat = localPatients.find(p => p.patient_id === params.patient_id);
  const doc = localPrescribers.find(pr => pr.prescriber_id === params.prescriber_id);
  const pharm = localPharmacies.find(ph => ph.pharmacy_id === params.pharmacy_id);

  const created: FactPrescription = {
    ...insertedFact,
    dim_drug: drug,
    dim_patient: pat,
    dim_prescriber: doc,
    dim_pharmacy: pharm,
    dim_date: { date_id: resolvedDateId, full_date: todayIso },
  };

  localPrescriptions = [created, ...localPrescriptions];
  return created;
}
