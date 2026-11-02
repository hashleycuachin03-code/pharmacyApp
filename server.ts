import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

interface DailyMetric {
  date: string;
  units: number;
  billed: number;
  prescriptionCount: number;
  expectedUnits: number | null;
  expectedBilled: number | null;
  anomaly: 'spike' | 'drop' | null;
  deviationPercent: number;
}

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const requestCounts = new Map<string, { count: number; resetAt: number }>();

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.post('/api/anomaly-explanation', async (request, response) => {
  const now = Date.now();
  const clientKey = request.ip || 'unknown';
  const clientRequests = requestCounts.get(clientKey);
  if (clientRequests && clientRequests.resetAt > now && clientRequests.count >= 10) {
    response.status(429).json({ error: 'Too many explanation requests. Please wait a minute and try again.' });
    return;
  }
  requestCounts.set(clientKey, clientRequests && clientRequests.resetAt > now
    ? { count: clientRequests.count + 1, resetAt: clientRequests.resetAt }
    : { count: 1, resetAt: now + 60_000 });

  const points = request.body?.points;
  if (!Array.isArray(points) || points.length === 0 || points.length > 90) {
    response.status(400).json({ error: 'Provide between 1 and 90 aggregate daily data points.' });
    return;
  }

  const safePoints: DailyMetric[] = [];
  for (const point of points) {
    if (
      typeof point?.date !== 'string'
      || !/^\d{4}-\d{2}-\d{2}$/.test(point.date)
      || !['spike', 'drop', null].includes(point.anomaly)
      || !Number.isFinite(point.units)
      || !Number.isFinite(point.billed)
      || !Number.isFinite(point.prescriptionCount)
      || !Number.isFinite(point.deviationPercent)
    ) {
      response.status(400).json({ error: 'Anomaly data contains an invalid daily aggregate.' });
      return;
    }

    safePoints.push({
      date: point.date,
      units: Math.max(0, Math.min(Number(point.units), 1_000_000_000)),
      billed: Math.max(0, Math.min(Number(point.billed), 1_000_000_000_000)),
      prescriptionCount: Math.max(0, Math.min(Number(point.prescriptionCount), 1_000_000)),
      expectedUnits: Number.isFinite(point.expectedUnits) ? Math.max(0, Number(point.expectedUnits)) : null,
      expectedBilled: Number.isFinite(point.expectedBilled) ? Math.max(0, Number(point.expectedBilled)) : null,
      anomaly: point.anomaly,
      deviationPercent: Math.max(0, Math.min(Number(point.deviationPercent), 100_000)),
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    response.status(503).json({
      error: 'AI explanations are not configured. Add GEMINI_API_KEY to the server environment (or local .env file) and restart the server.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        'You are an analytics assistant explaining pharmacy operations data to a pharmacy manager. Explain only the supplied aggregate daily dispensing and billed-value anomalies. State what changed, compare it with the supplied historical baseline, give 1-3 operational hypotheses as possibilities (never claim causality), and suggest a practical data/inventory check. Clearly state that these are statistical signals, not clinical advice. If the records are too sparse, say so. Use concise plain language and headings. Do not infer patient identities or medical diagnoses.',
        `Aggregate daily metrics (no patient-level data):\n${JSON.stringify(safePoints)}`,
      ].join('\n\n'),
    });
    const explanation = result.text?.trim();
    if (!explanation) {
      response.status(502).json({ error: 'The AI service returned an empty explanation. Please retry.' });
      return;
    }
    response.json({ explanation });
  } catch (error) {
    console.error('AI anomaly explanation request failed:', error);
    const providerMessage = error instanceof Error ? error.message.toLowerCase() : '';
    if (providerMessage.includes('project-unavailable') || providerMessage.includes('free tier is not available')) {
      response.status(503).json({
        error: 'Gemini API access is unavailable for this project. Enable billing for the Google AI project or configure a key from a project with Gemini API access.',
      });
      return;
    }
    if (providerMessage.includes('api key not valid') || providerMessage.includes('invalid api key')) {
      response.status(503).json({
        error: 'The configured Gemini API key is invalid or revoked. Add a valid server-side key and restart the server.',
      });
      return;
    }
    response.status(502).json({ error: 'Could not generate an AI explanation right now. Please try again later.' });
  }
});

if (isProduction) {
  app.use(express.static('dist', { maxAge: '1h' }));
  app.get('*', (_request, response) => response.sendFile('index.html', { root: 'dist' }));
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

const host = isProduction ? '0.0.0.0' : '127.0.0.1';
const server = app.listen(port, host, () => {
  console.log(`PharmaPulse ${isProduction ? 'production' : 'development'} server is ready.`);
  console.log(`Local: http://localhost:${port}`);
  if (isProduction) console.log(`Listening on ${host}:${port}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other server or choose another port.`);
  } else {
    console.error('Could not start the PharmaPulse server:', error);
  }
  process.exit(1);
});

const cleanupRateLimit = setInterval(() => {
  const now = Date.now();
  requestCounts.forEach((value, key) => {
    if (value.resetAt <= now) requestCounts.delete(key);
  });
}, 60_000);
cleanupRateLimit.unref();
