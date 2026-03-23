# Bow Wave Analysis Tool

An internal desktop tool for project controls teams to analyse Primavera P6 schedule exports and quantify the "bow wave" — unfinished planned work carried forward between schedule updates.

## What it does

- Parses CSV, Excel (.xlsx), and XER schedule exports
- Calculates the bow wave (delta between two Data Dates)
- Visualises four redistribution scenarios (front-load, end-load, distribute to end, distribute to recovery)
- Groups results by any column in the schedule (e.g. WBS, discipline, resource)
- Multi-schedule trend analysis with in-flight work chart and S-curves
- PDF export of charts with project metadata and KPI summary
- Save/load projects as `.bwt` files

## Tech stack

- React + Vite
- Tailwind CSS v4 (configured via `src/index.css`, no `tailwind.config.js`)
- Recharts (stacked bar, line, S-curve)
- PapaParse (CSV), SheetJS/xlsx (Excel), custom parser (XER)
- Electron + electron-builder (portable `.exe` for Windows)

## Development

```bash
npm run dev           # Vite dev server at http://localhost:5173
npx electron .        # Electron window (run in a second terminal after dev server is up)
```

## Release build

Run from **Administrator PowerShell** (electron-builder requires symlink privileges):

```bash
git pull
npm install           # syncs package-lock.json version — required before building
npm run electron:build
```

Output: `release/Bow Wave Analysis X.X.X.exe` (portable, no installer required)

## Color system

Three configurable accent colors (Configure tab):
- **Primary Color** — main bars in charts, UI buttons/tabs, zoom slider, KPI "Planned" value
- **Accent Color** — bow wave bars, data date reference lines, KPI "Bow Wave" value
- **Secondary Accent Color** — previous schedule lines in multi-schedule charts (first previous schedule); additional schedules cycle through a fixed palette

Status colors (green/yellow/red for completion thresholds) are fixed and not configurable.

## Environment variables

Create a `.env` file (gitignored):

```
VITE_GITHUB_TOKEN=     # PAT with Issues + Gist write access
VITE_GITHUB_REPO=      # owner/repo for bug reports
VITE_USAGE_GIST_ID=    # Gist ID for usage tracking
```
