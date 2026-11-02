import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CalendarDays,
  CircleHelp,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { FactPrescription } from '../types/pharmacy';
import { analyzePrescriptionAnomalies, DailyAnomalyPoint } from '../services/anomalyInsights';

ChartJS.register(...registerables);

interface AnomalyInsightsProps {
  prescriptions: FactPrescription[];
  isDarkMode: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatCurrency = (amount: number) =>
  `₱${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const buildLocalSummary = (anomalies: DailyAnomalyPoint[]) => {
  if (anomalies.length === 0) {
    return 'No significant volume anomalies were detected in the available daily history. The detector compares each day with the prior 14-day median after at least 7 baseline days.';
  }

  const strongest = anomalies[0];
  const signalWord = strongest.anomaly === 'spike' ? 'above' : 'below';
  return `The strongest signal is ${formatDate(strongest.date)}: daily dispensing was ${strongest.deviationPercent}% ${signalWord} its recent baseline. The value is a statistical deviation, not an explanation of its cause. Check the source records and inventory activity for context.`;
};

export const AnomalyInsights: React.FC<AnomalyInsightsProps> = ({
  prescriptions,
  isDarkMode,
  isLoading,
  onRefresh,
}) => {
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiError, setAiError] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  const points = useMemo(() => analyzePrescriptionAnomalies(prescriptions), [prescriptions]);
  const anomalies = useMemo(
    () => points.filter((point) => point.anomaly).sort((a, b) => b.deviationPercent - a.deviationPercent),
    [points]
  );
  const totalDispensed = useMemo(() => points.reduce((sum, point) => sum + point.units, 0), [points]);
  const dailyAverage = points.length > 0 ? totalDispensed / points.length : 0;
  const localSummary = buildLocalSummary(anomalies);

  useEffect(() => {
    chartRef.current?.destroy();
    chartRef.current = null;
    if (!chartCanvasRef.current || points.length === 0) return;

    chartRef.current = new ChartJS(chartCanvasRef.current, {
      type: 'line',
      data: {
        labels: points.map((point) => point.date),
        datasets: [
          {
            label: 'Units dispensed',
            data: points.map((point) => point.units),
            borderColor: isDarkMode ? '#67e8d2' : '#0f766e',
            backgroundColor: isDarkMode ? 'rgba(45, 212, 191, 0.1)' : 'rgba(15, 118, 110, 0.08)',
            fill: true,
            tension: 0.28,
            borderWidth: 2,
            pointRadius: points.map((point) => point.anomaly ? 6 : 2),
            pointHoverRadius: points.map((point) => point.anomaly ? 8 : 4),
            pointBackgroundColor: points.map((point) =>
              point.anomaly ? '#f97365' : (isDarkMode ? '#67e8d2' : '#0f766e')
            ),
            pointBorderColor: points.map((point) =>
              point.anomaly ? (isDarkMode ? '#301717' : '#fff') : (isDarkMode ? '#0b1220' : '#fff')
            ),
            pointBorderWidth: 2,
          },
          {
            label: 'Prior 14-day median',
            data: points.map((point) => point.expectedUnits),
            borderColor: isDarkMode ? '#8493a7' : '#94a3b8',
            borderDash: [5, 5],
            borderWidth: 1.5,
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
            grid: { display: false },
            ticks: {
              color: isDarkMode ? '#94a3b8' : '#64748b',
              autoSkip: true,
              maxTicksLimit: 9,
              maxRotation: 0,
              callback: (_value, index) => {
                const date = points[index]?.date;
                return date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: isDarkMode ? '#253247' : '#edf1f5' },
            ticks: { color: isDarkMode ? '#94a3b8' : '#64748b', precision: 0 },
            title: { display: true, text: 'Units dispensed', color: isDarkMode ? '#94a3b8' : '#64748b' },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: isDarkMode ? '#cbd5e1' : '#475569', usePointStyle: true, boxWidth: 8, padding: 18 },
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const date = points[items[0]?.dataIndex]?.date;
                return date ? formatDate(date) : '';
              },
              afterBody: (items) => {
                const point = points[items[0]?.dataIndex];
                if (!point) return '';
                return [
                  `${point.prescriptionCount} prescription${point.prescriptionCount === 1 ? '' : 's'}`,
                  `Billed: ${formatCurrency(point.billed)}`,
                  point.anomaly ? `Anomaly: ${point.anomaly} (${point.deviationPercent}%)` : '',
                ].filter(Boolean);
              },
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [points, isDarkMode]);

  const explainWithAi = async () => {
    setIsExplaining(true);
    setAiError('');
    setAiExplanation('');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 45_000);

    try {
      const response = await fetch('/api/anomaly-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          points: points.map((point) => ({
            date: point.date,
            units: point.units,
            billed: point.billed,
            prescriptionCount: point.prescriptionCount,
            expectedUnits: point.expectedUnits,
            expectedBilled: point.expectedBilled,
            anomaly: point.anomaly,
            deviationPercent: point.deviationPercent,
          })),
        }),
      });

      let result: { explanation?: string; error?: string };
      try {
        result = await response.json() as { explanation?: string; error?: string };
      } catch {
        throw new Error('The AI endpoint returned an unexpected response. Run the app with its Node server to enable explanations.');
      }
      if (!response.ok) throw new Error(result.error || 'AI explanation request failed.');
      if (!result.explanation) throw new Error('The AI service returned no explanation.');
      setAiExplanation(result.explanation);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setAiError('The AI explanation timed out. Please try again.');
      } else if (error instanceof TypeError) {
        setAiError('The AI endpoint is unreachable. Start the app with npm run dev or deploy the Node server.');
      } else {
        setAiError(error instanceof Error ? error.message : 'AI explanation failed. Please try again.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsExplaining(false);
    }
  };

  return (
    <div className="anomaly-view">
      <header className="anomaly-page-heading">
        <div>
          <div className="anomaly-eyebrow"><Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Operational intelligence</div>
          <h2>Anomaly Insights</h2>
          <p>Spot unusual dispensing and billed-value patterns, then review possible explanations.</p>
        </div>
        <button type="button" className="anomaly-refresh" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh data
        </button>
      </header>

      <section className="anomaly-stat-grid" aria-label="Anomaly overview">
        <article className="anomaly-stat-card">
          <span className="anomaly-stat-icon"><Activity aria-hidden="true" className="h-4 w-4" /></span>
          <div><p>Signals detected</p><strong>{anomalies.length}</strong><small>{points.length} calendar days analyzed</small></div>
        </article>
        <article className="anomaly-stat-card">
          <span className="anomaly-stat-icon anomaly-icon-rose"><AlertTriangle aria-hidden="true" className="h-4 w-4" /></span>
          <div><p>Highest deviation</p><strong>{anomalies[0] ? `${anomalies[0].deviationPercent}%` : '—'}</strong><small>{anomalies[0] ? formatDate(anomalies[0].date) : 'No significant signal'}</small></div>
        </article>
        <article className="anomaly-stat-card">
          <span className="anomaly-stat-icon anomaly-icon-blue"><CalendarDays aria-hidden="true" className="h-4 w-4" /></span>
          <div><p>Daily average</p><strong>{dailyAverage.toFixed(1)} <small>units</small></strong><small>Across {points.length} calendar days</small></div>
        </article>
      </section>

      <section className="anomaly-chart-panel" aria-labelledby="anomaly-chart-title">
        <div className="anomaly-panel-heading">
          <div>
            <h3 id="anomaly-chart-title">Daily dispensing pattern</h3>
            <p>Coral markers flag days that differ from the prior 14-day median.</p>
          </div>
          <span className="anomaly-chart-key"><span /> Anomaly</span>
        </div>
        {points.length > 0 ? (
          <div className="anomaly-chart-wrap"><canvas ref={chartCanvasRef} aria-label="Daily dispensing graph with highlighted anomalies" role="img" /></div>
        ) : (
          <div className="anomaly-empty-state">
            <Activity aria-hidden="true" className="h-7 w-7" />
            <strong>No dated prescription history yet</strong>
            <p>Load records with dates to start monitoring dispensing patterns.</p>
          </div>
        )}
      </section>

      <div className="anomaly-detail-grid">
        <section className="anomaly-insight-panel" aria-labelledby="anomaly-list-title">
          <div className="anomaly-panel-heading">
            <div>
              <h3 id="anomaly-list-title">Detected signals</h3>
              <p>Prior 14-day median, with a minimum 7-day baseline.</p>
            </div>
            <span className="anomaly-count">{anomalies.length}</span>
          </div>
          {anomalies.length > 0 ? (
            <ul className="anomaly-list">
              {anomalies.slice(0, 8).map((anomaly) => (
                <li key={anomaly.date} className="anomaly-list-item">
                  <span className={`anomaly-direction ${anomaly.anomaly === 'spike' ? 'is-spike' : 'is-drop'}`}>
                    {anomaly.anomaly === 'spike'
                      ? <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                      : <ArrowDownRight aria-hidden="true" className="h-4 w-4" />}
                  </span>
                  <div className="anomaly-row-copy">
                    <strong>{formatDate(anomaly.date)} · {anomaly.anomaly === 'spike' ? 'Unusual increase' : 'Unusual decrease'}</strong>
                    <p>{anomaly.reason}</p>
                  </div>
                  <span className={`anomaly-deviation ${anomaly.anomaly === 'spike' ? 'is-spike' : 'is-drop'}`}>
                    {anomaly.deviationPercent}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="anomaly-no-signals">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              <p>{points.length < 8 ? 'At least 8 calendar days of history are needed to establish a baseline.' : 'No significant deviations found in this period.'}</p>
            </div>
          )}
          {anomalies.length > 8 && <p className="anomaly-more-note">Showing the 8 strongest of {anomalies.length} signals.</p>}
        </section>

        <section className="anomaly-explanation-panel" aria-labelledby="anomaly-explanation-title">
          <div className="anomaly-panel-heading">
            <div>
              <h3 id="anomaly-explanation-title"><Bot aria-hidden="true" className="h-4 w-4" /> Explain these patterns</h3>
              <p>AI can summarize changes and suggest operational checks.</p>
            </div>
            <span className="ai-aggregate-badge"><ShieldCheck aria-hidden="true" className="h-3 w-3" /> Aggregate data only</span>
          </div>
          <p className="anomaly-local-summary">{localSummary}</p>
          <button type="button" className="anomaly-ai-button" onClick={explainWithAi} disabled={isExplaining || points.length === 0}>
            {isExplaining ? <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Sparkles aria-hidden="true" className="h-4 w-4" />}
            {isExplaining ? 'Generating explanation…' : 'Explain with AI'}
          </button>
          <p className="anomaly-privacy-note">
            Only daily totals and statistical signals are sent to the configured AI service when you request an explanation. No patient names or prescription-level records are sent.
          </p>
          {aiError && <p className="anomaly-ai-error" role="alert">{aiError}</p>}
          {aiExplanation && (
            <div className="anomaly-ai-result" aria-live="polite">
              <h4><Bot aria-hidden="true" className="h-4 w-4" /> AI explanation</h4>
              <p>{aiExplanation}</p>
              <p className="anomaly-ai-disclaimer"><CircleHelp aria-hidden="true" className="h-3 w-3" /> Operational hypotheses only—not clinical guidance or proof of cause.</p>
            </div>
          )}
        </section>
      </div>

      <p className="anomaly-method-note">
        Detection compares daily totals with the preceding 14-calendar-day median after at least 7 baseline days. A signal must differ by at least 75% and exceed a 3.5 robust-Z threshold based on median absolute deviation (MAD). Missing dates count as zero. Signals are indicators for review, not confirmed incidents.
      </p>
    </div>
  );
};
