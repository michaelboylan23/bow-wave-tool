import { useState } from 'react'

function EditableField({ value, onChange, placeholder, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    setEditing(false)
    if (draft.trim()) onChange(draft.trim())
    else setDraft(value)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={`bg-transparent border-b border-blue-500 focus:outline-none text-white ${className}`}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Click to edit"
      className={`cursor-pointer hover:text-blue-400 transition-colors ${className}`}
    >
      {value}
    </span>
  )
}

export default function Header({
  projectName, projectNumber,
  onProjectNameChange, onProjectNumberChange,
  hasAnalysis, onSave, onNewProject, onReportBug,
}) {
  return (
    <header className="w-full bg-gray-900 border-b border-gray-800 px-8 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

        {/* Logo + Project Info */}
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {projectName && (
            <div className="flex flex-col">
              <EditableField
                value={projectName}
                onChange={onProjectNameChange}
                placeholder="Project Name"
                className="text-white font-semibold text-base leading-tight"
              />
              {projectNumber && (
                <EditableField
                  value={projectNumber}
                  onChange={onProjectNumberChange}
                  placeholder="Project Number"
                  className="text-gray-400 text-xs"
                />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {projectName && (
            <>
              <button
                onClick={onSave}
                disabled={!hasAnalysis}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${hasAnalysis
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
              >
                Save Project
              </button>
              <button
                onClick={onNewProject}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                New Project
              </button>
            </>
          )}
          <button
            onClick={onReportBug}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-300 hover:text-red-400 hover:bg-gray-700 transition-colors"
          >
            Report a Bug
          </button>
        </div>

      </div>
    </header>
  )
}