import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { formatMonthLabel } from '../utils/buildChartData'

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
      <p className="text-white font-semibold mb-2">{label}</p>
      {payload.map(p => (
        p.value > 0 && (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: {toVal(p.value).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
          </p>
        )
      ))}
    </div>
  )
}

export default function BowWaveChart({ chartData, bowWaveResult, unit, baseSchedule }) {
  const [startIdx, setStartIdx] = useState(0)
  const [endIdx, setEndIdx] = useState(0)

  useEffect(() => {
    if (chartData && chartData.length > 0) {
      setStartIdx(0)
      setEndIdx(chartData.length - 1)
    }
  }, [chartData])

  if (!chartData || chartData.length === 0) return null

  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const dataLabel = formatMonthLabel(bowWaveResult.windowEnd)

  const visibleData = chartData
    .slice(startIdx, endIdx + 1)
    .map(d => ({
      ...d,
      planned: toVal(d.planned),
      bowWave: toVal(d.bowWave),
    }))

  return (
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-6">
      <h3 className="text-sm font-semibold text-gray-300">
        Workload Distribution & Bow Wave Redistribution
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={visibleData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
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
            wrapperStyle={{ paddingTop: '20px', color: '#9ca3af', fontSize: '12px' }}
          />
          <ReferenceLine
            x={dataLabel}
            stroke="#f97316"
            strokeDasharray="4 4"
            label={{ value: 'Data Date 2', position: 'insideTopRight', fill: '#f97316', fontSize: 11, offset: 10 }}
          />
          <Bar
            dataKey="planned"
            name={baseSchedule === 'A' ? 'Planned Work (Schedule 1)' : 'Planned Work (Schedule 2)'}
            stackId="a"
            fill="#3b82f6"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="bowWave"
            name="Bow Wave"
            stackId="a"
            fill="#f97316"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Zoom Controls */}
      <div className="flex flex-col gap-4 border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Zoom</p>
        <div className="flex flex-col gap-3">

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 w-16 text-right">Start</span>
            <input
              type="range"
              min={0}
              max={chartData.length - 1}
              value={startIdx}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (val <= endIdx) setStartIdx(val)
              }}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs text-white w-24">{chartData[startIdx]?.month}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 w-16 text-right">End</span>
            <input
              type="range"
              min={0}
              max={chartData.length - 1}
              value={endIdx}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (val >= startIdx) setEndIdx(val)
              }}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs text-white w-24">{chartData[endIdx]?.month}</span>
          </div>

        </div>
      </div>

    </div>
  )
}