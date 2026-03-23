export default function ProjectInfo({ projectName, projectNumber, onProjectNameChange, onProjectNumberChange }) {
  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-4 max-w-3xl">
      <div>
        <h2 className="text-sm font-semibold text-fg mb-1">Project Details</h2>
        <p className="text-xs text-fg-3">Required before analyzing schedules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-fg-3 font-medium">Project Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="e.g. Tegucigalpa Embassy"
            className="bg-control border border-line rounded-lg px-3 py-2 text-fg text-sm
              focus:outline-none focus:border-accent transition-colors placeholder-gray-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-fg-3 font-medium">Project Number <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={projectNumber}
            onChange={(e) => onProjectNumberChange(e.target.value)}
            placeholder="e.g. J19087"
            className="bg-control border border-line rounded-lg px-3 py-2 text-fg text-sm
              focus:outline-none focus:border-accent transition-colors placeholder-gray-600"
          />
        </div>
      </div>
    </div>
  )
}