import { FactPrescription } from '../types/pharmacy';

export interface ThirtyDayProjection {
  units: number;
  cost: number;
}

export const calculateThirtyDayProjection = (
  prescriptions: FactPrescription[]
): ThirtyDayProjection => {
  const dailyTotals = new Map<string, { units: number; billed: number }>();

  prescriptions.forEach((prescription) => {
    const date = prescription.dim_date?.full_date || '2026-10-01';
    const dailyTotal = dailyTotals.get(date) || { units: 0, billed: 0 };
    dailyTotal.units += Number(prescription.quantity_dispensed || 0);
    dailyTotal.billed += Number(prescription.total_amount || 0);
    dailyTotals.set(date, dailyTotal);
  });

  const totals = [...dailyTotals.values()];
  const totalUnits = totals.reduce((sum, day) => sum + day.units, 0);
  const projectedUnits = Math.round((totalUnits / (totals.length || 1)) * 30);
  const totalBilled = totals.reduce((sum, day) => sum + day.billed, 0);
  const averageCostPerUnit = totalBilled / (totalUnits || 1) || 10;

  return {
    units: projectedUnits,
    cost: projectedUnits * averageCostPerUnit,
  };
};
