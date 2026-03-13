export default function ProjectInfo({ projectName, projectNumber, onProjectNameChange, onProjectNumberChange }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-4 max-w-3xl">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">Project Details</h2>
        <p className="text-xs text-gray-400">Required before analyzing schedules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium">Project Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="e.g. Tegucigalpa Embassy"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
              focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium">Project Number <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={projectNumber}
            onChange={(e) => onProjectNumberChange(e.target.value)}
            placeholder="e.g. J19087"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
              focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
          />
        </div>
      </div>
    </div>
  )
}