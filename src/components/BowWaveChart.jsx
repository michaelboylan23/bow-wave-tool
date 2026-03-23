import { useRef } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { formatMonthLabel } from '../utils/buildChartData'
import DualRangeSlider from './DualRangeSlider'
import { exportChart } from '../utils/exportChart'

// Colour palette for category bars
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
      <p className="text-white font-semibold mb-2">{label}</p>
      {entries.map(p => {
        const bw      = bwByKey[p.dataKey] || 0
        const planned = p.value || 0
        if (planned + bw === 0) return null
        return (
          <p key={p.dataKey} style={{ color: p.fill }}>
            {p.name}: {toVal(planned).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
            {bw > 0 && (
              <span className="text-gray-400 text-xs">
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
  baseSchedule,
  groupByColumn,
  onGroupByChange,
  groupByColumns,
  categoryChartData,
  zoomStart, zoomEnd, onZoomChange,
  projectName, projectNumber, scenarioConfig,
}) {
  const exportRef = useRef(null)
  const activeData = categoryChartData ? categoryChartData.chartData : chartData

  if (!activeData || activeData.length === 0) return null

  const startIdx = zoomStart
  const endIdx   = zoomEnd < 0 ? activeData.length - 1 : Math.min(zoomEnd, activeData.length - 1)

  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const dataLabel = formatMonthLabel(bowWaveResult.windowEnd)

  const visibleData = activeData.slice(startIdx, endIdx + 1).map(d => {
    const row = { ...d, bowWave: toVal(d.bowWave) }
    if (categoryChartData) {
      for (const cat of categoryChartData.categories) {
        row[`cat__${cat}`]      = toVal(d[`cat__${cat}`] || 0)
        row[`cat__${cat}__bw`]  = toVal(d[`cat__${cat}__bw`] || 0)
      }
    } else {
      row.planned = toVal(d.planned)
    }
    return row
  })

  const categories = categoryChartData?.categories ?? []

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
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-6">
      <div ref={exportRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-gray-300">
          Workload Distribution & Bow Wave Redistribution
        </h3>
        <div className="flex items-center gap-3 print:hidden">
          {groupByColumns && groupByColumns.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Group by:</span>
              <select
                value={groupByColumn || ''}
                onChange={e => onGroupByChange(e.target.value || null)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs
                  focus:outline-none focus:border-blue-500 transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700
              text-gray-400 hover:text-white text-xs font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <ResponsiveContainer key={unit} width="100%" height={400}>
        <BarChart data={visibleData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>

          {/* Hatch patterns for bow wave portions — one per category color */}
          <defs>
            {categories.map((_, i) => {
              const color = CAT_COLORS[i % CAT_COLORS.length]
              return (
                <pattern key={i} id={`bw-hatch-${i}`} x="0" y="0" width="8" height="8"
                  patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="3.5" />
                </pattern>
              )
            })}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            label={{
              value: unit === 'hrs' ? 'Hours' : 'Work Days',
              angle: -90,
              position: 'insideLeft',
              fill: '#9ca3af',
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend wrapperStyle={{ paddingTop: '20px', color: '#9ca3af', fontSize: '12px' }} />
          <ReferenceLine
            x={dataLabel}
            stroke="#f97316"
            strokeDasharray="4 4"
            label={{ value: 'Data Date 2', position: 'insideTopRight', fill: '#f97316', fontSize: 11, offset: 10 }}
          />

          {categoryChartData
            ? [
                // Solid planned bars per category
                ...categories.map((cat, i) => (
                  <Bar key={cat} dataKey={`cat__${cat}`} name={cat} stackId="a"
                    fill={CAT_COLORS[i % CAT_COLORS.length]} radius={[0, 0, 0, 0]} />
                )),
                // Hatched bow wave bars per category — hidden from legend
                ...categories.map((cat, i) => (
                  <Bar key={`${cat}__bw`} dataKey={`cat__${cat}__bw`} name={`${cat} (Bow Wave)`}
                    stackId="a" fill={`url(#bw-hatch-${i % CAT_COLORS.length})`}
                    radius={[4, 4, 0, 0]} legendType="none" />
                )),
              ]
            : [
                <Bar key="planned" dataKey="planned"
                  name={baseSchedule === 'A' ? 'Planned Work (Schedule 1)' : 'Planned Work (Schedule 2)'}
                  stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />,
                <Bar key="bowWave" dataKey="bowWave" name="Bow Wave" stackId="a"
                  fill="#f97316" radius={[4, 4, 0, 0]} />,
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
          <span className="text-xs text-gray-400">Hatched portion = Bow Wave</span>
        </div>
      )}

      </div>{/* end exportRef */}

      {/* Zoom Controls */}
      <div className="flex flex-col gap-3 border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Zoom</p>
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
    </div>
  )
}
