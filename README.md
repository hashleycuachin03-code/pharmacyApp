# BUPC Pharmacy Infirmary | Predictive Analytics & Management Portal
> **Bicol University Polangui Campus (BUPC)** • Health Services Division  
> *Data Warehouse (DW) Architecture & AI-Driven Predictive Health Analytics*

---

## Overview

The **BUPC Pharmacy Infirmary Management Portal** is an institutional health informatics and pharmacy decision-support system built for **Bicol University Polangui Campus** in Albay, Philippines. It bridges clinical dispensing workflows with dimensional data warehousing and predictive modeling to help campus healthcare administrators anticipate student and faculty health trends, manage drug formularies, and prevent inventory stockouts during peak university seasons.

---

## Key Features & Capabilities

### 1. Predictive Health Analytics & Demand Forecasting
- **Linear Regression Demand Velocity Model**:
  - Fits chronological prescription events to a linear regression model ($y = mx + b$).
  - Projects 30-day forward medication consumption and estimated campus budget requirements.
  - Interactive chart navigation: Pan left/right, zoom in/out, and reset zoom to analyze specific academic periods.
- **Financial & Subsidy Breakdown**:
  - Visualizes patient out-of-pocket expenses versus institutional and PhilHealth insurance subsidies via stacked bar charts.
- **Medication Velocity Rankings**:
  - Highlights the highest-dispensed medications to prioritize bulk procurement.
- **Campus Demand Surge Simulator ("What-If" Scenario Modeling)**:
  - Models medication depletion rates under campus-specific stress events:
    - *Normal Baseline (+0%)*
    - *Midterm Stress / Rainy Season Spikes (+25%)*
    - *Flu Outbreak / Exam Week (+50%)*
    - *Intramurals & Major Campus Athletics (+100%)*
  - Automatically calculates:
    - **Baseline Daily Velocity** (units/day)
    - **Total Forecast Demand** across customizable horizons (15, 30, or 60 days)
    - **Additional Units Needed** based on current stock on hand
    - **Stock Coverage Duration** (estimated days until exhaustion)
    - **Scenario Comparison Matrix** with comparative demand, deficit, and budget impact
    - **Cumulative Demand vs. Stock-on-Hand** trajectory chart

---

### 2. Prescription Desk & Clinical Dispensing
- **Fact Prescription Registry**: Complete transactional audit trail of all campus dispensations.
- **Multi-Field Instant Search**: Filter prescriptions dynamically by patient name, medication, prescriber doctor, or unique Rx Fact ID.
- **New Dispensation Modal**:
  - Links selected patient, physician, medication, and campus infirmary branch.
  - Automatic resolution and insertion of the `dim_date` dimension record.
  - Real-time client-side financial balance calculation (`Patient Cost = Total Amount - Insurance Subsidy`).
- **Official Printable Prescription Slip**:
  - Formatted institutional dispensing receipt with Bicol University Polangui Campus Infirmary branding.
  - Contains complete Rx details, patient affiliation, dosage, strength, and signature lines for both the attending physician and registered dispensing pharmacist.
  - Seamless printing support configured via `@media print`.

---

### 3. Dimensional Data Warehouse (Star Schema)
Built on a standard dimensional data modeling framework:
- **`fact_prescription`**: Transactional facts (quantities dispensed, days of supply, gross amount, insurance subsidy, net cost, and dimension foreign keys).
- **`dim_drug`**: Formulary items (brand name, generic name, dosage form, and strength).
- **`dim_patient`**: Student and personnel demographic directory (DOB, gender, address, campus department/college).
- **`dim_prescriber`**: Licensed campus medical doctors and nurses (NPI/license number, medical specialty).
- **`dim_pharmacy`**: Campus infirmary dispensary locations and depot branches.
- **`dim_date`**: Chronological dimension (day of week, month, quarter, year).

---

### 4. Hybrid Cloud & Resilient Offline Caching
- **Live Supabase Connection**: Direct PostgreSQL database operations using the Supabase client.
- **Offline Cache Mode**: Automatic fallback to persistent local clinic datasets to ensure zero downtime even during campus network outages.

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
   cd bupc-pharmacy-portal
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` if custom endpoints are needed:
   ```bash
   cp .env.example .env
   ```
   *(Note: The default Supabase public configuration is pre-configured in `src/services/supabase.ts`)*

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
│   │   └── PrintableSlip.tsx        # Official BUPC Infirmary printable prescription receipt
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

## License & Attribution

Designed and developed for the **Bicol University Polangui Campus (BUPC) Infirmary & Health Services Unit**.  
All rights reserved © 2026.
