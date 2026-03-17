import { useState, useEffect } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import DualRangeSlider from './DualRangeSlider'

const LINE_COLORS = ['#f97316', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#f43f5e']

function shortName(fileName, dataDate) {
  const base = fileName.replace(/\.[^.]+$/, '')
  const dd = dataDate
    ? new Date(dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    : ''
  return dd ? `${base} (${dd})` : base
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm max-w-xs">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map(p => (
        p.value != null && (
          <p key={p.dataKey} style={{ color: p.stroke }} className="text-xs">
            {p.name}: {toVal(p.value).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
          </p>
        )
      ))}
    </div>
  )
}

export default function SCurveChart({ sCurveData, unit }) {
  const [startIdx, setStartIdx] = useState(0)
  const [endIdx, setEndIdx]     = useState(0)

  const { monthLabels = [], series = [] } = sCurveData || {}

  useEffect(() => {
    if (monthLabels.length > 0) {
      setStartIdx(0)
      setEndIdx(monthLabels.length - 1)
    }
  }, [monthLabels.length])

  if (!monthLabels.length || !series.length) return null

  const toVal = (v) => unit === 'hrs' ? v : v / 8

  // Assign colors — latest = blue, others cycle
  let colorIdx = 0
  const seriesColor = {}
  series.forEach(s => {
    seriesColor[s.id] = s.isLatest ? '#3b82f6' : LINE_COLORS[colorIdx++ % LINE_COLORS.length]
  })

  const chartData = monthLabels.slice(startIdx, endIdx + 1).map(label => {
    const row = { month: label }
    series.forEach(s => {
      row[s.id] = toVal(s.cumByMonth[label] || 0)
    })
    return row
  })

  return (
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-300">S-Curve — Cumulative Planned Work</h3>
        <p className="text-xs text-gray-500 mt-1">
          Cumulative planned hours per schedule. Diverging end-points indicate scope growth between updates.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={380}>
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
              value: unit === 'hrs' ? 'Cumulative Hours' : 'Cumulative Work Days',
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

          {series.map(s => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              stroke={seriesColor[s.id]}
              strokeWidth={s.isLatest ? 2.5 : 1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

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
    </div>
  )
}
