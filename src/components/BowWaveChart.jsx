import { useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { formatMonthLabel } from '../utils/buildChartData'
import DualRangeSlider from './DualRangeSlider'
import { exportChart } from '../utils/exportChart'
import { useChartColors } from '../hooks/useChartColors'
import KpiCards from './KpiCards'

// Color palette for category bars
const CAT_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#f43f5e', '#84cc16', '#06b6d4']

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'

  // Build bw map keyed by the base cat__ key
  const bwByKey = {}
  payload.forEach(p => {
    if (p.dataKey?.endsWith('__bw')) {
      bwByKey[p.dataKey.slice(0, -4)] = p.value || 0
    }
  })

  const entries = payload.filter(p => !p.dataKey?.endsWith('__bw'))

  return (
    <div className="bg-card border border-line rounded-lg p-3 text-sm">
      <p className="text-fg font-semibold mb-2">{label}</p>
      {entries.map(p => {
        const bw      = bwByKey[p.dataKey] || 0
        const planned = p.value || 0
        if (planned + bw === 0) return null
        return (
          <p key={p.dataKey} style={{ color: p.fill }}>
            {p.name}: {toVal(planned).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
            {bw > 0 && (
              <span className="text-fg-3 text-xs">
                {' '}(+{toVal(bw).toLocaleString('en-US', { maximumFractionDigits: 1 })} bow wave)
              </span>
            )}
          </p>
        )
      })}
    </div>
  )
}

export default function BowWaveChart({
  chartData,
  bowWaveResult,
  unit,
  onUnitChange,
  baseSchedule,
  groupByColumn,
  onGroupByChange,
  groupByColumns,
  categoryChartData,
  zoomStart, zoomEnd, onZoomChange,
  projectName, projectNumber, scenarioConfig,
  categoryOverrides, onCategoryOverridesChange,
}) {
  const exportRef = useRef(null)
  const cc = useChartColors()

  // ── Overrides helpers ────────────────────────────────────────────────────────
  const getOv  = (key) => categoryOverrides?.[key] || {}
  const setOv  = (key, field, val) =>
    onCategoryOverridesChange(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: val } }))

  const activeData = categoryChartData ? categoryChartData.chartData : chartData
  if (!activeData || activeData.length === 0) return null

  const allCategories  = categoryChartData?.categories ?? []
  const visibleCats    = allCategories.filter(c => !getOv(c).hidden)

  const startIdx = zoomStart
  const endIdx   = zoomEnd < 0 ? activeData.length - 1 : Math.min(zoomEnd, activeData.length - 1)

  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const dataLabel = formatMonthLabel(bowWaveResult.windowEnd)

  const visibleData = activeData.slice(startIdx, endIdx + 1).map(d => {
    const row = { ...d, bowWave: toVal(d.bowWave) }
    if (categoryChartData) {
      for (const cat of allCategories) {
        row[`cat__${cat}`]      = toVal(d[`cat__${cat}`] || 0)
        row[`cat__${cat}__bw`]  = toVal(d[`cat__${cat}__bw`] || 0)
      }
    } else {
      row.planned = toVal(d.planned)
    }
    return row
  })

  // Effective color helpers
  const catColor      = (cat, i) => getOv(cat).color || CAT_COLORS[i % CAT_COLORS.length]
  const plannedColor  = () => getOv('__planned__').color || cc.accent
  const bowWaveColor  = () => getOv('__bowwave__').color || cc.accentB
  const plannedLabel  = () => getOv('__planned__').label?.trim() ||
    (baseSchedule === 'A' ? 'Planned Work (Schedule 1)' : 'Planned Work (Schedule 2)')
  const bowWaveLabel  = () => getOv('__bowwave__').label?.trim() || 'Bow Wave'

  const categories = visibleCats

  const SCENARIO_LABELS = {
    'front-load':            'Front-Load',
    'end-load':              'End-Load',
    'distribute-to-end':     'Distribute to End',
    'distribute-to-recovery':'Distribute to Recovery',
  }

  const handleExport = () => {
    if (!exportRef.current) return
    const meta = []
    if (projectNumber || projectName) meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    if (scenarioConfig?.scenario) meta.push(`Scenario: ${SCENARIO_LABELS[scenarioConfig.scenario] || scenarioConfig.scenario}`)
    meta.push(`Group by: ${groupByColumn || 'None'}`)
    meta.push(`Base schedule: Schedule ${baseSchedule}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 'bow-wave'
    exportChart(exportRef.current, meta, `${slug}-bow-wave`)
  }

  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-6">
      <div ref={exportRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-fg-2">
          Workload Distribution & Bow Wave Redistribution
        </h3>
        <div className="flex items-center gap-3 print:hidden">
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
                {groupByColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-control hover:bg-muted
              text-fg-3 hover:text-fg text-xs font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <ResponsiveContainer key={unit} width="100%" height={400}>
        <BarChart data={visibleData} margin={{ top: 10, right: 20, left: 20, bottom: 80 }}>

          {/* Hatch patterns for bow wave portions — one per category color */}
          <defs>
            {allCategories.map((cat, i) => {
              const color = catColor(cat, i)
              return (
                <pattern key={i} id={`bw-hatch-${i}`} x="0" y="0" width="8" height="8"
                  patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="3.5" />
                </pattern>
              )
            })}
          </defs>

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
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend wrapperStyle={{ paddingTop: '20px', color: cc.tick, fontSize: '12px' }} />
          <ReferenceLine
            x={dataLabel}
            stroke={bowWaveColor()}
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{ value: 'Data Date 2', position: 'insideTopRight', fill: bowWaveColor(), fontSize: 11, offset: 10 }}
          />

          {categoryChartData
            ? [
                // Solid planned bars per visible category
                ...categories.map((cat) => {
                  const i = allCategories.indexOf(cat)
                  return (
                    <Bar key={cat} dataKey={`cat__${cat}`}
                      name={getOv(cat).label?.trim() || cat}
                      stackId="a" fill={catColor(cat, i)} radius={[0, 0, 0, 0]} />
                  )
                }),
                // Hatched bow wave bars per visible category — hidden from legend
                ...categories.map((cat) => {
                  const i = allCategories.indexOf(cat)
                  return (
                    <Bar key={`${cat}__bw`} dataKey={`cat__${cat}__bw`}
                      name={`${getOv(cat).label?.trim() || cat} (Bow Wave)`}
                      stackId="a" fill={`url(#bw-hatch-${i})`}
                      radius={[4, 4, 0, 0]} legendType="none" />
                  )
                }),
              ]
            : [
                <Bar key="planned" dataKey="planned"
                  name={plannedLabel()}
                  stackId="a" fill={plannedColor()} radius={[0, 0, 0, 0]} />,
                <Bar key="bowWave" dataKey="bowWave"
                  name={bowWaveLabel()}
                  stackId="a" fill={bowWaveColor()} radius={[4, 4, 0, 0]} />,
              ]
          }
        </BarChart>
      </ResponsiveContainer>

      {/* Bow wave hatch legend note — only shown in grouped mode */}
      {categoryChartData && (
        <div className="flex items-center gap-2 -mt-2">
          <svg width="16" height="16">
            <defs>
              <pattern id="legend-hatch" x="0" y="0" width="8" height="8"
                patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="3.5" />
              </pattern>
            </defs>
            <rect width="16" height="16" fill="url(#legend-hatch)" rx="2" />
          </svg>
          <span className="text-xs text-fg-3">Hatched portion = Bow Wave</span>
        </div>
      )}

      {/* KPI summary — included in export */}
      <div className="border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-4 uppercase tracking-wide font-medium mb-3">Summary</p>
        <div className="grid grid-cols-4 gap-3">
          <KpiCards result={bowWaveResult} unit={unit} onUnitChange={onUnitChange} />
        </div>
      </div>

      </div>{/* end exportRef */}

      {/* Zoom Controls */}
      <div className="flex flex-col gap-3 border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-3 font-medium uppercase tracking-wide">Zoom</p>
        <DualRangeSlider
          min={0}
          max={activeData.length - 1}
          start={startIdx}
          end={endIdx}
          onStartChange={(v) => onZoomChange(v, endIdx)}
          onEndChange={(v) => onZoomChange(startIdx, v)}
          startLabel={activeData[startIdx]?.month}
          endLabel={activeData[endIdx]?.month}
        />
      </div>

      {/* In View controls */}
      <div className="border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-4 uppercase tracking-wide font-medium mb-3">
          {categoryChartData ? 'Categories in View' : 'Series in View'}
        </p>
        <div className="flex flex-col gap-2">
          {categoryChartData
            ? allCategories.map((cat, i) => {
                const ov     = getOv(cat)
                const hidden = ov.hidden === true
                const color  = catColor(cat, i)
                const inputVal = ov.label != null ? ov.label : cat
                return (
                  <div key={cat}
                    className={`flex items-center gap-2 text-xs transition-opacity ${hidden ? 'opacity-40' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={!hidden}
                      onChange={e => setOv(cat, 'hidden', !e.target.checked)}
                      className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-accent"
                      title={hidden ? 'Include in chart' : 'Exclude from chart'}
                    />
                    <label className="relative shrink-0 cursor-pointer" title="Click to change color">
                      <span className="flex w-4 h-4 rounded-sm border border-line/50"
                        style={{ background: color }} />
                      <input
                        key={ov.color || color}
                        type="color"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        defaultValue={ov.color || color}
                        onBlur={e => setOv(cat, 'color', e.target.value)}
                      />
                    </label>
                    {ov.color && (
                      <button
                        onClick={() => setOv(cat, 'color', null)}
                        className="shrink-0 text-fg-4 hover:text-fg leading-none"
                        title="Reset to default color"
                      >↺</button>
                    )}
                    <input
                      type="text"
                      value={inputVal}
                      onChange={e => setOv(cat, 'label', e.target.value)}
                      onBlur={e => { if (!e.target.value.trim()) setOv(cat, 'label', null) }}
                      className="flex-1 min-w-0 bg-transparent border-b border-transparent
                        hover:border-line focus:border-accent outline-none py-0.5 text-fg-3"
                      placeholder={cat}
                    />
                  </div>
                )
              })
            : [
                { key: '__planned__', defaultColor: cc.accent,   defaultLabel: plannedLabel()  },
                { key: '__bowwave__', defaultColor: cc.accentB,  defaultLabel: bowWaveLabel()  },
              ].map(({ key, defaultColor, defaultLabel }) => {
                const ov    = getOv(key)
                const color = ov.color || defaultColor
                const inputVal = ov.label != null ? ov.label : defaultLabel
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <label className="relative shrink-0 cursor-pointer" title="Click to change color">
                      <span className="flex w-4 h-4 rounded-sm border border-line/50"
                        style={{ background: color }} />
                      <input
                        key={color}
                        type="color"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        defaultValue={color}
                        onBlur={e => setOv(key, 'color', e.target.value)}
                      />
                    </label>
                    {ov.color && (
                      <button
                        onClick={() => setOv(key, 'color', null)}
                        className="shrink-0 text-fg-4 hover:text-fg leading-none"
                        title="Reset to default color"
                      >↺</button>
                    )}
                    <input
                      type="text"
                      value={inputVal}
                      onChange={e => setOv(key, 'label', e.target.value)}
                      onBlur={e => { if (!e.target.value.trim()) setOv(key, 'label', null) }}
                      className="flex-1 min-w-0 bg-transparent border-b border-transparent
                        hover:border-line focus:border-accent outline-none py-0.5 text-fg-3"
                      placeholder={defaultLabel}
                    />
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
