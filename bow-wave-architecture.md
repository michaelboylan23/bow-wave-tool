# Bow Wave Analysis Tool — Architecture & Progress

**Last Updated:** March 2026 (session 4)
**Current Phase:** Phase 1 — POC / Portable Desktop App

---

## 1. Project Overview

A browser-based tool that accepts multiple Primavera P6 schedule exports (CSV, Excel, or XER). For a two-schedule comparison it auto-detects Schedule 1 vs. Schedule 2 by Data Date, calculates the "bow wave" (unfinished planned work between the two Data Dates), and visualizes four redistribution scenarios via a stacked bar chart with optional category grouping. For multi-schedule trend analysis it plots in-flight work over time and S-curves across all uploaded snapshots. Supports runtime filtering (add/remove filter columns inline on the Results tabs) to scope any analysis to a subset of activities. Distributed as a portable Windows `.exe` via Electron — no install required for end users.

---

## 2. Tech Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React (via Vite) | Already validated in prior projects; fast dev server; clean static build |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) | No `tailwind.config.js` — all config in `src/index.css`; `@theme inline` maps CSS vars to utility tokens for runtime theming |
| Charting | Recharts | React-native, composable, handles stacked bar + custom tooltips cleanly |
| CSV Parsing | PapaParse | Handles encoding, BOM, quoted fields — more reliable than manual split |
| Excel Parsing | SheetJS (xlsx) | Standard for client-side .xlsx/.xls binary reading |
| XER Parsing | Custom (in-house) | No reliable npm package; XER is tab-delimited with known structure |
| Row Virtualization | @tanstack/react-virtual | Handles 3,000+ row tables without DOM bloat |
| Desktop Packaging | Electron + electron-builder | Bundles Chromium + Node + React app into single portable .exe |
| Auth (prod) | Microsoft Entra ID + MSAL | Work account sign-in |
| Hosting (prod) | Azure Static Web Apps | Clean CI/CD from GitHub |
| API Proxy (prod) | Azure Functions | Hides any credentials from client |
| Persistence (prod) | SharePoint via MS Graph | Already-created library |

---

## 3. Feature List

| Feature | Status |
|---|---|
| File upload UI (drag & drop + browse) — N schedules | ✅ Complete |
| CSV parsing | ✅ Complete |
| Excel (.xlsx / .xls) parsing | ✅ Complete |
| XER parsing | ✅ Complete — validated with real file |
| XER auto-extract data date from PROJECT table | ✅ Complete |
| XER activity code join (ACTVTYPE / ACTVCODE / TASKACTV) | ✅ Complete |
| XER status-based date synthesis (act/early/target by status) | ✅ Complete |
| XER calendar day_hr_cnt duration normalization | ✅ Complete |
| Auto-detect Schedule 1 vs. Schedule 2 by Data Date | ✅ Complete |
| Unified column mapper (one shared mapping for all uploaded files) | ✅ Complete |
| Auto-match column mapping with alias support | ✅ Complete |
| Activity filter step (post-mapping, pre-analysis) | ~~Removed~~ — filters now live inline on Results tabs |
| Filter bar on Results tabs — add / remove columns, multi-select values | ✅ Complete |
| Filters applied to all N uploaded schedules | ✅ Complete |
| Re-filter without re-upload (rawRows preserved per schedule) | ✅ Complete |
| Reorder uploaded schedules (▲/▼ in Analysis tab) | ✅ Complete |
| Delete individual uploaded schedules (✕ in Analysis tab) | ✅ Complete |
| Core bow wave calculation (Planned, Actual, Delta) | ✅ Complete |
| KPI cards (Planned, Actual, Delta in hrs and work days) | ✅ Complete |
| Hours ↔ Work Days toggle | ✅ Complete |
| Stacked bar chart (base = planned, overflow = bow wave) | ✅ Complete |
| Group by dropdown — split bars by any non-core column | ✅ Complete |
| Chart zoom (DualRangeSlider — both thumbs independently draggable) | ✅ Complete |
| Data Date 2 reference line on chart | ✅ Complete |
| Base schedule toggle (Schedule 1 vs 2 for blue bars) | ✅ Complete |
| Tab 1: Front-Load redistribution | ✅ Complete |
| Tab 2: End-Load redistribution | ✅ Complete |
| Tab 3: Distribute to end (with end-date picker) | ✅ Complete |
| Tab 4: Distribute to recovery date (with date picker) | ✅ Complete |
| **Two-Schedule Bow Wave** result tab (independent, appears after 2-sched run) | ✅ Complete |
| **Multi-Schedule Trend** result tab (independent, appears after multi-sched run) | ✅ Complete |
| In-flight work trend chart (line, one dot per schedule) | ✅ Complete |
| S-Curve chart (cumulative planned hours, one line per schedule, with zoom) | ✅ Complete |
| Project Name + Number (required before analysis) | ✅ Complete |
| Inline click-to-edit project name/number in header | ✅ Complete |
| Persistent header with logo, Save, New Project | ✅ Complete |
| Instructions / Analysis / Results / Schedule Data / Example tabs | ✅ Complete |
| Loading spinner during file parsing | ✅ Complete |
| Schedule summary bar (file names + data dates) | ✅ Complete |
| Edit Data Dates modal (with validation + Reanalyze) | ✅ Complete |
| Swap Schedules (inside Edit Data Dates modal) | ✅ Complete |
| Overwrite warning when re-analyzing | ✅ Complete |
| New Project confirmation dialog | ✅ Complete |
| Example Project tab with in-memory fake data | ✅ Complete |
| **Save/Load — POC:** Export session as local `.bwt` JSON file | ✅ Complete |
| **Save/Load — POC:** Import `.bwt` JSON file to restore session | ✅ Complete |
| Schedule Data tab (filterable/sortable/virtualized activity table) | ✅ Complete |
| Schedule Data — select & rearrange columns modal | ✅ Complete |
| Schedule Data — sticky scrollbar + sticky headers | ✅ Complete |
| Schedule Data — show all raw columns from file (not just 9 mapped fields) | ✅ Complete |
| Electron portable .exe (Windows, no install required) | ✅ Complete |
| Instructions page | ✅ Complete |
| Version check banner (GitHub Releases API — green toast if current, amber if outdated) | ✅ Complete |
| In-app bug reporting (GitHub Issues API via VITE_GITHUB_TOKEN) | ✅ Complete |
| App-open usage tracking (GitHub Gist append via VITE_USAGE_GIST_ID) | ✅ Complete |
| Sticky header + tab bar while scrolling | ✅ Complete |
| Hatched bow wave bars in Group By mode (per-category color) | ✅ Complete |
| Re-map Columns button — re-parse all files with a new column mapping | ✅ Complete |
| Zoom state persisted across tab switches and in .bwt save/load | ✅ Complete |
| Redistribution scenario selection persists across tab switches | ✅ Complete |
| Export PDF — print dialog, landscape, logo + metadata header, no zoom bar | ✅ Complete |
| Export PDF — theme-aware colors (reads CSS vars at call time) | ✅ Complete |
| Export PDF — KPI cards included below chart | ✅ Complete |
| Light/dark mode toggle (header button, persists to localStorage) | ✅ Complete |
| Configure tab — Primary/Accent/Secondary Accent color pickers | ✅ Complete |
| Configure tab — font size (S/M/L) and font family selector | ✅ Complete |
| Configure tab — Reset to Defaults | ✅ Complete |
| Logo switches by theme (`logo.png` dark, `logo_navy.png` light) | ✅ Complete |
| 3-color system wired through all charts and KPI cards | ✅ Complete |
| Thicker data date reference lines on all charts | ✅ Complete |
| Browser-based session persistence (survive page refresh) | 🔴 Not Started (deprioritized) |
| **Save/Load — Production:** Save session JSON to SharePoint library via MS Graph | 🔴 Not Started |
| **Save/Load — Production:** Browse & load project files from SharePoint library | 🔴 Not Started |
| Azure hosting + CI/CD | 🔴 Not Started |
| Entra ID / MSAL authentication | 🔴 Not Started |
| SharePoint data persistence | 🔴 Not Started |

---

## 4. File / Folder Structure

```
bow-wave-tool/
├── electron/
│   └── main.cjs                 ✅ Electron entry point (CommonJS — required due to "type": "module" in package.json)
├── public/
│   ├── app_icon.ico             ✅ App icon (must be 256x256+)
│   ├── logo.png                 ✅ Logo for dark mode
│   └── logo_navy.png            ✅ Logo for light mode
├── release/                     🚫 Gitignored — output folder for built .exe
│   └── Bow Wave Analysis X.X.X.exe
├── src/
│   ├── components/
│   │   ├── ActivityFilter.jsx        ✅ Kept in repo but no longer used in main flow
│   │   ├── BowWaveChart.jsx          ✅ Recharts stacked bar chart; Group By split; renders KpiCards inside exportRef
│   │   ├── BowWaveMagnitudeChart.jsx ✅ Line chart — in-flight work trend across N schedules
│   │   ├── ColumnMapper.jsx          ✅ Single-file column mapping UI (kept for reference)
│   │   ├── ConfigureTab.jsx          ✅ Theme toggle, 3 color pickers, font size/family, Reset to Defaults
│   │   ├── DualColumnMapper.jsx      ✅ Both schedules side by side, one confirm button
│   │   ├── DualRangeSlider.jsx       ✅ Two-thumb range slider; track/thumbs follow Primary Color
│   │   ├── FileUpload.jsx            ✅ Drag & drop N-file upload; shared column mapping; no filter step
│   │   ├── FilterBar.jsx             ✅ Add/remove filter columns; multi-select; applies to all schedules
│   │   ├── Header.jsx                ✅ Logo (theme-aware), project info, Save/New Project, theme toggle, Report a Bug
│   │   ├── Instructions.jsx          ✅ Full step-by-step instructions page
│   │   ├── KpiCards.jsx              ✅ Planned/Actual/Delta cards; renders as fragment; colors follow accent system
│   │   ├── MultiScheduleChart.jsx    ✅ Trend charts container; latest=Primary, previous=SecondaryAccent cycling
│   │   ├── ProjectInfo.jsx           ✅ Project name + number inputs
│   │   ├── RemapColumnsModal.jsx     ✅ Re-parse all files with a new column mapping
│   │   ├── SCurveChart.jsx           ✅ Cumulative planned hours S-curve; latest=Primary, others=SecondaryAccent cycling
│   │   ├── ScheduleData.jsx          ✅ Virtualized activity table with filters + column manager
│   │   ├── ScenarioTabs.jsx          ✅ 4 redistribution scenario tabs; state initialized from scenarioConfig prop
│   │   ├── VersionBanner.jsx         ✅ Checks GitHub Releases on launch; green toast or amber update banner
│   │   └── BugReportModal.jsx        ✅ Posts to GitHub Issues API with bug label
│   ├── data/
│   │   └── exampleProject.js    ✅ Hardcoded example schedule data
│   ├── parsers/
│   │   ├── parseCsv.js          ✅ PapaParse wrapper
│   │   ├── parseExcel.js        ✅ SheetJS wrapper
│   │   ├── parseFile.js         ✅ Format dispatcher
│   │   └── parseXer.js          ✅ Custom XER parser — validated with real file
│   ├── contexts/
│   │   └── ThemeContext.jsx     ✅ theme, accent, accentB, accentC, fontSize, fontFamily — persists to localStorage
│   ├── hooks/
│   │   └── useChartColors.js   ✅ Returns theme-aware color strings for Recharts SVG props; accent values from context (not CSS vars) to avoid timing lag
│   ├── utils/
│   │   ├── applyMapping.js      ✅ Remaps raw rows to standard fields (preserves all cols)
│   │   ├── bowWaveCalc.js       ✅ Core bow wave calculation
│   │   ├── buildChartData.js    ✅ Monthly chart data + redistribution scenarios + category grouping
│   │   │                           Exports: buildChartData, buildBowWaveMagnitudeData,
│   │   │                                    buildSCurveData, buildChartDataByCategory
│   │   ├── columnMapping.js     ✅ Auto-match logic + aliases + required fields
│   │   ├── exportChart.js       ✅ Print-to-PDF via window.print(); reads CSS vars at call time for theme-aware colors; logo from DOM img (theme-aware automatically)
│   │   └── trackUsage.js        ✅ Appends ISO timestamp to GitHub Gist on app open
│   ├── App.jsx                  ✅ Root layout, state, tab routing
│   ├── main.jsx                 ✅ Wraps app in ThemeProvider
│   └── index.css                ✅ Tailwind v4 config; @theme inline; dark + light CSS var palettes
├── .gitignore                   ✅ Excludes node_modules/, dist/, release/
├── index.html
├── vite.config.js               ✅ base: './' required for Electron file:// protocol; injects __APP_VERSION__
└── package.json                 ✅ Version field drives .exe filename — run npm install after bumping
```

---

## 5. Environment Setup

```bash
# Prerequisites
# - Node.js v24, npm v11
# - VS Code with Remote - Tunnels (optional — for remote dev)
# - Git

# Clone and install
git clone https://github.com/michaelboylan23/bow-wave-tool
cd bow-wave-tool
npm install

# Run dev server (browser)
npm run dev
# → http://localhost:5173

# Run in Electron window (dev)
# Terminal 1:
npm run dev
# Terminal 2:
npx electron .

# Build portable .exe (must run PowerShell as Administrator)
npm run electron:build
# → release/Bow Wave Analysis X.X.X.exe
```

---

## 6. Electron Notes

- `electron/main.cjs` must use `.cjs` extension because `package.json` has `"type": "module"`
- `vite.config.js` must have `base: './'` for asset paths to resolve correctly from `file://`
- Build must be run from **Administrator PowerShell** — electron-builder needs symlink privileges for winCodeSign
- The portable `.exe` bundles Chromium + Node + the full React app — end users need nothing installed
- Windows SmartScreen will show a one-time "Unknown publisher" warning — users click "More info → Run anyway"
- `release/` is gitignored — distribute the `.exe` via SharePoint, Teams, or direct file transfer

---

## 7. Distribution Workflow

1. Make code changes and test via `npm run dev`
2. Bump `"version"` in `package.json` (e.g. `"1.1.1"` → `"1.2.0"`)
3. Commit and push changes via git
4. Open PowerShell **as Administrator**
5. Run `git pull`
6. Run `npm install` — **required** to sync `package-lock.json`; electron-builder reads the version from the lockfile, not `package.json` directly
7. Run `npm run electron:build`
8. Find `release/Bow Wave Analysis X.X.X.exe`
9. Upload to SharePoint shared folder or send directly to team

---

## 8. Upload & Analysis Pipeline

```
Upload files (CSV / Excel / XER) — any number of schedules
        ↓
Auto-extract data date (XER only — reads PROJECT.last_recalc_date)
        ↓
Extract headers (union across all files, deduplicated)
  - Excel/CSV: row 1
  - XER: %F line under %T TASK only
  - XER: prepend synthetic start_date / end_date headers
        ↓
Unified Column Mapper (one shared mapping applied to all files)
  - Auto-match against first file's headers
  - All files must share the same logical column names
  - One confirm button
        ↓
Parse all files (applyMapping per file)
  - XER: join ACTVTYPE + ACTVCODE + TASKACTV onto each task row
  - XER: synthesize start_date / end_date by status_code:
      TK_Complete  → act_start_date  / act_end_date
      TK_Active    → act_start_date  / early_end_date
      TK_NotStart  → early_start_date / early_end_date
  - XER: normalize durations by day_hr_cnt from CALENDAR table
  - All formats: spread raw row first (...row) then overwrite standard fields
  - Each schedule stored as { id, fileName, dataDate, rawRows, filteredRows }
        ↓
onSchedulesReady(uploadedSchedules, filterConfig=[])
        ↓
Analysis Tab
  - Reorder schedules (▲/▼) or delete (✕)
  - Two-Schedule Bow Wave: pick Schedule 1 + 2, run calcBowWave
    → "Two-Schedule Bow Wave" tab appears
  - Multi-Schedule Trend: run across all schedules
    → "Multi-Schedule Trend" tab appears
        ↓
Results Tabs (FilterBar inline — add/remove columns, apply to all schedules)
  Two-Schedule Bow Wave:
    - KPI cards + ScenarioTabs (4 redistribution scenarios)
    - BowWaveChart — Group by any non-core column
  Multi-Schedule Trend:
    - BowWaveMagnitudeChart — in-flight work per schedule
    - SCurveChart — cumulative planned hours per schedule
```

---

## 9. Core Calculation Logic

**Step 1 — Identify the window:**
Window = Data Date 1 → Data Date 2

**Step 2 — Planned hours in window (from Schedule 1):**
For each activity in S1 where the activity overlaps the window:
`overlap = min(Finish, DD2) - max(Start, DD1)`
Sum all overlapping original durations → **Planned**

**Step 3 — Actual completed hours in window (from Schedule 2):**
For each activity in S2, calculate completed hours:
`completed = Original Duration × (% Complete / 100)`
Filter to activities that were in-work during the window → **Actual**

**Step 4 — Delta:**
`Delta = Planned − Actual` → the bow wave

**Step 5 — Redistribution (4 scenarios):**
- Front-load: add all Delta to month immediately after DD2
- End-load: add all Delta to last month of schedule
- Distribute to end: `Delta ÷ months remaining` — adjustable via end-date picker
- Distribute to recovery: `Delta ÷ months between DD2 and user-chosen date`

---

## 10. .bwt Save Format

JSON file containing:

| Field | Description |
|---|---|
| `projectName` | Project name string |
| `projectNumber` | Project number string |
| `bowWaveResult` | Full calc result including windowStart/windowEnd as ISO date strings |
| `scheduleInfo` | earlyFile, lateFile, earlyDate, lateDate |
| `schedules` | `{ early: [...], late: [...] }` — filtered activity arrays |
| `rawSchedules` | `{ early: [...], late: [...] }` — unfiltered activity arrays for re-filtering |
| `filterConfig` | `[{ column, selectedValues: [] }]` — active filter state |
| `scenarioConfig` | `{ scenario, endDateOverride, recoveryDate }` |
| `unit` | `'hrs'` or `'days'` |
| `baseSchedule` | `'A'` or `'B'` |
| `bowWaveZoom` | `{ start, end }` — zoom state for Bow Wave chart (`end: -1` = full range) |
| `sCurveZoom` | `{ start, end }` — zoom state for S-Curve chart |
| `multiChartZoom` | `{ start, end }` — zoom state for Multi-Schedule Trend chart |
| `savedAt` | ISO timestamp |

On load, date strings in `bowWaveResult` (windowStart/windowEnd) and all `start_date`/`end_date` fields in activity arrays must be rehydrated to JS Date objects. Zoom fields default to `{ start: 0, end: -1 }` if absent (older saves).

---

## 11. XER Parser Notes

The XER format is tab-delimited with table markers:
- `%T` — table name
- `%F` — field names for the current table
- `%R` — data row
- `%E` — end of file

**Tables used:**
| Table | Purpose |
|---|---|
| `TASK` | Activity data |
| `PROJECT` | Data date (`last_recalc_date`) |
| `CALENDAR` | Hours per day (`day_hr_cnt`) for duration normalization |
| `ACTVTYPE` | Activity code type names (`actv_code_type_id` → `actv_code_type`) |
| `ACTVCODE` | Activity code values (`actv_code_id` → `short_name`) |
| `TASKACTV` | Links tasks to their activity code values |

**Duration normalization:**
P6 stores durations in raw hours in XER. Excel exports divide by `day_hr_cnt`. The parser reads `day_hr_cnt` from the default (or first) calendar and divides `target_drtn_hr_cnt` and `remain_drtn_hr_cnt` accordingly.

---

## 12. Blockers & Notes

| Item | Status | Notes |
|---|---|---|
| XER validation | ✅ Complete | Validated with real project file |
| Electron portable build | ✅ Complete | Must build from Admin PowerShell due to symlink requirement |
| SharePoint library URL | 🟡 Pending | Needed for Phase 3 Graph API integration |
| Azure subscription access | 🟡 Pending | IT may need to provision or approve |
| Logo files | ✅ Complete | `public/logo.png` (dark mode), `public/logo_navy.png` (light mode) |

---

## 13. Production Migration Checklist

- [ ] Register app in Microsoft Entra ID
- [ ] Install and configure MSAL for React (`@azure/msal-react`)
- [ ] Create Azure Static Web Apps resource + connect GitHub repo
- [ ] Configure GitHub Actions for CI/CD
- [ ] Create Azure Function as API proxy (if needed for any server-side calls)
- [ ] Set up Azure Key Vault for secrets
- [ ] Connect to SharePoint library via MS Graph API for data persistence
- [ ] Set up Teams tab manifest for embedding

---

*This document is updated at the end of each milestone.*
