import { FactPrescription } from '../types/pharmacy';

export interface DailyAnomalyPoint {
  date: string;
  units: number;
  billed: number;
  prescriptionCount: number;
  expectedUnits: number | null;
  expectedBilled: number | null;
  anomaly: 'spike' | 'drop' | null;
  deviationPercent: number;
  reason: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CHART_DAYS = 90;
const BASELINE_DAYS = 14;
const MIN_BASELINE_DAYS = 7;
const ROBUST_Z_THRESHOLD = 3.5;
const MAD_NORMALIZATION = 0.6745;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const formatDate = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

export const analyzePrescriptionAnomalies = (prescriptions: FactPrescription[]): DailyAnomalyPoint[] => {
  const dailyTotals = new Map<string, { units: number; billed: number; prescriptionCount: number }>();

  prescriptions.forEach((prescription) => {
    const date = prescription.dim_date?.full_date;
    if (!date || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) return;
    const current = dailyTotals.get(date) || { units: 0, billed: 0, prescriptionCount: 0 };
    current.units += Number(prescription.quantity_dispensed) || 0;
    current.billed += Number(prescription.total_amount) || 0;
    current.prescriptionCount += 1;
    dailyTotals.set(date, current);
  });

  const observedDates = [...dailyTotals.keys()].sort();
  if (observedDates.length === 0) return [];

  const latestTimestamp = Date.parse(`${observedDates[observedDates.length - 1]}T00:00:00Z`);
  const earliestTimestamp = Math.max(
    Date.parse(`${observedDates[0]}T00:00:00Z`),
    latestTimestamp - (MAX_CHART_DAYS - 1) * DAY_MS
  );
  const points: DailyAnomalyPoint[] = [];

  for (let timestamp = earliestTimestamp; timestamp <= latestTimestamp; timestamp += DAY_MS) {
    const date = formatDate(timestamp);
    const totals = dailyTotals.get(date) || { units: 0, billed: 0, prescriptionCount: 0 };
    const history = points.slice(-BASELINE_DAYS);

    if (history.length < MIN_BASELINE_DAYS) {
      points.push({
        date,
        ...totals,
        expectedUnits: null,
        expectedBilled: null,
        anomaly: null,
        deviationPercent: 0,
        reason: '',
      });
      continue;
    }

    const expectedUnits = median(history.map((point) => point.units));
    const expectedBilled = median(history.map((point) => point.billed));
    const unitsMad = median(history.map((point) => Math.abs(point.units - expectedUnits)));
    const billedMad = median(history.map((point) => Math.abs(point.billed - expectedBilled)));
    const unitsDelta = totals.units - expectedUnits;
    const billedDelta = totals.billed - expectedBilled;
    const unitsDeviation = expectedUnits > 0 ? unitsDelta / expectedUnits : (totals.units > 0 ? 1 : 0);
    const billedDeviation = expectedBilled > 0 ? billedDelta / expectedBilled : (totals.billed > 0 ? 1 : 0);
    const unitsThreshold = Math.max(expectedUnits * 0.75, unitsMad * ROBUST_Z_THRESHOLD / MAD_NORMALIZATION, 3);
    const billedThreshold = Math.max(expectedBilled * 0.75, billedMad * ROBUST_Z_THRESHOLD / MAD_NORMALIZATION, 500);
    const unitsIsAnomaly = Math.abs(unitsDelta) >= unitsThreshold && Math.abs(unitsDeviation) >= 0.75;
    const billedIsAnomaly = Math.abs(billedDelta) >= billedThreshold && Math.abs(billedDeviation) >= 0.75;
    const primaryDeviation = [
      unitsIsAnomaly ? unitsDeviation : 0,
      billedIsAnomaly ? billedDeviation : 0,
    ].sort((a, b) => Math.abs(b) - Math.abs(a))[0];
    const anomaly = primaryDeviation === 0 ? null : (primaryDeviation > 0 ? 'spike' : 'drop');
    const reasons: string[] = [];

    if (unitsIsAnomaly) {
      reasons.push(`${totals.units.toLocaleString()} units vs ${expectedUnits.toLocaleString()} expected`);
    }
    if (billedIsAnomaly) {
      reasons.push(`₱${totals.billed.toLocaleString()} billed vs ₱${expectedBilled.toLocaleString()} expected`);
    }

    points.push({
      date,
      ...totals,
      expectedUnits,
      expectedBilled,
      anomaly,
      deviationPercent: Math.round(Math.abs(primaryDeviation) * 100),
      reason: reasons.join(' · '),
    });
  }

  return points;
};
