import { useState, useEffect, useRef, useMemo } from 'react'

function getUniqueSharedValues(activitiesA, activitiesB, column) {
  const valsA = new Set(activitiesA.map(a => String(a[column] ?? '')).filter(Boolean))
  const valsB = new Set(activitiesB.map(a => String(a[column] ?? '')).filter(Boolean))
  return [...valsA].filter(v => valsB.has(v)).sort((a, b) => a.localeCompare(b))
}

function MultiSelectDropdown({ column, allValues, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  // Position dropdown using fixed coords from button's bounding rect
  const openDropdown = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: Math.max(rect.width, 192),
        zIndex: 9999,
      })
    }
    setOpen(o => !o)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on scroll or resize
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const allSelected = selected.size === allValues.length
  const noneSelected = selected.size === 0

  const label = noneSelected
    ? `${column}: none`
    : allSelected
      ? column
      : selected.size === 1
        ? `${column}: ${[...selected][0]}`
        : `${column}: ${selected.size} selected`

  const toggle = (val) => {
    const next = new Set(selected)
    if (next.has(val)) next.delete(val)
    else next.add(val)
    onChange(next)
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        onClick={openDropdown}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap
          ${!allSelected
            ? 'bg-blue-600/20 border-blue-500 text-white'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'}`}
      >
        {label}
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-72 overflow-y-auto"
        >
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-3 py-2 flex gap-3">
            <button
              onClick={() => onChange(new Set(allValues))}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              All
            </button>
            <button
              onClick={() => onChange(new Set())}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              None
            </button>
          </div>
          <div className="p-2 flex flex-col gap-0.5">
            {allValues.map(val => (
              <label
                key={val}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(val)}
                  onChange={() => toggle(val)}
                  className="accent-blue-500 w-3.5 h-3.5 shrink-0"
                />
                <span className={`text-xs truncate ${selected.has(val) ? 'text-white' : 'text-gray-400'}`}>
                  {val}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FilterBar({ rawSchedules, filterConfig, onApply }) {
  const buildPending = (fc) =>
    fc.map(f => ({ column: f.column, selected: new Set(f.selectedValues) }))

  const [pending, setPending] = useState(() => buildPending(filterConfig))

  useEffect(() => {
    setPending(buildPending(filterConfig))
  }, [filterConfig])

  const isDirty = useMemo(() => {
    if (pending.length !== filterConfig.length) return false
    return pending.some((p, i) => {
      const orig = new Set(filterConfig[i]?.selectedValues ?? [])
      if (p.selected.size !== orig.size) return true
      for (const v of p.selected) if (!orig.has(v)) return true
      return false
    })
  }, [pending, filterConfig])

  if (!filterConfig.length && !pending.length) return null

  const handleChange = (column, next) => {
    setPending(prev => prev.map(p => p.column === column ? { ...p, selected: next } : p))
  }

  const handleApply = () => {
    onApply(pending.map(p => ({
      column: p.column,
      selectedValues: [...p.selected],
    })))
  }

  const handleClearAll = () => {
    onApply(filterConfig.map(f => ({
      column: f.column,
      selectedValues: getUniqueSharedValues(rawSchedules.early, rawSchedules.late, f.column),
    })))
  }

  const anyFiltered = filterConfig.some(f => {
    const allVals = getUniqueSharedValues(rawSchedules.early, rawSchedules.late, f.column)
    return f.selectedValues.length < allVals.length
  })

  return (
    <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium shrink-0">Filters</p>

      {/* Scrollable filter chips */}
      <div className="flex-1 overflow-x-auto flex items-center gap-2 min-w-0 pb-1 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        {pending.map(p => {
          const allVals = getUniqueSharedValues(rawSchedules.early, rawSchedules.late, p.column)
          return (
            <MultiSelectDropdown
              key={p.column}
              column={p.column}
              allValues={allVals}
              selected={p.selected}
              onChange={(next) => handleChange(p.column, next)}
            />
          )
        })}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 shrink-0">
        {anyFiltered && !isDirty && (
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
        {isDirty && (
          <button
            onClick={handleApply}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold
              px-3 py-1.5 rounded-lg transition-colors"
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  )
}