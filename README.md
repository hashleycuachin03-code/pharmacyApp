# Pharmacy Operations & Analytics
> *Prescription management, demand forecasting, and inventory planning*

---

## Overview

**Pharmacy Operations & Analytics** is a reusable pharmacy management and decision-support application for pharmacies, clinics, and healthcare organizations. It combines prescription dispensing, medication and patient directories, analytics, and inventory demand forecasting. Configure it for your organization by connecting your own Supabase project and pharmacy data.

---

## Key Features & Capabilities

### 1. Predictive Health Analytics & Demand Forecasting
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

### 2. Prescription Desk & Clinical Dispensing
- **Fact Prescription Registry**: Complete transactional audit trail of dispensations.
- **Multi-Field Instant Search**: Filter prescriptions dynamically by patient name, medication, prescriber doctor, or unique Rx Fact ID.
- **New Dispensation Modal**:
  - Links selected patient, prescriber, medication, and pharmacy branch.
  - Automatic resolution and insertion of the `dim_date` dimension record.
  - Real-time client-side financial balance calculation (`Patient Cost = Total Amount - Insurance Subsidy`).
- **Official Printable Prescription Slip**:
  - Printable dispensing receipt with patient, medication, financial, and signature details.
  - Contains complete Rx details, patient affiliation, dosage, strength, and signature lines for both the attending physician and registered dispensing pharmacist.
  - Seamless printing support configured via `@media print`.

---

### 3. Dimensional Data Warehouse (Star Schema)
Built on a standard dimensional data modeling framework:
- **`fact_prescription`**: Transactional facts (quantities dispensed, days of supply, gross amount, insurance subsidy, net cost, and dimension foreign keys).
- **`dim_drug`**: Formulary items (brand name, generic name, dosage form, and strength).
- **`dim_patient`**: Patient directory (DOB, gender, address, and affiliation).
- **`dim_prescriber`**: Prescriber directory (NPI/license number and medical specialty).
- **`dim_pharmacy`**: Pharmacy locations and branches.
- **`dim_date`**: Chronological dimension (day of week, month, quarter, year).

---

### 4. Hybrid Cloud & Resilient Offline Caching
- **Live Supabase Connection**: Direct PostgreSQL database operations using the Supabase client.
- **Offline Cache Mode**: Fallback to locally cached datasets when the remote database is unavailable.

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

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- `npm` or `bun`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd pharmacy-operations-analytics
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Supabase**:
   Create a Supabase project, then copy `.env.example` to `.env` and add your project's URL and publishable key:
   ```bash
   cp .env.example .env
   ```
   The database should provide the pharmacy tables used by the app, including `dim_drug`, `dim_patient`, `dim_prescriber`, `dim_pharmacy`, `dim_date`, and `fact_prescription`.

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Run Type Checking / Linter**:
   ```bash
   npm run lint
   ```

**Live Web Access**

- The live application is deployed on Render and accessible at:
https://pharmacybupcapp.onrender.com/

---

## Project Directory Structure

```
├── public/                 # Static assets & public resources
├── src/
│   ├── components/
│   │   ├── AnalyticsView.tsx        # Regression forecast, financial stack, and surge simulator
│   │   ├── DispenseModal.tsx        # Dispensation modal with live financial calculation
│   │   ├── DrugFormulary.tsx        # dim_drug management table and registration modal
│   │   ├── Header.tsx               # Infirmary branding, connection badge, and navigation
│   │   ├── KpiMetrics.tsx           # Stat cards (total Rx, 30-day forecast, budget, drug count)
│   │   ├── PatientDirectory.tsx     # dim_patient directory and registration modal
│   │   ├── PrescriberDirectory.tsx  # dim_prescriber directory and registration modal
│   │   ├── PrescriptionDesk.tsx     # fact_prescription data table, filter, and slip trigger
│   │   └── PrintableSlip.tsx        # Printable prescription receipt
│   ├── services/
│   │   └── supabase.ts              # Supabase client, offline seed datasets, and CRUD helpers
│   ├── types/
│   │   └── pharmacy.ts              # Star schema TypeScript interfaces & tab definitions
│   ├── App.tsx                      # Root component coordinating state, tabs, and notifications
│   ├── index.css                    # Tailwind CSS imports and Plus Jakarta Sans font definitions
│   └── main.tsx                     # React application entry point
├── index.html                       # HTML head metadata and @media print styles
├── metadata.json                    # AI Studio applet specifications
├── package.json                     # Project scripts and dependencies
├── tsconfig.json                    # TypeScript compiler configuration
└── vite.config.ts                   # Vite configuration with Tailwind CSS plugin
```

---

## License

This project is distributed under the MIT License. See [LICENSE](./LICENSE) for the copyright notice and permission terms.
