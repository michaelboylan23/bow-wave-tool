const REQUIRED_COLUMNS = [
  { field: 'task_code',          label: 'Activity ID',            why: 'Unique identifier for each activity' },
  { field: 'task_name',          label: 'Activity Name',          why: 'Human-readable name for the activity' },
  { field: 'start_date',         label: 'Start',                  why: 'Planned or actual start date' },
  { field: 'end_date',           label: 'Finish',                 why: 'Planned or actual finish date' },
  { field: 'target_drtn_hr_cnt', label: 'Original Duration (h)',  why: 'Baseline duration in hours' },
  { field: 'remain_drtn_hr_cnt', label: 'Remaining Duration (h)', why: 'Hours of work remaining' },
  { field: 'complete_pct',       label: 'Activity % Complete',    why: 'Percent of work completed' },
  { field: 'status_code',        label: 'Activity Status',        why: 'Used to classify activities (Complete, In Progress, Not Started)' },
  { field: 'task_type',          label: 'Activity Type',          why: 'Identifies milestones, LOE, and other non-work activity types' },
]

function Step({ number, title, children }) {
  return (
    <section className="flex gap-5">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-fg text-sm font-bold shrink-0">
          {number}
        </div>
        <div className="flex-1 w-px bg-control" />
      </div>
      <div className="flex flex-col gap-3 pb-8 flex-1 min-w-0">
        <h3 className="text-base font-semibold text-fg mt-1">{title}</h3>
        {children}
      </div>
    </section>
  )
}

function Note({ children }) {
  return (
    <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg px-4 py-3">
      <p className="text-blue-300 text-xs leading-relaxed">{children}</p>
    </div>
  )
}

function Tag({ children }) {
  return (
    <span className="inline-block bg-control border border-line text-fg-2 font-mono text-xs px-2 py-0.5 rounded">
      {children}
    </span>
  )
}

export default function Instructions() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-1">How to Use the Bow Wave Analysis Tool</h2>
      <p className="text-fg-3 mb-8 text-sm leading-relaxed">
        This tool accepts multiple Primavera P6 schedule snapshots and supports two types of analysis:
        a <span className="text-fg font-medium">Two-Schedule Bow Wave</span> (comparing two snapshots to quantify
        unfinished planned work and visualize redistribution scenarios) and a{' '}
        <span className="text-fg font-medium">Multi-Schedule Trend</span> (tracking workload and progress across
        three or more schedule snapshots over time).
      </p>

      <div className="flex flex-col">

        <Step number="1" title="Export Schedule Snapshots from P6">
          <p className="text-fg-2 text-sm leading-relaxed">
            Export one snapshot per schedule update you want to analyse. In P6, go to{' '}
            <span className="text-fg font-medium">File → Export</span> and choose{' '}
            <span className="text-fg font-medium">CSV</span>,{' '}
            <span className="text-fg font-medium">Excel (.xlsx)</span>, or{' '}
            <span className="text-fg font-medium">XER</span>.
            For a basic bow wave comparison you need at least two files; for trend analysis upload as many snapshots as you have.
          </p>
          <Note>
            XER files are recommended — the tool automatically extracts the Data Date and activity code columns,
            saving manual entry. For CSV and Excel, make sure the export includes the columns listed in Step 2.
          </Note>
        </Step>

        <Step number="2" title="Include the Required Columns">
          <p className="text-fg-3 text-sm mb-2">
            Your export must include the following fields. The tool will attempt to auto-match column names —
            if any can't be matched you'll be prompted to map them manually.
          </p>
          <div className="overflow-x-auto rounded-xl border border-line-subtle">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-card border-b border-line-subtle">
                  <th className="px-4 py-2.5 text-left text-fg-3 font-medium text-xs uppercase tracking-wide">Field (P6)</th>
                  <th className="px-4 py-2.5 text-left text-fg-3 font-medium text-xs uppercase tracking-wide">Label</th>
                  <th className="px-4 py-2.5 text-left text-fg-3 font-medium text-xs uppercase tracking-wide">Why It's Needed</th>
                </tr>
              </thead>
              <tbody>
                {REQUIRED_COLUMNS.map((col, i) => (
                  <tr key={col.field} className={`border-b border-line-subtle/50 ${i % 2 === 0 ? '' : 'bg-card/30'}`}>
                    <td className="px-4 py-2.5 font-mono text-blue-400 text-xs whitespace-nowrap">{col.field}</td>
                    <td className="px-4 py-2.5 text-fg text-xs whitespace-nowrap">{col.label}</td>
                    <td className="px-4 py-2.5 text-fg-3 text-xs">{col.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Step>

        <Step number="3" title="Enter a Project Name and Number">
          <p className="text-fg-2 text-sm leading-relaxed">
            On the <span className="text-fg font-medium">Analysis</span> tab, enter a project name and number before uploading files.
            These are required and will be used to name your saved project file.
          </p>
        </Step>

        <Step number="4" title="Upload Your Schedule Files and Confirm Data Dates">
          <p className="text-fg-2 text-sm leading-relaxed">
            Drag and drop or browse to upload your schedule files — you can add as many as you like in one go or add them one at a time.
            Each file needs a <span className="text-fg font-medium">Data Date</span> — the as-of date through which progress was recorded.
            For XER files this is extracted automatically. For CSV and Excel, enter it manually using the date picker next to each file.
          </p>
          <p className="text-fg-2 text-sm leading-relaxed">
            Use the <span className="text-fg font-medium">▲ / ▼</span> buttons to reorder schedules
            or <span className="text-fg font-medium">✕</span> to remove one before continuing.
            All schedules must have a Data Date before you can proceed.
          </p>
          <Note>
            All schedules must share the same column structure — one set of column mappings is applied to all uploaded files.
          </Note>
        </Step>

        <Step number="5" title="Map Columns">
          <p className="text-fg-2 text-sm leading-relaxed">
            The tool will auto-match columns where possible —
            green <span className="text-green-400 font-medium">✓ Matched</span> means the column was found automatically.
            Any unmatched fields shown as <span className="text-yellow-400 font-medium">⚠ Needed</span> must be
            selected from the dropdown before you can continue.
            This single mapping is applied to all uploaded schedules.
            Click <span className="text-fg font-medium">Confirm Mapping & Continue</span> when all fields are matched.
          </p>
        </Step>

        <Step number="6" title="Run an Analysis">
          <p className="text-fg-2 text-sm leading-relaxed">
            Back on the <span className="text-fg font-medium">Analysis</span> tab you'll see your loaded schedules.
            Choose the type of analysis to run:
          </p>
          <ul className="flex flex-col gap-1.5 mt-1">
            {[
              ['Two-Schedule Bow Wave', 'Select a Schedule 1 (earlier) and Schedule 2 (later) from the dropdowns, then click Run Bow Wave Analysis. The tool auto-detects which is earlier based on Data Date.'],
              ['Multi-Schedule Trend', 'Click Run Multi-Schedule Trend to analyse all loaded schedules together and plot how in-flight work and cumulative progress change over time.'],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2 text-sm">
                <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                <span className="text-fg-2"><span className="text-fg font-medium">{label}</span> — {desc}</span>
              </li>
            ))}
          </ul>
          <Note>
            You can run both analyses in the same session — results appear in separate tabs and coexist independently.
          </Note>
        </Step>

        <Step number="7" title="Review Results">
          <p className="text-fg-2 text-sm leading-relaxed">
            Results appear in one or both of the following tabs:
          </p>
          <ul className="flex flex-col gap-2 mt-1">
            {[
              ['Two-Schedule Bow Wave', [
                'KPI cards — Planned hours, Actual completed hours, Bow Wave (Delta), and Completion % for the window',
                'Workload chart — monthly stacked bar chart with planned work and bow wave; use the Group by dropdown to split bars by any column (e.g. CLIN, phase, responsibility)',
                'Redistribution scenarios — four tabs showing how the bow wave could be redistributed: Front-Load, End-Load, Distribute to End, and Distribute to Recovery',
              ]],
              ['Multi-Schedule Trend', [
                'In-Flight Work Trend — line chart showing how much work was started but not finished at each schedule\'s Data Date; a rising trend indicates an accumulating backlog',
                'S-Curve — cumulative planned hours per schedule; helps visualise whether the project front-loaded or back-loaded work over successive updates',
              ]],
            ].map(([tab, items]) => (
              <li key={tab} className="flex flex-col gap-1 text-sm">
                <span className="text-fg font-medium">{tab}</span>
                <ul className="flex flex-col gap-1 pl-3">
                  {items.map(item => (
                    <li key={item} className="flex gap-2 text-sm">
                      <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                      <span className="text-fg-3">{item}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Step>

        <Step number="8" title="Filter Activities (Optional)">
          <p className="text-fg-2 text-sm leading-relaxed">
            Both result tabs include a <span className="text-fg font-medium">Filters</span> bar at the top.
            Click <span className="text-fg font-medium">+ Add filter</span> to select any column (e.g. CLIN, phase, responsibility) —
            only values present across all loaded schedules will appear as options.
            Uncheck values to exclude those activities, then click{' '}
            <span className="text-fg font-medium">Apply Filters</span> to instantly recalculate.
            Filters apply to all schedules simultaneously. Click the{' '}
            <span className="text-fg font-medium">✕</span> next to a filter chip to remove that column entirely.
          </p>
          <Note>
            Filters are applied at analysis time — your original data is always preserved and you can add, change, or
            remove filters at any time without re-uploading.
          </Note>
        </Step>

        <Step number="9" title="Explore Activity Data">
          <p className="text-fg-2 text-sm leading-relaxed">
            The <span className="text-fg font-medium">Schedule Data</span> tab shows the full activity table for each schedule.
            You can search, filter by status, filter by date range, sort any column, and use the{' '}
            <span className="text-fg font-medium">Columns</span> button to show, hide, and reorder columns.
            All columns from your original file are shown — not just the required fields.
          </p>
        </Step>

        <Step number="10" title="Save Your Work">
          <p className="text-fg-2 text-sm leading-relaxed">
            Click <span className="text-fg font-medium">Save Project</span> in the header to export the full session as a{' '}
            <Tag>.bwt</Tag> file. This includes your schedule data, filter configuration, scenario settings, and analysis results.
            To restore a saved session, go to the <span className="text-fg font-medium">Analysis</span> tab and use{' '}
            <span className="text-fg font-medium">Load Existing Project</span>.
          </p>
          <Note>
            .bwt files contain your full activity data. Keep them in a secure location if your schedule data is sensitive.
          </Note>
        </Step>

      </div>
    </div>
  )
}
