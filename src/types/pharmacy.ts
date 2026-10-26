export interface DimDrug {
  drug_id: number;
  drug_name: string;
  brand_name?: string | null;
  generic_name?: string | null;
  dosage_form?: string | null;
  strength?: string | null;
}

export interface DimPatient {
  patient_id: number;
  first_name: string;
  last_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
}

export interface DimPrescriber {
  prescriber_id: number;
  npi_number: number | string;
  first_name?: string | null;
  last_name?: string | null;
  specialty?: string | null;
}

export interface DimPharmacy {
  pharmacy_id: number;
  branch_name: string;
  store_number?: string | null;
}

export interface DimDate {
  date_id: number;
  full_date: string;
  day_of_week?: string;
  month?: number;
  quarter?: number;
  year?: number;
}

export interface FactPrescription {
  prescription_fact_id: number;
  pharmacy_id: number;
  prescriber_id: number;
  drug_id: number;
  patient_id: number;
  date_id: number;
  quantity_dispensed: number;
  days_supply: number;
  total_amount: number;
  insurance_covered: number;
  total_cost: number;
  dim_drug?: DimDrug;
  dim_patient?: DimPatient;
  dim_prescriber?: DimPrescriber;
  dim_pharmacy?: DimPharmacy;
  dim_date?: DimDate;
}

export type TabType = 'analytics' | 'prescriptions' | 'drugs' | 'patients' | 'prescribers';
