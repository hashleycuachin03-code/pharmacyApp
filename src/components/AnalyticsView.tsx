import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { 
  Sparkles, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  TrendingUp, 
  BarChart3, 
  AlertCircle 
} from 'lucide-react';
import { FactPrescription, DimDrug } from '../types/pharmacy';

ChartJS.register(...registerables);

const DEFAULT_VISIBLE_DATES = 7;

interface AnalyticsViewProps {
  prescriptions: FactPrescription[];
  drugs: DimDrug[];
  isDarkMode: boolean;
  onRefresh: () => void;
  onUpdateMetrics: (units: number, cost: number) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  prescriptions,
  drugs,
  isDarkMode,
  onRefresh,
  onUpdateMetrics,
}) => {
  // Chart Canvas Refs
  const demandCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const financialCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drugShareCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simForecastCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chart Instances
  const demandChartRef = useRef<ChartJS | null>(null);
  const financialChartRef = useRef<ChartJS | null>(null);
  const drugShareChartRef = useRef<ChartJS | null>(null);
  const simForecastChartRef = useRef<ChartJS | null>(null);

  // Zoom / Pan State for Chart 1
  const [demandZoomStatus, setDemandZoomStatus] = useState<string>('');
  const [demandPanLeftDisabled, setDemandPanLeftDisabled] = useState(true);
  const [demandPanRightDisabled, setDemandPanRightDisabled] = useState(true);

  // Zoom / Pan State for Chart 2
  const [finZoomStatus, setFinZoomStatus] = useState<string>('');
  const [finPanLeftDisabled, setFinPanLeftDisabled] = useState(true);
  const [finPanRightDisabled, setFinPanRightDisabled] = useState(true);

  // Surge Simulator State
  const [selectedDrugId, setSelectedDrugId] = useState<number | string>('');
  const [surgePct, setSurgePct] = useState<number>(0);
  const [simHorizon, setSimHorizon] = useState<number>(30);
  const [simBaselineDays, setSimBaselineDays] = useState<string>('all');
  const [simStockOnHand, setSimStockOnHand] = useState<string>('50');

  // Simulation outputs
  const [simDailyVelocity, setSimDailyVelocity] = useState<number>(0);
  const [simBaselineCoverageText, setSimBaselineCoverageText] = useState<string>('');
  const [simPredictedTotalUnits, setSimPredictedTotalUnits] = useState<number>(0);
  const [simEstimatedBilledValue, setSimEstimatedBilledValue] = useState<number>(0);
  const [simAdditionalUnits, setSimAdditionalUnits] = useState<string>('Enter stock');
  const [simCoverageDaysText, setSimCoverageDaysText] = useState<string>('');
  const [simScenarios, setSimScenarios] = useState<Array<{ label: string; units: number; additional: string; value: number }>>([]);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  // Auto-select first drug if none selected
  useEffect(() => {
    if (drugs.length > 0 && !selectedDrugId) {
      setSelectedDrugId(drugs[0].drug_id);
    }
  }, [drugs, selectedDrugId]);

  // Linear Regression helper: y = mx + b
  function linearRegression(x: number[], y: number[]) {
    const n = x.length;
    if (n <= 1) return { slope: 0, intercept: y[0] || 0 };
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, curr, i) => acc + curr * y[i], 0);
    const sumXX = x.reduce((acc, curr) => acc + curr * curr, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }

  // Set window helper for Chart 1
  const setDemandWindow = (min: number, max: number) => {
    const chart = demandChartRef.current;
    if (!chart) return;
    const pointCount = chart.data.labels?.length || 0;
    if (pointCount === 0) return;

    const visibleCount = Math.min(pointCount, Math.max(2, max - min + 1));
    const boundedMin = Math.max(0, Math.min(pointCount - visibleCount, min));
    const boundedMax = boundedMin + visibleCount - 1;

    if (chart.options.scales && chart.options.scales.x) {
      chart.options.scales.x.min = boundedMin;
      chart.options.scales.x.max = boundedMax;
      chart.update('none');
    }

    setDemandZoomStatus(`${visibleCount} of ${pointCount} dates`);
    setDemandPanLeftDisabled(boundedMin === 0);
    setDemandPanRightDisabled(boundedMax === pointCount - 1);
  };

  const zoomDemand = (direction: number) => {
    const chart = demandChartRef.current;
    if (!chart || !chart.options.scales?.x) return;
    const pointCount = chart.data.labels?.length || 0;
    const currentMin = (chart.options.scales.x.min as number) ?? 0;
    const currentMax = (chart.options.scales.x.max as number) ?? pointCount - 1;
    const currentCount = currentMax - currentMin + 1;
    const nextCount =
      direction > 0
        ? Math.max(2, Math.floor(currentCount / 1.5))
        : Math.min(pointCount, Math.ceil(currentCount * 1.5));
    const center = (currentMin + currentMax) / 2;
    const nextMin = Math.round(center - (nextCount - 1) / 2);
    setDemandWindow(nextMin, nextMin + nextCount - 1);
  };

  const panDemand = (direction: number) => {
    const chart = demandChartRef.current;
    if (!chart || !chart.options.scales?.x) return;
    const pointCount = chart.data.labels?.length || 0;
    const currentMin = (chart.options.scales.x.min as number) ?? 0;
    const currentMax = (chart.options.scales.x.max as number) ?? pointCount - 1;
    const shift = Math.max(1, Math.round((currentMax - currentMin + 1) * 0.5)) * direction;
    setDemandWindow(currentMin + shift, currentMax + shift);
  };

  const resetDemandZoom = () => {
    const chart = demandChartRef.current;
    if (!chart || !chart.options.scales?.x) return;
    delete chart.options.scales.x.min;
    delete chart.options.scales.x.max;
    chart.update('none');
    const pointCount = chart.data.labels?.length || 0;
    setDemandZoomStatus(`${pointCount} of ${pointCount} dates`);
    setDemandPanLeftDisabled(true);
    setDemandPanRightDisabled(true);
  };

  // Set window helper for Chart 2 (Financial)
  const setFinWindow = (min: number, max: number) => {
    const chart = financialChartRef.current;
    if (!chart) return;
    const pointCount = chart.data.labels?.length || 0;
    if (pointCount === 0) return;

    const visibleCount = Math.min(pointCount, Math.max(2, max - min + 1));
    const boundedMin = Math.max(0, Math.min(pointCount - visibleCount, min));
    const boundedMax = boundedMin + visibleCount - 1;

    if (chart.options.scales && chart.options.scales.x) {
      chart.options.scales.x.min = boundedMin;
      chart.options.scales.x.max = boundedMax;
      chart.update('none');
    }

    setFinZoomStatus(`${visibleCount} of ${pointCount} dates`);
    setFinPanLeftDisabled(boundedMin === 0);
    setFinPanRightDisabled(boundedMax === pointCount - 1);
  };

  const zoomFin = (direction: number) => {
    const chart = financialChartRef.current;
    if (!chart || !chart.options.scales?.x) return;
    const pointCount = chart.data.labels?.length || 0;
    const currentMin = (chart.options.scales.x.min as number) ?? 0;
    const currentMax = (chart.options.scales.x.max as number) ?? pointCount - 1;
    const currentCount = currentMax - currentMin + 1;
    const nextCount =
      direction > 0
        ? Math.max(2, Math.floor(currentCount / 1.5))
        : Math.min(pointCount, Math.ceil(currentCount * 1.5));
    const center = (currentMin + currentMax) / 2;
    const nextMin = Math.round(center - (nextCount - 1) / 2);
    setFinWindow(nextMin, nextMin + nextCount - 1);
  };

  const panFin = (direction: number) => {
    const chart = financialChartRef.current;
    if (!chart || !chart.options.scales?.x) return;
    const pointCount = chart.data.labels?.length || 0;
    const currentMin = (chart.options.scales.x.min as number) ?? 0;
    const currentMax = (chart.options.scales.x.max as number) ?? pointCount - 1;
    const shift = Math.max(1, Math.round((currentMax - currentMin + 1) * 0.5)) * direction;
    setFinWindow(currentMin + shift, currentMax + shift);
  };

  const resetFinZoom = () => {
    const chart = financialChartRef.current;
    if (!chart || !chart.options.scales?.x) return;
    delete chart.options.scales.x.min;
    delete chart.options.scales.x.max;
    chart.update('none');
    const pointCount = chart.data.labels?.length || 0;
    setFinZoomStatus(`${pointCount} of ${pointCount} dates`);
    setFinPanLeftDisabled(true);
    setFinPanRightDisabled(true);
  };

  // Render main analytics charts
  useEffect(() => {
    ChartJS.defaults.color = isDarkMode ? '#cbd5e1' : '#475569';
    ChartJS.defaults.borderColor = isDarkMode ? '#334155' : '#e2e8f0';

    if (prescriptions.length === 0) {
      onUpdateMetrics(0, 0);
      return;
    }

    // Group prescription facts by chronological date
    const dateMap: Record<string, { units: number; billed: number; cost: number; insurance: number }> = {};
    prescriptions.forEach((p) => {
      const dStr = p.dim_date?.full_date || '2026-10-01';
      if (!dateMap[dStr]) {
        dateMap[dStr] = { units: 0, billed: 0, cost: 0, insurance: 0 };
      }
      dateMap[dStr].units += Number(p.quantity_dispensed || 0);
      dateMap[dStr].billed += Number(p.total_amount || 0);
      dateMap[dStr].cost += Number(p.total_cost || 0);
      dateMap[dStr].insurance += Number(p.insurance_covered || 0);
    });

    const sortedDates = Object.keys(dateMap).sort();
    const xVals: number[] = [];
    const yUnits: number[] = [];
    const yBilled: number[] = [];

    sortedDates.forEach((d, idx) => {
      xVals.push(idx);
      yUnits.push(dateMap[d].units);
      yBilled.push(dateMap[d].billed);
    });

    const unitRegression = linearRegression(xVals, yUnits);

    // Build 30-day forecast projection
    const futurePeriods = 3; // 3 forward points
    const futureLabels = [...sortedDates];
    const historicalUnitData = [...yUnits];
    const forecastedUnitData = new Array(yUnits.length - 1).fill(null);
    forecastedUnitData.push(yUnits[yUnits.length - 1]); // anchor to last real point

    for (let i = 1; i <= futurePeriods; i++) {
      const nextX = xVals.length - 1 + i;
      const nextDate = new Date(sortedDates[sortedDates.length - 1] || new Date());
      nextDate.setDate(nextDate.getDate() + i * 10);
      futureLabels.push(nextDate.toISOString().split('T')[0] + ' (Forecast)');

      const predictedVal = Math.max(0, Math.round(unitRegression.slope * nextX + unitRegression.intercept));
      forecastedUnitData.push(predictedVal);
    }

    // Update KPI Badges with predictions
    const avgUnits = yUnits.reduce((a, b) => a + b, 0) / (yUnits.length || 1);
    const projected30DayUnits = Math.round(avgUnits * 30);
    const avgCostPerUnit = yBilled.reduce((a, b) => a + b, 0) / (yUnits.reduce((a, b) => a + b, 0) || 1) || 10;
    const projected30DayCost = projected30DayUnits * avgCostPerUnit;

    onUpdateMetrics(projected30DayUnits, projected30DayCost);
    const demandMax = futureLabels.length - 1;
    const demandMin = Math.max(0, futureLabels.length - DEFAULT_VISIBLE_DATES);
    const financialMax = sortedDates.length - 1;
    const financialMin = Math.max(0, sortedDates.length - DEFAULT_VISIBLE_DATES);
    const actualUnitsColor = isDarkMode ? '#60a5fa' : '#0b2545';
    const actualUnitsFill = isDarkMode
      ? 'rgba(96, 165, 250, 0.18)'
      : 'rgba(11, 37, 69, 0.1)';

    // Chart 1: Demand & Prediction Line
    if (demandCanvasRef.current) {
      if (demandChartRef.current) demandChartRef.current.destroy();
      demandChartRef.current = new ChartJS(demandCanvasRef.current, {
        type: 'line',
        data: {
          labels: futureLabels,
          datasets: [
            {
              label: 'Actual Dispensed Units',
              data: [...historicalUnitData, ...new Array(futurePeriods).fill(null)],
              borderColor: actualUnitsColor,
              backgroundColor: actualUnitsFill,
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'Regression Projection Trend',
              data: forecastedUnitData,
              borderColor: '#f59e0b',
              borderDash: [6, 6],
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 12, font: { size: 10, weight: 600 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.raw ?? 0} units`,
              },
            },
          },
          scales: {
            x: {
              min: demandMin,
              max: demandMax,
              ticks: { autoSkip: true, maxTicksLimit: 7, font: { size: 10 } },
            },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 10 } },
            },
          },
        },
      });
      setDemandZoomStatus(`${demandMax - demandMin + 1} of ${futureLabels.length} dates`);
      setDemandPanLeftDisabled(demandMin === 0);
      setDemandPanRightDisabled(true);
    }

    // Chart 2: Financial Stack
    if (financialCanvasRef.current) {
      if (financialChartRef.current) financialChartRef.current.destroy();
      financialChartRef.current = new ChartJS(financialCanvasRef.current, {
        type: 'bar',
        data: {
          labels: sortedDates,
          datasets: [
            {
              label: 'Patient Out-of-Pocket',
              data: sortedDates.map((d) => dateMap[d].cost),
              backgroundColor: '#10b981',
              borderRadius: 3,
            },
            {
              label: 'Insurance Covered',
              data: sortedDates.map((d) => dateMap[d].insurance),
              backgroundColor: '#f59e0b',
              borderRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              min: financialMin,
              max: financialMax,
              ticks: { autoSkip: true, maxTicksLimit: 6, maxRotation: 0, font: { size: 10 } },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                callback: (val) => `₱${Number(val).toLocaleString()}`,
                font: { size: 10 },
              },
            },
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 12, font: { size: 10, weight: 600 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ₱${Number(ctx.raw).toFixed(2)}`,
              },
            },
          },
        },
      });
      setFinZoomStatus(`${financialMax - financialMin + 1} of ${sortedDates.length} dates`);
      setFinPanLeftDisabled(financialMin === 0);
      setFinPanRightDisabled(true);
    }

    // Chart 3: Drug Consumption Distribution
    if (drugShareCanvasRef.current) {
      if (drugShareChartRef.current) drugShareChartRef.current.destroy();

      const drugTotals: Record<string, number> = {};
      prescriptions.forEach((p) => {
        const name = p.dim_drug?.drug_name || 'Other';
        drugTotals[name] = (drugTotals[name] || 0) + Number(p.quantity_dispensed || 0);
      });

      const topDrugs = Object.entries(drugTotals)
        .sort(([, unitsA], [, unitsB]) => unitsB - unitsA)
        .slice(0, 8);
      const topDrugLabels = topDrugs.length > 0 ? topDrugs.map(([name]) => name) : ['No dispensing data'];
      const topDrugValues = topDrugs.length > 0 ? topDrugs.map(([, units]) => units) : [0];

      drugShareChartRef.current = new ChartJS(drugShareCanvasRef.current, {
        type: 'bar',
        data: {
          labels: topDrugLabels,
          datasets: [
            {
              label: 'Units dispensed',
              data: topDrugValues,
              backgroundColor: actualUnitsColor,
              hoverBackgroundColor: '#f59e0b',
              borderRadius: 4,
              barThickness: 16,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              beginAtZero: true,
              title: { display: true, text: 'Units dispensed', font: { size: 10, weight: 'bold' } },
              ticks: { precision: 0, font: { size: 10 } },
            },
            y: {
              reverse: true,
              ticks: { autoSkip: false, font: { size: 10, weight: 500 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${Number(context.raw).toLocaleString()} units dispensed`,
              },
            },
          },
        },
      });
    }

    return () => {
      demandChartRef.current?.destroy();
      financialChartRef.current?.destroy();
      drugShareChartRef.current?.destroy();
    };
  }, [prescriptions, isDarkMode, onUpdateMetrics]);

  // Run Campus Surge Simulator
  useEffect(() => {
    const drugId = Number(selectedDrugId);
    const factor = Number(surgePct) / 100;
    const horizonDays = Number(simHorizon);
    const stockInput = simStockOnHand.trim();
    const stockOnHand = stockInput === '' ? null : Math.max(0, Number(stockInput));

    if (!drugId) {
      setSimMessage('Select a medication to run the simulation.');
      return;
    }

    const datedMatches = prescriptions
      .filter((prescription) => Number(prescription.drug_id) === drugId)
      .map((prescription) => ({
        date: Date.parse(`${prescription.dim_date?.full_date || ''}T00:00:00Z`),
        units: Number(prescription.quantity_dispensed || 0),
        billed: Number(prescription.total_amount || 0),
      }))
      .filter((record) => Number.isFinite(record.date));

    if (datedMatches.length === 0) {
      setSimMessage('No dated dispense history is available for this medication.');
      setSimDailyVelocity(0);
      setSimPredictedTotalUnits(0);
      setSimEstimatedBilledValue(0);
      setSimAdditionalUnits('Enter stock');
      setSimCoverageDaysText('Stock coverage unavailable');
      setSimScenarios([]);
      if (simForecastChartRef.current) {
        simForecastChartRef.current.destroy();
        simForecastChartRef.current = null;
      }
      return;
    }

    setSimMessage(null);
    const latestDate = datedMatches.reduce((latest, record) => Math.max(latest, record.date), -Infinity);
    const requestedDays = simBaselineDays === 'all' ? Infinity : Number(simBaselineDays);
    const cutoffDate = Number.isFinite(requestedDays)
      ? latestDate - (requestedDays - 1) * 24 * 60 * 60 * 1000
      : -Infinity;
    const baselineRecords = datedMatches.filter((record) => record.date >= cutoffDate);
    const earliestBaselineDate = baselineRecords.reduce((earliest, record) => Math.min(earliest, record.date), Infinity);
    const baselineDays = Math.max(1, Math.ceil((latestDate - earliestBaselineDate) / (24 * 60 * 60 * 1000)) + 1);
    const totalUnits = baselineRecords.reduce((sum, record) => sum + record.units, 0);
    const totalBilled = baselineRecords.reduce((sum, record) => sum + record.billed, 0);
    const dailyVelocity = totalUnits / baselineDays;
    const simulatedVelocity = dailyVelocity * (1 + factor);
    const predictedTotalUnits = Math.ceil(simulatedVelocity * horizonDays);
    const billedValuePerUnit = totalUnits > 0 ? totalBilled / totalUnits : 0;
    const estimatedBilledValue = predictedTotalUnits * billedValuePerUnit;

    setSimDailyVelocity(dailyVelocity);
    setSimBaselineCoverageText(`Based on ${baselineDays} days of dated records`);
    setSimPredictedTotalUnits(predictedTotalUnits);
    setSimEstimatedBilledValue(estimatedBilledValue);

    if (stockOnHand === null || !Number.isFinite(stockOnHand)) {
      setSimAdditionalUnits('Enter stock');
      setSimCoverageDaysText('Add current stock to estimate coverage');
    } else {
      const additionalUnits = Math.max(0, Math.ceil(predictedTotalUnits - stockOnHand));
      const coverageDays = simulatedVelocity > 0 ? stockOnHand / simulatedVelocity : Infinity;
      setSimAdditionalUnits(`${additionalUnits.toLocaleString()} units`);
      setSimCoverageDaysText(
        Number.isFinite(coverageDays)
          ? `Stock lasts ~${coverageDays.toFixed(1)} days`
          : 'No projected consumption'
      );
    }

    // Scenarios table
    const scList = [
      { rate: 0, label: 'Normal Baseline (0%)' },
      { rate: factor, label: `Selected (+${Math.round(factor * 100)}%)` },
      { rate: 1, label: 'Major Campus Event (+100%)' },
    ];
    // Remove duplicates if factor is 0 or 1
    const uniqueScenarios: Array<{ label: string; units: number; additional: string; value: number }> = [];
    const seenRates = new Set<number>();
    for (const sc of scList) {
      if (!seenRates.has(sc.rate)) {
        seenRates.add(sc.rate);
        const scenarioUnits = Math.ceil(dailyVelocity * (1 + sc.rate) * horizonDays);
        const addUnits =
          stockOnHand === null
            ? 'Enter stock'
            : `${Math.max(0, Math.ceil(scenarioUnits - stockOnHand)).toLocaleString()} units`;
        const scenarioValue = scenarioUnits * billedValuePerUnit;
        uniqueScenarios.push({
          label: sc.label,
          units: scenarioUnits,
          additional: addUnits,
          value: scenarioValue,
        });
      }
    }
    setSimScenarios(uniqueScenarios);

    // Render cumulative demand simulation chart
    if (simForecastCanvasRef.current) {
      if (simForecastChartRef.current) simForecastChartRef.current.destroy();

      const labels = Array.from({ length: horizonDays }, (_, index) => `Day ${index + 1}`);
      simForecastChartRef.current = new ChartJS(simForecastCanvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Projected cumulative demand',
              data: labels.map((_, index) => Number((simulatedVelocity * (index + 1)).toFixed(1))),
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              fill: true,
              tension: 0.2,
              pointRadius: 0,
            },
            {
              label: 'Stock on hand threshold',
              data: stockOnHand === null ? labels.map(() => null) : labels.map(() => stockOnHand),
              borderColor: isDarkMode ? '#ffffff' : '#0b2545',
              borderDash: [5, 4],
              pointRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          scales: {
            x: {
              ticks: { autoSkip: true, maxTicksLimit: 8, maxRotation: 0, font: { size: 9 } },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Units', font: { size: 10 } },
              ticks: { font: { size: 9 } },
            },
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, font: { size: 9 } },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.raw ?? 'not entered'} units`,
              },
            },
          },
        },
      });
    }

    return () => {
      simForecastChartRef.current?.destroy();
    };
  }, [selectedDrugId, surgePct, simHorizon, simBaselineDays, simStockOnHand, prescriptions, isDarkMode]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Pharmacy Demand Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Linear regression forecasting, demand velocity, and inventory exhaustion projections
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="primary-action px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
          <span>Refresh Models</span>
        </button>
      </div>

      {/* Row 1: Charts (Demand Velocity & Financial) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Consumption Velocity & Projection (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Prescription Consumption Velocity &amp; Projection</h3>
              <p className="text-[11px] text-slate-400">
                Historical units dispensed (solid) vs. projected regression trend (dashed)
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => panDemand(-1)}
                  disabled={demandPanLeftDisabled}
                  aria-label="Pan demand chart left"
                  title="Pan left"
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomDemand(-1)}
                  aria-label="Zoom out on demand chart"
                  title="Zoom out"
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomDemand(1)}
                  aria-label="Zoom in on demand chart"
                  title="Zoom in"
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => panDemand(1)}
                  disabled={demandPanRightDisabled}
                  aria-label="Pan demand chart right"
                  title="Pan right"
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetDemandZoom}
                  aria-label="Reset demand chart zoom"
                  title="Reset zoom"
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
              <span className="hidden sm:inline text-[10px] text-slate-400 whitespace-nowrap">
                {demandZoomStatus}
              </span>
              <span className="hidden xl:inline text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Next 30-Day Outlook
              </span>
            </div>
          </div>
          <div className="h-64 relative">
            <canvas ref={demandCanvasRef}></canvas>
          </div>
        </div>

        {/* Right: Financial Impact & Subsidy Projection (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Financial Impact &amp; Subsidy Projection</h3>
              <p className="text-[11px] text-slate-400">Recorded dates: patient cost vs. insurance subsidy</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{finZoomStatus}</span>
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => panFin(-1)}
                disabled={finPanLeftDisabled}
                aria-label="Pan financial chart left"
                title="Pan left"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => zoomFin(-1)}
                aria-label="Zoom out on financial chart"
                title="Zoom out"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => zoomFin(1)}
                aria-label="Zoom in on financial chart"
                title="Zoom in"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => panFin(1)}
                disabled={finPanRightDisabled}
                aria-label="Pan financial chart right"
                title="Pan right"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs disabled:opacity-40 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={resetFinZoom}
                aria-label="Reset financial chart zoom"
                title="Reset zoom"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="h-64 relative">
            <canvas ref={financialCanvasRef}></canvas>
          </div>
        </div>
      </div>

      {/* Row 2: Top Drugs & Campus Demand Surge Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Top High-Velocity Drugs (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Highest-Velocity Medications</h3>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Formulary DW</span>
          </div>
          <p className="text-[11px] text-slate-400">Top medications ranked by total units dispensed</p>
          <div className="h-72 relative">
            <canvas ref={drugShareCanvasRef}></canvas>
          </div>
        </div>

        {/* Right: Campus Surge Scenario Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-700" />
                Campus Demand Surge Simulator
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                What-If Modeling
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Estimate procurement stock required under configurable demand surges and seasonal illness trends.
            </p>

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Target Medication
                </label>
                <select
                  value={selectedDrugId}
                  onChange={(e) => setSelectedDrugId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
                >
                  {drugs.length === 0 ? (
                    <option value="">No medications available</option>
                  ) : (
                    drugs.map((d) => (
                      <option key={d.drug_id} value={d.drug_id}>
                        {d.drug_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Surge Factor
                </label>
                <select
                  value={surgePct}
                  onChange={(e) => setSurgePct(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
                >
                  <option value={0}>Normal Baseline (+0%)</option>
                  <option value={25}>Midterm Stress / Rainy (+25%)</option>
                  <option value={50}>Flu Outbreak / Exam (+50%)</option>
                  <option value={100}>Intramurals Event (+100%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Forecast Horizon
                </label>
                <select
                  value={simHorizon}
                  onChange={(e) => setSimHorizon(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
                >
                  <option value={15}>Next 15 Days</option>
                  <option value={30}>Next 30 Days</option>
                  <option value={60}>Next 60 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Baseline History
                </label>
                <select
                  value={simBaselineDays}
                  onChange={(e) => setSimBaselineDays(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
                >
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="all">All Available</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Stock On Hand
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter units"
                  value={simStockOnHand}
                  onChange={(e) => setSimStockOnHand(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium focus:ring-2 focus:ring-[#0b2545] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Simulation Output Cards */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 xl:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Baseline Daily Rate</p>
              <h5 className="text-base font-extrabold text-slate-800 mt-0.5">
                {simMessage ? 'N/A' : `${simDailyVelocity.toFixed(2)} units/day`}
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {simMessage ? simMessage : simBaselineCoverageText}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-700">Forecast Demand</p>
              <h5 className="text-base font-extrabold text-amber-700 mt-0.5">
                {simMessage ? 'N/A' : `${simPredictedTotalUnits.toLocaleString()} units`}
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Over {simHorizon} days</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-700">Additional Units Needed</p>
              <h5 className="text-base font-extrabold text-blue-700 mt-0.5">
                {simMessage ? 'N/A' : simAdditionalUnits}
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">{simCoverageDaysText}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-700">Estimated Billed Value</p>
              <h5 className="text-base font-extrabold text-emerald-700 mt-0.5">
                {simMessage
                  ? 'N/A'
                  : `₱${simEstimatedBilledValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Based on unit price</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            * Value estimate uses historical billed amount per unit, not supplier acquisition cost.
          </p>

          {/* Scenario Comparison & Projected Curve */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Scenario Table */}
            <section>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Scenario Comparison</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-[11px] text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
                    <tr>
                      <th className="p-2">Scenario</th>
                      <th className="p-2 text-right">Demand</th>
                      <th className="p-2 text-right">Additional</th>
                      <th className="p-2 text-right">Est. Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {simMessage || simScenarios.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-slate-400">
                          {simMessage || 'Select a medication to compare scenarios.'}
                        </td>
                      </tr>
                    ) : (
                      simScenarios.map((sc, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-semibold text-slate-800">{sc.label}</td>
                          <td className="p-2 text-right font-bold text-amber-700">
                            {sc.units.toLocaleString()} units
                          </td>
                          <td className="p-2 text-right text-blue-700">{sc.additional}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">
                            ₱{sc.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Projected Demand vs Stock Chart */}
            <section aria-labelledby="projected-demand-title">
              <h4 id="projected-demand-title" className="text-xs font-bold text-slate-700 mb-2">Projected Demand vs. Stock</h4>
              <div className="simulator-chart-panel h-44 relative bg-slate-50/50 rounded-lg p-2 border border-slate-200">
                {simMessage ? (
                  <div className="absolute inset-0 flex items-center justify-center text-center text-[11px] text-slate-400 p-4">
                    <p>{simMessage}</p>
                  </div>
                ) : (
                  <canvas ref={simForecastCanvasRef}></canvas>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
