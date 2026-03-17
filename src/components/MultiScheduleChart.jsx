import { useState, useEffect } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatMonthLabel } from '../utils/buildChartData'
import DualRangeSlider from './DualRangeSlider'

// Colour palette for series (latest always uses blue bars; others cycle through these)
const LINE_COLORS = ['#f97316', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#f43f5e']

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm max-w-xs">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map(p => (
        p.value != null && p.value > 0 && (
          <p key={p.name} style={{ color: p.color || p.fill }} className="text-xs">
            {p.name}: {toVal(p.value).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
          </p>
        )
      ))}
    </div>
  )
}

// Truncate a file name for legend display
function shortName(fileName, dataDate) {
  const base = fileName.replace(/\.[^.]+$/, '')
  const dd = dataDate ? new Date(dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : ''
  return dd ? `${base} (${dd})` : base
}

export default function MultiScheduleChart({ multiSeriesData, unit, baselineId, onBaselineChange, uploadedSchedules }) {
  const [startIdx, setStartIdx] = useState(0)
  const [endIdx, setEndIdx]     = useState(0)

  const { monthLabels = [], series = [] } = multiSeriesData || {}

  useEffect(() => {
    if (monthLabels.length > 0) {
      setStartIdx(0)
      setEndIdx(monthLabels.length - 1)
    }
  }, [monthLabels.length])

  if (!monthLabels.length || !series.length) return null

  const toVal = (v) => unit === 'hrs' ? v : v / 8

  // Build chart data: one row per month, one key per series
  const chartData = monthLabels.slice(startIdx, endIdx + 1).map(label => {
    const row = { month: label }
    series.forEach(s => {
      row[s.id] = toVal(s.dataByMonth[label] || 0)
    })
    return row
  })

  // Latest schedule = bars; others = lines
  const latest   = series.find(s => s.isLatest)
  const baseline = series.find(s => s.isBaseline)
  const others   = series.filter(s => !s.isLatest)

  // Assign colours to non-latest series
  let colorIdx = 0
  const seriesColor = {}
  others.forEach(s => {
    seriesColor[s.id] = s.isBaseline ? '#facc15' : LINE_COLORS[colorIdx++ % LINE_COLORS.length]
  })

  // Reference lines for each data date
  const dataDateLines = series.map(s => ({
    id:    s.id,
    label: formatMonthLabel(new Date(s.dataDate)),
    color: s.isLatest ? '#3b82f6' : (seriesColor[s.id] || '#6b7280'),
  }))

  return (
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-gray-300">
          Multi-Schedule Trend — Remaining Planned Work
        </h3>

        {/* Baseline selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Baseline:</span>
          <select
            value={baselineId || ''}
            onChange={e => onBaselineChange(e.target.value || null)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs
              focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">None</option>
            {(uploadedSchedules || []).map(s => (
              <option key={s.id} value={s.id}>{s.fileName} ({s.dataDate})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend explainer */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
          Latest schedule (bars)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-gray-400" />
          Previous schedules (lines)
        </span>
        {baseline && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-yellow-400" />
            Baseline
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
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
          <Legend
            formatter={(value) => {
              const s = series.find(s => s.id === value)
              return s ? shortName(s.fileName, s.dataDate) : value
            }}
            wrapperStyle={{ paddingTop: '20px', color: '#9ca3af', fontSize: '11px' }}
          />

          {/* Data date reference lines */}
          {dataDateLines.map(dl => (
            <ReferenceLine
              key={dl.id}
              x={dl.label}
              stroke={dl.color}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          ))}

          {/* Previous schedules as lines */}
          {others.map(s => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              stroke={seriesColor[s.id]}
              strokeWidth={s.isBaseline ? 2 : 1.5}
              strokeDasharray={s.isBaseline ? '6 3' : undefined}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}

          {/* Latest schedule as bars */}
          {latest && (
            <Bar
              dataKey={latest.id}
              name={latest.id}
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Zoom controls */}
      <div className="flex flex-col gap-3 border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Zoom</p>
        <DualRangeSlider
          min={0}
          max={monthLabels.length - 1}
          start={startIdx}
          end={endIdx}
          onStartChange={setStartIdx}
          onEndChange={setEndIdx}
          startLabel={monthLabels[startIdx]}
          endLabel={monthLabels[endIdx]}
        />
      </div>

      {/* Series summary table */}
      <div className="border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Schedules in View</p>
        <div className="flex flex-col gap-1">
          {[...series].reverse().map(s => (
            <div key={s.id} className="flex items-center gap-3 text-xs">
              <span
                className="inline-block w-3 shrink-0"
                style={{
                  height: s.isLatest ? '12px' : '2px',
                  background: s.isLatest ? '#3b82f6' : seriesColor[s.id],
                  borderRadius: s.isLatest ? '2px' : '0',
                }}
              />
              <span className={`flex-1 truncate ${s.isLatest ? 'text-white font-medium' : 'text-gray-400'}`}>
                {s.fileName}
              </span>
              {s.isBaseline && <span className="text-yellow-400 text-xs font-medium">Baseline</span>}
              {s.isLatest && <span className="text-blue-400 text-xs font-medium">Latest</span>}
              <span className="text-gray-500 shrink-0">
                {s.dataDate ? new Date(s.dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
