import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { formatMonthLabel } from '../utils/buildChartData'
import DualRangeSlider from './DualRangeSlider'

// Colour palette for category bars
const CAT_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#f43f5e', '#84cc16', '#06b6d4']

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

export default function BowWaveChart({
  chartData,
  bowWaveResult,
  unit,
  baseSchedule,
  groupByColumn,
  onGroupByChange,
  groupByColumns,    // string[] — available column names from filterConfig
  categoryChartData, // { categories: string[], chartData: [...] } | null
}) {
  const [startIdx, setStartIdx] = useState(0)
  const [endIdx, setEndIdx]     = useState(0)

  const activeData = categoryChartData ? categoryChartData.chartData : chartData

  useEffect(() => {
    if (activeData && activeData.length > 0) {
      setStartIdx(0)
      setEndIdx(activeData.length - 1)
    }
  }, [activeData])

  if (!activeData || activeData.length === 0) return null

  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const dataLabel = formatMonthLabel(bowWaveResult.windowEnd)

  const visibleData = activeData.slice(startIdx, endIdx + 1).map(d => {
    const row = { ...d, bowWave: toVal(d.bowWave) }
    if (categoryChartData) {
      for (const cat of categoryChartData.categories) {
        row[`cat__${cat}`] = toVal(d[`cat__${cat}`] || 0)
      }
    } else {
      row.planned = toVal(d.planned)
    }
    return row
  })

  return (
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-gray-300">
          Workload Distribution & Bow Wave Redistribution
        </h3>

        {/* Group by selector */}
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
      </div>

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
          <Legend wrapperStyle={{ paddingTop: '20px', color: '#9ca3af', fontSize: '12px' }} />
          <ReferenceLine
            x={dataLabel}
            stroke="#f97316"
            strokeDasharray="4 4"
            label={{ value: 'Data Date 2', position: 'insideTopRight', fill: '#f97316', fontSize: 11, offset: 10 }}
          />

          {/* Category bars (grouped mode) or single planned bar, then bowWave on top */}
          {categoryChartData
            ? [
                ...categoryChartData.categories.map((cat, i) => (
                  <Bar key={cat} dataKey={`cat__${cat}`} name={cat} stackId="a"
                    fill={CAT_COLORS[i % CAT_COLORS.length]} radius={[0, 0, 0, 0]} />
                )),
                <Bar key="bowWave" dataKey="bowWave" name="Bow Wave" stackId="a"
                  fill="#f97316" radius={[4, 4, 0, 0]} />,
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

      {/* Zoom Controls */}
      <div className="flex flex-col gap-3 border-t border-gray-800 pt-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Zoom</p>
        <DualRangeSlider
          min={0}
          max={activeData.length - 1}
          start={startIdx}
          end={endIdx}
          onStartChange={setStartIdx}
          onEndChange={setEndIdx}
          startLabel={activeData[startIdx]?.month}
          endLabel={activeData[endIdx]?.month}
        />
      </div>
    </div>
  )
}
