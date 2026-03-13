const REQUIRED_COLUMNS = [
  { field: 'task_code',          label: 'Activity ID',           why: 'Unique identifier for each activity' },
  { field: 'task_name',          label: 'Activity Name',         why: 'Human-readable name for the activity' },
  { field: 'start_date',         label: 'Start',                 why: 'Planned or actual start date' },
  { field: 'end_date',           label: 'Finish',                why: 'Planned or actual finish date' },
  { field: 'target_drtn_hr_cnt', label: 'Original Duration (h)', why: 'Baseline duration in hours' },
  { field: 'remain_drtn_hr_cnt', label: 'Remaining Duration (h)',why: 'Hours of work remaining' },
  { field: 'complete_pct',       label: 'Activity % Complete',   why: 'Percent of work completed' },
  { field: 'status_code',        label: 'Activity Status',       why: 'Used to classify activities (Complete, In Progress, Not Started)' },
  { field: 'task_type',          label: 'Activity Type',         why: 'Identifies milestones, LOE, and other non-work activity types' },
]

function Step({ number, title, children }) {
  return (
    <section className="flex gap-5">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {number}
        </div>
        <div className="flex-1 w-px bg-gray-800" />
      </div>
      <div className="flex flex-col gap-3 pb-8 flex-1 min-w-0">
        <h3 className="text-base font-semibold text-white mt-1">{title}</h3>
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
    <span className="inline-block bg-gray-800 border border-gray-700 text-gray-300 font-mono text-xs px-2 py-0.5 rounded">
      {children}
    </span>
  )
}

export default function Instructions() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-1">How to Use the Bow Wave Analysis Tool</h2>
      <p className="text-gray-400 mb-8 text-sm leading-relaxed">
        This tool compares two Primavera P6 schedule snapshots to calculate the "bow wave" —
        the volume of planned work that was not completed between two Data Dates — and visualizes
        four scenarios for redistributing that unfinished work going forward.
      </p>

      <div className="flex flex-col">

        <Step number="1" title="Export Two Schedule Snapshots from P6">
          <p className="text-gray-300 text-sm leading-relaxed">
            You need two schedule files — one for each snapshot you want to compare. Typically this is an earlier update and your most recent update.
            In P6, go to <span className="text-white font-medium">File → Export</span> and choose
            <span className="text-white font-medium"> CSV</span>, <span className="text-white font-medium">Excel (.xlsx)</span>,
            or export as <span className="text-white font-medium">XER</span>.
          </p>
          <Note>
            XER files are recommended — the tool will automatically extract the Data Date and activity code columns from the file,
            saving you manual entry. For CSV and Excel, make sure your export includes the columns listed in Step 2.
          </Note>
        </Step>

        <Step number="2" title="Include the Required Columns">
          <p className="text-gray-400 text-sm mb-2">
            Your export must include the following fields. The tool will attempt to auto-match column names —
            if any can't be matched automatically you'll be prompted to map them manually.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800">
                  <th className="px-4 py-2.5 text-left text-gray-400 font-medium text-xs uppercase tracking-wide">Field (P6)</th>
                  <th className="px-4 py-2.5 text-left text-gray-400 font-medium text-xs uppercase tracking-wide">Label</th>
                  <th className="px-4 py-2.5 text-left text-gray-400 font-medium text-xs uppercase tracking-wide">Why It's Needed</th>
                </tr>
              </thead>
              <tbody>
                {REQUIRED_COLUMNS.map((col, i) => (
                  <tr key={col.field} className={`border-b border-gray-800/50 ${i % 2 === 0 ? '' : 'bg-gray-900/30'}`}>
                    <td className="px-4 py-2.5 font-mono text-blue-400 text-xs whitespace-nowrap">{col.field}</td>
                    <td className="px-4 py-2.5 text-white text-xs whitespace-nowrap">{col.label}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{col.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Step>

        <Step number="3" title="Enter a Project Name and Number">
          <p className="text-gray-300 text-sm leading-relaxed">
            On the <span className="text-white font-medium">Analysis</span> tab, enter a project name and number before uploading files.
            These are required and will be used to name your saved project file.
          </p>
        </Step>

        <Step number="4" title="Upload Both Files and Confirm Data Dates">
          <p className="text-gray-300 text-sm leading-relaxed">
            Drag and drop or browse to upload both schedule files. Each file needs a
            <span className="text-white font-medium"> Data Date</span> — the as-of date through which progress was recorded.
            For XER files this is extracted automatically. For CSV and Excel, enter it manually.
          </p>
          <Note>
            The tool automatically detects which file is earlier and which is later based on the Data Dates.
            You can swap or edit Data Dates at any time from the Results page using the
            <span className="font-medium"> Edit Data Dates</span> button.
          </Note>
        </Step>

        <Step number="5" title="Map Columns">
          <p className="text-gray-300 text-sm leading-relaxed">
            Both schedules are shown side by side. The tool will auto-match columns where possible —
            green <span className="text-green-400 font-medium">✓ Matched</span> means the column was found automatically.
            Any unmatched fields shown in <span className="text-yellow-400 font-medium">⚠ Needed</span> must be
            selected from the dropdown before you can continue. Click <span className="text-white font-medium">Confirm Mapping & Continue</span> when all fields are matched on both sides.
          </p>
        </Step>

        <Step number="6" title="Configure Filters (Optional)">
          <p className="text-gray-300 text-sm leading-relaxed">
            After mapping, you can optionally filter which activities are included in the bow wave calculation.
            Click <span className="text-white font-medium">Add a filter column</span> to select any column that exists in both schedules —
            this is particularly useful for activity code columns like CLIN, phase, or responsibility.
            Only values present in both schedules will appear as options.
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Click <span className="text-white font-medium">Run Analysis</span> to apply filters, or
            <span className="text-white font-medium"> Skip & Run Analysis</span> to include all activities.
            Filters can be adjusted at any time from the Results page without re-uploading.
          </p>
        </Step>

        <Step number="7" title="Review Results">
          <p className="text-gray-300 text-sm leading-relaxed">
            The <span className="text-white font-medium">Results</span> tab shows:
          </p>
          <ul className="flex flex-col gap-1.5 mt-1">
            {[
              ['KPI cards', 'Planned hours, Actual completed hours, Bow Wave (Delta), and Completion % for the analysis window'],
              ['Workload chart', 'Monthly stacked bar chart showing planned work and bow wave by month'],
              ['Redistribution scenarios', 'Four tabs showing how the bow wave could be redistributed: Front-Load, End-Load, Distribute to End, and Distribute to Recovery'],
              ['Filter bar', 'If filters were configured, adjust them inline and click Apply Filters to recalculate instantly'],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-2 text-sm">
                <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                <span className="text-gray-300"><span className="text-white font-medium">{label}</span> — {desc}</span>
              </li>
            ))}
          </ul>
        </Step>

        <Step number="8" title="Explore Activity Data">
          <p className="text-gray-300 text-sm leading-relaxed">
            The <span className="text-white font-medium">Schedule Data</span> tab shows the full activity table for each schedule.
            You can search, filter by status, filter by date range, sort any column, and use the
            <span className="text-white font-medium"> Columns</span> button to show, hide, and reorder columns.
            All columns from your original file are shown — not just the 9 required fields.
          </p>
        </Step>

        <Step number="9" title="Save Your Work">
          <p className="text-gray-300 text-sm leading-relaxed">
            Click <span className="text-white font-medium">Save Project</span> in the header to export the full session as a
            <Tag>.bwt</Tag> file. This includes your schedule data, filter configuration, scenario settings, and analysis results.
            To restore a saved session, go to the <span className="text-white font-medium">Analysis</span> tab and use
            <span className="text-white font-medium"> Load Existing Project</span>.
          </p>
          <Note>
            .bwt files contain your full activity data. Keep them in a secure location if your schedule data is sensitive.
          </Note>
        </Step>

      </div>
    </div>
  )
}