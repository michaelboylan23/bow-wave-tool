import { useRef, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatMonthLabel } from '../utils/buildChartData'
import DualRangeSlider from './DualRangeSlider'
import { exportChart } from '../utils/exportChart'
import { useChartColors } from '../hooks/useChartColors'

const CAT_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#f43f5e', '#84cc16', '#06b6d4']

// ── Tooltip ───────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, unit, series, seriesOverrides, groupByColumn, allCategories }) => {
  if (!active || !payload || !payload.length) return null
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  const fmt = (v) => toVal(v).toLocaleString('en-US', { maximumFractionDigits: 1 })

  const getDisplayLabel = (id) => {
    const ov = seriesOverrides[id] || {}
    const s = series.find(x => x.id === id)
    return ov.label?.trim() || s?.fileName?.replace(/\.[^.]+$/, '') || id
  }

  return (
    <div className="bg-card border border-line rounded-lg p-3 text-sm max-w-xs">
      <p className="text-fg font-semibold mb-2">{label}</p>

      {groupByColumn && allCategories.length > 0
        ? (() => {
            const groups = {}
            payload.forEach(p => {
              const catMatch = p.dataKey?.match(/^(.+)__cat__(.+)$/)
              if (catMatch) {
                const [, sId, cat] = catMatch
                if (!groups[sId]) groups[sId] = { cats: {}, total: 0 }
                groups[sId].cats[cat] = (groups[sId].cats[cat] || 0) + (p.value || 0)
                groups[sId].total += p.value || 0
              } else {
                groups[p.dataKey] = { isLine: true, value: p.value || 0, color: p.stroke || p.fill }
              }
            })
            return Object.entries(groups).map(([sId, data]) => {
              if (data.isLine) {
                return data.value > 0 ? (
                  <p key={sId} style={{ color: data.color }} className="text-xs">
                    {getDisplayLabel(sId)}: {fmt(data.value)} {u}
                  </p>
                ) : null
              }
              if (data.total === 0) return null
              return (
                <div key={sId} className="mb-1.5">
                  <p className="text-xs font-medium text-fg-2">
                    {getDisplayLabel(sId)}: {fmt(data.total)} {u}
                  </p>
                  {Object.entries(data.cats).filter(([, v]) => v > 0).map(([cat, v]) => {
                    const ci = allCategories.indexOf(cat)
                    return (
                      <p key={cat} className="text-xs pl-2"
                        style={{ color: CAT_COLORS[ci % CAT_COLORS.length] }}>
                        {cat}: {fmt(v)} {u}
                      </p>
                    )
                  })}
                </div>
              )
            })
          })()
        : payload.map(p =>
            p.value != null && p.value > 0 ? (
              <p key={p.dataKey} style={{ color: p.color || p.fill || p.stroke }} className="text-xs">
                {p.name}: {fmt(p.value)} {u}
              </p>
            ) : null
          )
      }
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortName(fileName, dataDate) {
  const base = fileName.replace(/\.[^.]+$/, '')
  const dd = dataDate
    ? new Date(dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    : ''
  return dd ? `${base} (${dd})` : base
}

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────────────

export default function MultiScheduleChart({
  multiSeriesData,
  unit,
  baselineId, onBaselineChange,
  uploadedSchedules,
  zoomStart, zoomEnd, onZoomChange,
  projectName, projectNumber,
  groupByColumn, onGroupByChange, groupByColumns,
  seriesOverrides, onSeriesOverridesChange,
}) {
  const exportRef = useRef(null)
  const cc = useChartColors()

  const { monthLabels = [], series = [], allCategories = [] } = multiSeriesData || {}

  const getOv = (id) => seriesOverrides[id] || {}
  const setOv = (id, key, val) =>
    onSeriesOverridesChange(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }))

  const isHidden     = (id) => getOv(id).hidden === true
  const getType      = (id) => getOv(id).chartType || (series.find(s => s.id === id)?.isLatest ? 'bar' : 'line')
  const getOverColor = (id) => getOv(id).color || null
  const getLabel     = (id) => getOv(id).label?.trim() || null

  // ── Auto-assign colors ─────────────────────────────────────────────────────
  const EXTRA_COLORS = ['#22c55e', '#ec4899', '#14b8a6', '#eab308', '#f43f5e', '#06b6d4']
  let colorIdx = 0
  const autoColor = {}
  series.forEach(s => {
    if (s.isLatest)   { autoColor[s.id] = cc.accent;  return }
    if (s.isBaseline) { autoColor[s.id] = '#facc15';  return }
    autoColor[s.id] = colorIdx === 0 ? cc.accentC : EXTRA_COLORS[(colorIdx - 1) % EXTRA_COLORS.length]
    colorIdx++
  })
  const effectiveColor = (id) => getOverColor(id) || autoColor[id] || cc.accent

  const startIdx     = zoomStart
  const endIdx       = zoomEnd < 0 ? monthLabels.length - 1 : Math.min(zoomEnd, monthLabels.length - 1)
  const toVal        = (v) => unit === 'hrs' ? v : v / 8
  const activeSeries = series.filter(s => !isHidden(s.id))

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (!monthLabels.length) return []
    return monthLabels.slice(startIdx, endIdx + 1).map(label => {
      const row = { month: label }
      series.filter(s => !(seriesOverrides[s.id]?.hidden)).forEach(s => {
        const type = seriesOverrides[s.id]?.chartType || (s.isLatest ? 'bar' : 'line')
        if (type === 'line' || !groupByColumn || !s.dataByCategory) {
          const hrs = s.dataByMonth[label] || 0
          row[s.id] = unit === 'hrs' ? hrs : hrs / 8
        } else {
          for (const cat of allCategories) {
            const hrs = s.dataByCategory[cat]?.[label] || 0
            row[`${s.id}__cat__${cat}`] = unit === 'hrs' ? hrs : hrs / 8
          }
        }
      })
      return row
    })
  }, [monthLabels, startIdx, endIdx, series, seriesOverrides, groupByColumn, allCategories, unit])

  // ── Early return — after all hooks ─────────────────────────────────────────
  if (!monthLabels.length || !series.length) return null

  // ── Reference lines ────────────────────────────────────────────────────────
  const dataDateLines = activeSeries.map(s => ({
    id:    s.id,
    label: formatMonthLabel(new Date(s.dataDate)),
    color: effectiveColor(s.id),
  }))

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!exportRef.current) return
    const meta = []
    if (projectNumber || projectName)
      meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    const baselineSched = (uploadedSchedules || []).find(s => s.id === baselineId)
    meta.push(`Baseline: ${baselineSched ? baselineSched.fileName : 'None'}`)
    if (groupByColumn) meta.push(`Group by: ${groupByColumn}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 'multi-schedule'
    exportChart(exportRef.current, meta, `${slug}-trend`)
  }

  // ── Chart elements ─────────────────────────────────────────────────────────
  const firstBarId = activeSeries.find(s => getType(s.id) === 'bar')?.id ?? null

  const chartElements = activeSeries.flatMap(s => {
    const type  = getType(s.id)
    const color = effectiveColor(s.id)
    const label = getLabel(s.id) || shortName(s.fileName, s.dataDate)

    if (type === 'line') {
      return [(
        <Line
          key={s.id}
          type="monotone"
          dataKey={s.id}
          name={label}
          stroke={color}
          strokeWidth={s.isBaseline ? 2 : 1.5}
          strokeDasharray={s.isBaseline ? '6 3' : undefined}
          dot={false}
          activeDot={{ r: 4 }}
          legendType={groupByColumn ? 'none' : undefined}
        />
      )]
    }

    // Ungrouped bar
    if (!groupByColumn || !s.dataByCategory || allCategories.length === 0) {
      return [(
        <Bar key={s.id} dataKey={s.id} name={label}
          fill={color} radius={[3, 3, 0, 0]} maxBarSize={28} />
      )]
    }

    // Grouped bar — stacked by category within this series, side-by-side across series
    return allCategories.map((cat, ci) => (
      <Bar
        key={`${s.id}__cat__${cat}`}
        dataKey={`${s.id}__cat__${cat}`}
        name={cat}
        stackId={s.id}
        fill={CAT_COLORS[ci % CAT_COLORS.length]}
        radius={ci === allCategories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
        legendType={s.id === firstBarId ? 'square' : 'none'}
        maxBarSize={28}
      />
    ))
  })

  const barSeriesInView = activeSeries.filter(s => getType(s.id) === 'bar')

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-6">
      <div ref={exportRef} className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-fg-2">
            Multi-Schedule Trend — Remaining Planned Work
          </h3>
          <div className="flex items-center gap-3 flex-wrap print:hidden">

            {groupByColumns && groupByColumns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-fg-3">Group by:</span>
                <select
                  value={groupByColumn || ''}
                  onChange={e => onGroupByChange(e.target.value || null)}
                  className="bg-control border border-line rounded-lg px-2 py-1 text-fg text-xs
                    focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">None</option>
                  {groupByColumns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-fg-3">Baseline:</span>
              <select
                value={baselineId || ''}
                onChange={e => onBaselineChange(e.target.value || null)}
                className="bg-control border border-line rounded-lg px-2 py-1 text-fg text-xs
                  focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">None</option>
                {(uploadedSchedules || []).map(s => (
                  <option key={s.id} value={s.id}>{s.fileName} ({s.dataDate})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-control hover:bg-muted
                text-fg-3 hover:text-fg text-xs font-medium transition-colors"
            >
              <DownloadIcon />
              Export PDF
            </button>
          </div>
        </div>

        {/* Category legend — grouped mode, only when there are visible bar series */}
        {groupByColumn && allCategories.length > 0 && barSeriesInView.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-3 text-xs text-fg-3">
              {allCategories.map((cat, ci) => (
                <span key={cat} className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm"
                    style={{ background: CAT_COLORS[ci % CAT_COLORS.length] }} />
                  {cat}
                </span>
              ))}
            </div>
            {barSeriesInView.length > 1 && (
              <p className="text-xs text-fg-4">
                Bar clusters left → right:{' '}
                {barSeriesInView
                  .map(s => getLabel(s.id) || s.fileName.replace(/\.[^.]+$/, ''))
                  .join(' · ')}
              </p>
            )}
          </div>
        )}

        <ResponsiveContainer key={`${unit}-${groupByColumn || 'none'}`} width="100%" height={420}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
            <XAxis
              dataKey="month"
              tick={{ fill: cc.tick, fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              tickMargin={12}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: cc.tick, fontSize: 11 }}
              label={{
                value: unit === 'hrs' ? 'Hours' : 'Work Days',
                angle: -90,
                position: 'insideLeft',
                fill: cc.tick,
                fontSize: 12,
              }}
            />
            <Tooltip content={
              <CustomTooltip
                unit={unit}
                series={series}
                seriesOverrides={seriesOverrides}
                groupByColumn={groupByColumn}
                allCategories={allCategories}
              />
            } />
            {!groupByColumn && (
              <Legend wrapperStyle={{ paddingTop: '20px', color: cc.tick, fontSize: '11px' }} />
            )}

            {dataDateLines.map(dl => (
              <ReferenceLine
                key={dl.id}
                x={dl.label}
                stroke={dl.color}
                strokeWidth={2}
                strokeDasharray="3 3"
                strokeOpacity={0.7}
              />
            ))}

            {chartElements}
          </ComposedChart>
        </ResponsiveContainer>

      </div>{/* end exportRef */}

      {/* Zoom */}
      <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-3 font-medium uppercase tracking-wide">Zoom</p>
        <DualRangeSlider
          min={0}
          max={monthLabels.length - 1}
          start={startIdx}
          end={endIdx}
          onStartChange={(v) => onZoomChange(v, endIdx)}
          onEndChange={(v) => onZoomChange(startIdx, v)}
          startLabel={monthLabels[startIdx]}
          endLabel={monthLabels[endIdx]}
        />
      </div>

      {/* Schedules in View */}
      <div className="border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-4 uppercase tracking-wide font-medium mb-3">Schedules in View</p>
        <div className="flex flex-col gap-2">
          {[...series].reverse().map(s => {
            const ov       = getOv(s.id)
            const hidden   = ov.hidden === true
            const type     = getType(s.id)
            const color    = effectiveColor(s.id)
            const inputVal = ov.label != null ? ov.label : shortName(s.fileName, s.dataDate)

            return (
              <div key={s.id}
                className={`flex items-center gap-2 text-xs transition-opacity ${hidden ? 'opacity-40' : ''}`}
              >
                {/* Include / exclude */}
                <input
                  type="checkbox"
                  checked={!hidden}
                  onChange={e => setOv(s.id, 'hidden', !e.target.checked)}
                  className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-accent"
                  title={hidden ? 'Include in chart' : 'Exclude from chart'}
                />

                {/* Color swatch — clicking opens native color picker */}
                <label className="relative shrink-0 cursor-pointer" title="Click to change color">
                  <span className="flex w-4 h-4 rounded-sm border border-line/50"
                    style={{ background: color }} />
                  <input
                    key={ov.color || color}
                    type="color"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    defaultValue={ov.color || color}
                    onBlur={e => setOv(s.id, 'color', e.target.value)}
                  />
                </label>
                {ov.color && (
                  <button
                    onClick={() => setOv(s.id, 'color', null)}
                    className="shrink-0 text-fg-4 hover:text-fg leading-none"
                    title="Reset to default color"
                  >↺</button>
                )}

                {/* Bar / Line toggle */}
                <button
                  onClick={() => setOv(s.id, 'chartType', type === 'bar' ? 'line' : 'bar')}
                  className={`shrink-0 px-1.5 py-0.5 rounded border text-xs transition-colors ${
                    type === 'bar'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line text-fg-3 hover:border-fg-3'
                  }`}
                  title={type === 'bar' ? 'Switch to line' : 'Switch to bar'}
                >
                  {type === 'bar' ? '▬' : '—'}
                </button>

                {/* Editable name */}
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setOv(s.id, 'label', e.target.value)}
                  onBlur={e => { if (!e.target.value.trim()) setOv(s.id, 'label', null) }}
                  className={`flex-1 min-w-0 bg-transparent border-b border-transparent
                    hover:border-line focus:border-accent outline-none py-0.5
                    ${s.isLatest ? 'text-fg font-medium' : 'text-fg-3'}`}
                  placeholder={shortName(s.fileName, s.dataDate)}
                />

                {s.isBaseline && (
                  <span className="shrink-0 text-yellow-400 font-medium">Baseline</span>
                )}
                {s.isLatest && (
                  <span className="shrink-0 font-medium" style={{ color: cc.accent }}>Latest</span>
                )}

                <span className="shrink-0 text-fg-4">
                  {s.dataDate
                    ? new Date(s.dataDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
