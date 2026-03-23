import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

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

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg bg-control hover:bg-muted text-fg-3 hover:text-fg transition-colors"
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  )
}

export default function Header({
  projectName, projectNumber,
  onProjectNameChange, onProjectNumberChange,
  hasAnalysis, onSave, onNewProject, onReportBug,
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
          <ThemeToggle />
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
