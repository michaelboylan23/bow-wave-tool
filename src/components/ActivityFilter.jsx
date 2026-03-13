import { useState, useMemo } from 'react'

function getColumns(activities) {
  if (!activities.length) return new Set()
  return new Set(Object.keys(activities[0]))
}

function getUniqueValues(activities, column) {
  const vals = new Set()
  for (const a of activities) {
    const v = a[column]
    if (v !== null && v !== undefined && v !== '') vals.add(String(v))
  }
  return vals
}

function applyFilters(activities, filters) {
  if (!filters.length) return activities
  return activities.filter(a =>
    filters.every(f => f.selectedValues.has(String(a[f.column] ?? '')))
  )
}

export default function ActivityFilter({ activitiesA, activitiesB, fileNameA, fileNameB, onConfirm, onSkip, initialFilters = [] }) {
  const [addedFilters, setAddedFilters] = useState(() =>
    initialFilters.map(f => ({ ...f, selectedValues: new Set(f.selectedValues) }))
  )
  // addedFilters: [{ column, selectedValues: Set }]

  // Columns that exist in both schedules
  const commonColumns = useMemo(() => {
    const colsA = getColumns(activitiesA)
    const colsB = getColumns(activitiesB)
    return [...colsA].filter(c => colsB.has(c)).sort((a, b) => a.localeCompare(b))
  }, [activitiesA, activitiesB])

  // Columns already added
  const addedKeys = new Set(addedFilters.map(f => f.column))

  // Available columns to add (not yet added)
  const availableColumns = commonColumns.filter(c => !addedKeys.has(c))

  const handleAddFilter = (column) => {
    if (!column) return
    // Values that exist in both schedules
    const valsA = getUniqueValues(activitiesA, column)
    const valsB = getUniqueValues(activitiesB, column)
    const shared = new Set([...valsA].filter(v => valsB.has(v)))
    if (!shared.size) return
    setAddedFilters(prev => [...prev, { column, selectedValues: new Set(shared) }])
  }

  const handleRemoveFilter = (column) => {
    setAddedFilters(prev => prev.filter(f => f.column !== column))
  }

  const handleToggleValue = (column, value) => {
    setAddedFilters(prev => prev.map(f => {
      if (f.column !== column) return f
      const next = new Set(f.selectedValues)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return { ...f, selectedValues: next }
    }))
  }

  const handleSelectAll = (column, allValues) => {
    setAddedFilters(prev => prev.map(f =>
      f.column === column ? { ...f, selectedValues: new Set(allValues) } : f
    ))
  }

  const handleSelectNone = (column) => {
    setAddedFilters(prev => prev.map(f =>
      f.column === column ? { ...f, selectedValues: new Set() } : f
    ))
  }

  const filteredA = useMemo(() => applyFilters(activitiesA, addedFilters), [activitiesA, addedFilters])
  const filteredB = useMemo(() => applyFilters(activitiesB, addedFilters), [activitiesB, addedFilters])

  const canRun = addedFilters.every(f => f.selectedValues.size > 0)

  // Serialize filterConfig for saving (convert Sets to arrays)
  const buildFilterConfig = () =>
    addedFilters.map(f => ({ column: f.column, selectedValues: [...f.selectedValues] }))

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold mb-1">Configure Filters</h2>
        <p className="text-gray-400 text-sm">
          Optionally filter which activities are included in the analysis.
          Only columns present in both schedules are available. Skip to include all activities.
        </p>
      </div>

      {/* Add filter row */}
      <div className="flex items-center gap-3">
        <select
          defaultValue=""
          onChange={e => { handleAddFilter(e.target.value); e.target.value = '' }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
            focus:outline-none focus:border-blue-500 transition-colors flex-1 max-w-xs"
        >
          <option value="">— Add a filter column —</option>
          {availableColumns.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {availableColumns.length === 0 && addedFilters.length > 0 && (
          <p className="text-gray-500 text-xs">All common columns added.</p>
        )}
      </div>

      {/* Active filters */}
      {addedFilters.map(f => {
        const valsA = getUniqueValues(activitiesA, f.column)
        const valsB = getUniqueValues(activitiesB, f.column)
        const sharedVals = [...valsA].filter(v => valsB.has(v)).sort((a, b) => a.localeCompare(b))

        return (
          <div key={f.column} className="bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-white font-medium text-sm">{f.column}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSelectAll(f.column, sharedVals)}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={() => handleSelectNone(f.column)}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleRemoveFilter(f.column)}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
            {f.selectedValues.size === 0 && (
              <p className="text-red-400 text-xs">At least one value must be selected.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {sharedVals.map(val => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.selectedValues.has(val)}
                    onChange={() => handleToggleValue(f.column, val)}
                    className="accent-blue-500 w-3.5 h-3.5"
                  />
                  <span className={`text-xs ${f.selectedValues.has(val) ? 'text-white' : 'text-gray-500'}`}>
                    {val}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )
      })}

      {/* Row count summary */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 px-5 py-4 flex flex-wrap gap-6">
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Schedule 1 — {fileNameA}</p>
          <p className="text-white text-sm">
            <span className="font-bold text-blue-400">{filteredA.length.toLocaleString()}</span>
            <span className="text-gray-400"> of {activitiesA.length.toLocaleString()} activities included</span>
          </p>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Schedule 2 — {fileNameB}</p>
          <p className="text-white text-sm">
            <span className="font-bold text-blue-400">{filteredB.length.toLocaleString()}</span>
            <span className="text-gray-400"> of {activitiesB.length.toLocaleString()} activities included</span>
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => onConfirm(filteredA, filteredB, buildFilterConfig())}
          disabled={!canRun}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors
            ${canRun
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          Run Analysis
        </button>
        <button
          onClick={() => onSkip()}
          className="px-6 py-3 rounded-xl font-semibold text-sm bg-gray-800 hover:bg-gray-700
            text-gray-300 hover:text-white transition-colors"
        >
          Skip & Run Analysis
        </button>
      </div>
    </div>
  )
}