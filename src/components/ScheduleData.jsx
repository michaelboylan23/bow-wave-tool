import { useState, useMemo, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

const FIXED_COLS = [
  { key: 'task_code',          label: 'Activity ID' },
  { key: 'task_name',          label: 'Activity Name' },
  { key: 'start_date',         label: 'Start' },
  { key: 'end_date',           label: 'Finish' },
  { key: 'target_drtn_hr_cnt', label: 'Orig Dur (h)' },
  { key: 'remain_drtn_hr_cnt', label: 'Rem Dur (h)' },
  { key: 'complete_pct',       label: '% Complete' },
  { key: 'status_code',        label: 'Status' },
  { key: 'task_type',          label: 'Type' },
]

const FIXED_KEYS = new Set(FIXED_COLS.map(c => c.key))

function formatVal(key, val) {
  if (val === null || val === undefined || val === '') return '—'
  if (val instanceof Date) return val.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (key === 'complete_pct') return `${Number(val).toFixed(1)}%`
  if (key === 'target_drtn_hr_cnt' || key === 'remain_drtn_hr_cnt') return Number(val).toLocaleString()
  return String(val)
}

// schedules: [{ id, fileName, dataDate, filteredRows }]
export default function ScheduleData({ schedules }) {
  const [activeId, setActiveId] = useState(() => schedules?.[0]?.id ?? null)
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [startFrom, setStartFrom]           = useState('')
  const [startTo, setStartTo]               = useState('')
  const [sortKey, setSortKey]               = useState('task_code')
  const [sortDir, setSortDir]               = useState('asc')
  const [showColModal, setShowColModal]     = useState(false)
  const [colConfig, setColConfig]           = useState(null)

  const tableScrollRef  = useRef(null)
  const bottomScrollRef = useRef(null)
  const isSyncingRef    = useRef(false)
  const phantomRef      = useRef(null)
  const dragIndex       = useRef(null)

  const activeSchedule = schedules?.find(s => s.id === activeId) ?? schedules?.[0]
  const activities = activeSchedule?.filteredRows ?? []

  const allCols = useMemo(() => {
    if (!activities.length) return FIXED_COLS
    const extraCols = Object.keys(activities[0])
      .filter(k => !FIXED_KEYS.has(k))
      .map(k => ({ key: k, label: k }))
    return [...FIXED_COLS, ...extraCols]
  }, [activities])

  useEffect(() => {
    setColConfig(allCols.map(c => ({ ...c, visible: true })))
  }, [activeId])

  const visibleCols = useMemo(() =>
    (colConfig ?? allCols).filter(c => c.visible),
    [colConfig, allCols]
  )

  const statuses = useMemo(() => {
    const s = new Set(activities.map(a => a.status_code).filter(Boolean))
    return [...s].sort()
  }, [activities])

  const filtered = useMemo(() => {
    let rows = activities
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter(r =>
        String(r.task_code ?? '').toLowerCase().includes(q) ||
        String(r.task_name ?? '').toLowerCase().includes(q)
      )
    }
    if (statusFilter) rows = rows.filter(r => r.status_code === statusFilter)
    if (startFrom)    rows = rows.filter(r => r.start_date && r.start_date >= new Date(startFrom))
    if (startTo)      rows = rows.filter(r => r.start_date && r.start_date <= new Date(startTo))
    return rows
  }, [activities, search, statusFilter, startFrom, startTo])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (av instanceof Date && bv instanceof Date) return sortDir === 'asc' ? av - bv : bv - av
      av = String(av ?? '')
      bv = String(bv ?? '')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [filtered, sortKey, sortDir])

  // Virtualizer — 36px matches the py-2.5 row height
  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 36,
    overscan: 10,
  })

  const virtualRows    = rowVirtualizer.getVirtualItems()
  const totalHeight    = rowVirtualizer.getTotalSize()
  const paddingTop     = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom  = virtualRows.length > 0 ? totalHeight - virtualRows[virtualRows.length - 1].end : 0

  // Sync phantom scrollbar
  useEffect(() => {
    const table  = tableScrollRef.current
    const bottom = bottomScrollRef.current
    if (!table || !bottom) return
    const onTableScroll = () => {
      if (isSyncingRef.current) return
      isSyncingRef.current = true
      bottom.scrollLeft = table.scrollLeft
      isSyncingRef.current = false
    }
    const onBottomScroll = () => {
      if (isSyncingRef.current) return
      isSyncingRef.current = true
      table.scrollLeft = bottom.scrollLeft
      isSyncingRef.current = false
    }
    table.addEventListener('scroll', onTableScroll)
    bottom.addEventListener('scroll', onBottomScroll)
    return () => {
      table.removeEventListener('scroll', onTableScroll)
      bottom.removeEventListener('scroll', onBottomScroll)
    }
  }, [])

  useEffect(() => {
    const table = tableScrollRef.current
    if (!table) return
    const update = () => {
      if (phantomRef.current) phantomRef.current.style.width = table.scrollWidth + 'px'
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(table)
    return () => ro.disconnect()
  }, [visibleCols, activities])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="text-gray-600 ml-1">↕</span>
    return <span className="text-blue-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const onDragStart = (i) => { dragIndex.current = i }
  const onDrop = (i) => {
    if (dragIndex.current === null || dragIndex.current === i) return
    setColConfig(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex.current, 1)
      next.splice(i, 0, moved)
      dragIndex.current = null
      return next
    })
  }
  const toggleCol  = (key) => setColConfig(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c))
  const resetCols  = () => setColConfig(allCols.map(c => ({ ...c, visible: true })))

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-12rem)] min-h-0">

      {/* Schedule selector — one button per uploaded schedule */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {(schedules ?? []).map((s, i) => {
          const ddLabel = s.dataDate
            ? new Date(s.dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : ''
          return (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`flex flex-col items-start px-5 py-3 rounded-xl text-sm transition-colors border
                ${activeId === s.id
                  ? 'bg-blue-600/20 border-blue-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}
            >
              <span className="font-medium">{s.fileName}</span>
              {ddLabel && <span className="text-xs text-gray-400 mt-0.5">Data Date: {ddLabel}</span>}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end shrink-0">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Search</label>
          <input
            type="text"
            placeholder="Activity ID or Name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-56
              focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
              focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Start From</label>
          <input type="date" value={startFrom} onChange={e => setStartFrom(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
              focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Start To</label>
          <input type="date" value={startTo} onChange={e => setStartTo(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
              focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="ml-auto flex items-end">
          <button
            onClick={() => setShowColModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700
              hover:border-gray-500 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span>⊞</span> Columns
          </button>
        </div>
        {(search || statusFilter || startFrom || startTo) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setStartFrom(''); setStartTo('') }}
            className="text-xs text-gray-500 hover:text-white transition-colors pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Row count */}
      <p className="text-xs text-gray-500 shrink-0">
        Showing <span className="text-white font-medium">{sorted.length.toLocaleString()}</span> of{' '}
        <span className="text-white font-medium">{activities.length.toLocaleString()}</span> activities
        {' '}·{' '}
        <span className="text-white font-medium">{visibleCols.length}</span> of{' '}
        <span className="text-white font-medium">{(colConfig ?? allCols).length}</span> columns shown
      </p>

      {/* Table */}
      <div
        ref={tableScrollRef}
        className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-800"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .schedule-table-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-900 border-b border-gray-800">
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide
                    whitespace-nowrap cursor-pointer select-none hover:text-white transition-colors"
                >
                  {col.label}<SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr><td style={{ height: paddingTop }} colSpan={visibleCols.length} /></tr>
            )}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} className="text-center py-12 text-gray-600 text-sm">
                  No activities match the current filters.
                </td>
              </tr>
            ) : virtualRows.map(vRow => {
              const row = sorted[vRow.index]
              return (
                <tr
                  key={vRow.index}
                  className={`border-b border-gray-800/50 transition-colors hover:bg-gray-900/60
                    ${vRow.index % 2 === 0 ? '' : 'bg-gray-900/20'}`}
                >
                  {visibleCols.map(col => (
                    <td key={col.key} className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                      {formatVal(col.key, row[col.key])}
                    </td>
                  ))}
                </tr>
              )
            })}
            {paddingBottom > 0 && (
              <tr><td style={{ height: paddingBottom }} colSpan={visibleCols.length} /></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phantom scrollbar */}
      <div
        ref={bottomScrollRef}
        className="shrink-0 overflow-x-auto bg-gray-950 border-t border-gray-800"
        style={{ height: '16px' }}
      >
        <div ref={phantomRef} style={{ height: '1px' }} />
      </div>

      {/* Column selector modal */}
      {showColModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold text-base">Select & Rearrange Columns</h2>
              <button onClick={resetCols} className="text-xs text-gray-500 hover:text-white transition-colors">
                Reset to default
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-1">
              {(colConfig ?? allCols).map((col, i) => (
                <div
                  key={col.key}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(i)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-800
                    cursor-default select-none border border-transparent hover:border-gray-700 transition-colors"
                >
                  <span className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing text-lg leading-none">⠿</span>
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleCol(col.key)}
                    className="accent-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className={`text-sm flex-1 ${col.visible ? 'text-white' : 'text-gray-500'}`}>
                    {col.label}
                  </span>
                  {!FIXED_KEYS.has(col.key) && (
                    <span className="text-xs text-gray-600 bg-gray-900 px-2 py-0.5 rounded-full">raw</span>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-800">
              <button
                onClick={() => setShowColModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}