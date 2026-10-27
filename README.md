
# Pharmacy BUPC Application

A modern web application for managing pharmacy operations at Bicol University Polangui Campus (BUPC). Built with TypeScript, Vite, and modern web technologies.

---

## Tech Stack & Prerequisites

* **Frontend Framework:** React / TypeScript
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Package Manager:** `bun` (recommended) or `npm` / `pnpm`
* **Node.js:** `v18.0.0` or higher

---

## Project Structure

```text
pharmacyBupcApp/
├── public/              # Static assets (favicons, icons, public images)
├── src/                 # Application source code
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page layouts and views
│   ├── assets/          # Project assets (styles, SVGs, images)
│   └── ...
├── .env.example         # Environment variables template
├── index.html           # Main HTML entry point
├── metadata.json        # Application metadata configuration
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration file

```

---

## Setup & Configuration

### 1. Clone the Repository

```bash
git clone [https://github.com/hashleycuachin03-code/pharmacyBupcApp.git](https://github.com/hashleycuachin03-code/pharmacyBupcApp.git)
cd pharmacyBupcApp

```

### 2. Environment Variables

Create a local `.env` file based on the provided template:

```bash
cp .env.example .env

```

> Open `.env` and fill in any required API endpoints or configuration keys.

### 3. Install Dependencies

Using **Bun** (recommended, lockfile present):

```bash
bun install

```

Or using **NPM**:

```bash
npm install

```

---

## Running the Application

### Development Server

Start the local Vite development server with Hot Module Replacement (HMR):

```bash
# Using Bun
bun run dev

# Using NPM
npm run dev

```

Open your browser and navigate to `http://localhost:5173` (or the port specified in your terminal).

### Build for Production

To generate an optimized production build in the `dist` folder:

```bash
# Using Bun
bun run build

# Using NPM
npm run build

```

### Preview Production Build

Locally preview the built application:

```bash
bun run preview
# or
npm run preview

```

---

## How It Works

1. **Entry Point:** The application initializes via `index.html`, which imports the main TypeScript bundle configured in `src/`.
2. **Component Architecture:** UI modules are broken down cleanly under `src/` to manage inventory, prescriptions, user roles, or pharmacy transactions efficiently.
3. **Environment Management:** API keys and environment configurations are loaded securely using Vite's `import.meta.env` system derived from `.env`.
4. **Fast Bundling:** Vite leverages ES modules in development for lightning-fast server startup and uses Rollup behind the scenes for production builds.

---

## License

This project is created for Bicol University Polangui Campus (BUPC). All rights reserved.

