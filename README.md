# PharmaPulse Analytics
> *Real-time pharmacy insights for prescription management, demand forecasting, and inventory planning*

---

## Overview

**PharmaPulse Analytics** is a pharmacy operations and decision-support application for pharmacies, clinics, and healthcare organizations. It combines prescription dispensing, medication and patient directories, demand forecasting, and anomaly monitoring. Configure it for your organization by connecting your own Supabase project and pharmacy data.

---

## Key Features & Capabilities

### 1. Application Navigation & Settings
- Responsive, collapsible sidebar separates operational workflows from analytics.
- Quick search is available from the sidebar and the global `Ctrl+K` / `Cmd+K` page search.
- The settings panel provides system/light/dark appearance options, data sync and CSV exports, and account details.
- A compact header shows the current page and relevant action; the sidebar provides access to sync and settings.

### 2. Predictive Analytics & Demand Forecasting
- **Linear Regression Demand Velocity Model**:
  - Fits chronological prescription events to a linear regression model ($y = mx + b$).
  - Projects 30-day medication consumption and estimated budget requirements.
  - Interactive chart navigation: Pan left/right, zoom in/out, and reset zoom to analyze date ranges.
- **Financial & Subsidy Breakdown**:
  - Visualizes patient out-of-pocket expenses versus institutional and PhilHealth insurance subsidies via stacked bar charts.
- **Medication Velocity Rankings**:
  - Highlights the highest-dispensed medications to prioritize bulk procurement.
- **Demand Surge Simulator ("What-If" Scenario Modeling)**:
  - Models medication depletion rates under configurable demand scenarios:
    - *Normal Baseline (+0%)*
    - *Moderate Demand Increase (+25%)*
    - *High Demand Increase (+50%)*
    - *Peak Demand Increase (+100%)*
  - Automatically calculates:
    - **Baseline Daily Velocity** (units/day)
    - **Total Forecast Demand** across customizable horizons (15, 30, or 60 days)
    - **Additional Units Needed** based on current stock on hand
    - **Stock Coverage Duration** (estimated days until exhaustion)
    - **Scenario Comparison Matrix** with comparative demand, deficit, and budget impact
    - **Cumulative Demand vs. Stock-on-Hand** trajectory chart

---

### 3. Prescription Desk & Dispensing
- **Fact Prescription Registry**: Complete transactional audit trail of dispensations.
- **Multi-Field Instant Search**: Filter prescriptions dynamically by patient name, medication, prescriber doctor, or unique Rx Fact ID.
- **Responsive table performance**: Search is deferred while typing and results are paginated in groups of 50.
- **New Dispensation Modal**:
  - Links selected patient, prescriber, medication, and pharmacy branch.
  - Automatic resolution and insertion of the `dim_date` dimension record.
  - Real-time client-side financial balance calculation (`Patient Cost = Total Amount - Insurance Subsidy`).
- **Official Printable Prescription Slip**:
  - Printable dispensing receipt with patient, medication, financial, and signature details.
  - Contains complete Rx details, patient affiliation, dosage, strength, and signature lines for both the attending physician and registered dispensing pharmacist.
  - Seamless printing support configured via `@media print`.

---

### 4. Directories & Dimensional Data Warehouse (Star Schema)
Built on a standard dimensional data modeling framework:
- **`fact_prescription`**: Transactional facts (quantities dispensed, days of supply, gross amount, insurance subsidy, net cost, and dimension foreign keys).
- **`dim_drug`**: Formulary items (brand name, generic name, dosage form, and strength).
- **`dim_patient`**: Patient directory (DOB, gender, address, and affiliation).
- **`dim_prescriber`**: Prescriber directory (NPI/license number and medical specialty).
- **`dim_pharmacy`**: Pharmacy locations and branches.
- **`dim_date`**: Chronological dimension (day of week, month, quarter, year).

---

### 5. Hybrid Cloud & Resilient Offline Caching
- **Live Supabase Connection**: Direct PostgreSQL database operations using the Supabase client.
- **Offline Cache Mode**: Fallback to locally cached datasets when the remote database is unavailable.

### 6. Anomaly Insights & AI Explanations
- Highlights unusual daily dispensing and billed-value changes in a 90-day chart.
- Compares each day against a rolling 14-day median and a 3.5 robust-Z threshold (median absolute deviation) after at least 7 baseline days.
- Provides a local statistical summary and an optional AI explanation with operational hypotheses and practical data checks.
- AI requests send only daily aggregate totals and anomaly statistics; patient names and prescription-level records are excluded.
- AI explanations require the Express server and a server-side Gemini key. The chart and statistical summary continue to work without AI configuration.
- AI-generated explanations are operational hypotheses, not clinical advice or proof of cause.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Typography** | Plus Jakarta Sans, JetBrains Mono |
| **Visualizations** | [Chart.js](https://www.chartjs.org/) (`chart.js/auto` & `registerables`) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) + LocalStorage Cache |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Motion** | Motion library |

---

## Setup & Configuration

### Prerequisites
- [Node.js](https://nodejs.org/) supported by Vite 8 (Node.js 20.19+ or 22.12+)
- `npm`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd pharmapulse-analytics
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env` and set your Supabase project URL and publishable key:
   ```bash
   cp .env.example .env
   ```
   The environment variables are:

   | Variable | Required | Purpose |
   |---|---|---|
   | `VITE_SUPABASE_URL` | No | Supabase project URL. Without a working connection, the app uses local cached data. |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | No | Supabase publishable key used by the browser client. |
   | `GEMINI_API_KEY` | No | Server-only Gemini key for AI anomaly explanations. |

   To enable AI explanations locally, set `GEMINI_API_KEY` in `.env` and restart the server. Keep it private: do not prefix it with `VITE_` or expose it in browser code.
   The connected database should provide `dim_drug`, `dim_patient`, `dim_prescriber`, `dim_pharmacy`, `dim_date`, and `fact_prescription`.

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   The Express server hosts the Vite development app and the `/api/anomaly-explanation` endpoint at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   ```
   Start the production Express server with `npm start`. Deploy the Node server rather than serving `dist` as static files if the AI endpoint is needed. Configure `GEMINI_API_KEY` as a private deployment environment variable to enable AI explanations.

6. **Run Type Checking / Linter**:
   ```bash
   npm run lint
   ```

### Available npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Express server with the Vite development app. |
| `npm run build` | Create the production client build in `dist/`. |
| `npm start` | Serve the production build and the AI explanation API. Run `npm run build` first. |
| `npm run preview` | Start Vite's static preview; the Express AI endpoint is not included. |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`). |

**Live Web Access**

- The application is deployed on Render: https://pharmacybupcapp.onrender.com/
- AI explanations are available on a deployment only when its server has a private `GEMINI_API_KEY` configured.

---

## Project Directory Structure

```
├── public/                 # Static assets & public resources
├── src/
│   ├── components/
│   │   ├── AnalyticsView.tsx        # Forecasts, financial charts, and demand scenarios
│   │   ├── AnomalyInsights.tsx      # Anomaly chart, signals, and optional AI explanation UI
│   │   ├── DispenseModal.tsx        # Prescription dispensing form
│   │   ├── DrugFormulary.tsx        # Medication directory
│   │   ├── Header.tsx               # Page context, global search, and actions
│   │   ├── KpiMetrics.tsx           # Dashboard KPI cards
│   │   ├── PatientDirectory.tsx     # Patient directory
│   │   ├── PharmacyExplorer.tsx     # Quick search and exploration view
│   │   ├── PrescriberDirectory.tsx  # Prescriber directory
│   │   ├── PrescriptionDesk.tsx     # Searchable, paginated prescription table
│   │   ├── PrintableSlip.tsx        # Printable prescription slip
│   │   ├── SettingsModal.tsx        # Appearance, data, export, and account settings
│   │   └── Sidebar.tsx              # Responsive primary navigation and sync actions
│   ├── services/
│   │   ├── anomalyInsights.ts       # Daily aggregate and robust anomaly detection
│   │   └── supabase.ts              # Supabase access, local cache, and data operations
│   ├── types/
│   │   └── pharmacy.ts              # Pharmacy data and navigation types
│   ├── App.tsx                      # App state, navigation, and view composition
│   ├── index.css                    # Tailwind imports and application styles
│   └── main.tsx                     # React application entry point
├── .env.example                     # Environment variable template
├── index.html                       # HTML document
├── package.json                     # Scripts and dependencies
├── server.ts                        # Express host and server-side AI endpoint
├── tsconfig.json                    # TypeScript compiler configuration
└── vite.config.ts                   # Vite and Tailwind CSS configuration
```

---

## License

This project is distributed under the MIT License. See [LICENSE](./LICENSE) for the copyright notice and permission terms.
