import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext' // used for logo src

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
        className={`bg-transparent border-b border-accent focus:outline-none text-fg ${className}`}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Click to edit"
      className={`cursor-pointer hover:text-accent transition-colors ${className}`}
    >
      {value}
    </span>
  )
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  )
}

export default function Header({
  projectName, projectNumber,
  onProjectNameChange, onProjectNumberChange,
  hasAnalysis, onSave, onNewProject, onReportBug, onConfigure,
}) {
  const { theme } = useTheme()
  return (
    <header className="w-full bg-card border-b border-line-subtle px-8 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

        {/* Logo + Project Info */}
        <div className="flex items-center gap-4">
          <img
            src={theme === 'light' ? '/logo_navy.png' : '/logo.png'}
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
                className="text-fg font-semibold text-base leading-tight"
              />
              {projectNumber && (
                <EditableField
                  value={projectNumber}
                  onChange={onProjectNumberChange}
                  placeholder="Project Number"
                  className="text-fg-3 text-xs"
                />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onConfigure}
            title="Settings"
            className="p-2 rounded-lg bg-control hover:bg-muted text-fg-3 hover:text-fg transition-colors"
          >
            <GearIcon />
          </button>
          {projectName && (
            <>
              <button
                onClick={onSave}
                disabled={!hasAnalysis}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${hasAnalysis
                    ? 'bg-accent hover:bg-accent-hi text-white'
                    : 'bg-control text-fg-4 cursor-not-allowed'}`}
              >
                Save Project
              </button>
              <button
                onClick={onNewProject}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-control text-fg-2 hover:text-fg hover:bg-muted transition-colors"
              >
                New Project
              </button>
            </>
          )}
          <button
            onClick={onReportBug}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-control text-fg-2 hover:text-red-400 hover:bg-muted transition-colors"
          >
            Report a Bug
          </button>
        </div>

      </div>
    </header>
  )
}
