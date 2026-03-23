import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useChartColors } from '../hooks/useChartColors'

const CustomTooltip = ({ active, payload, unit }) => {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  return (
    <div className="bg-card border border-line rounded-lg p-3 text-sm">
      <p className="text-fg font-semibold mb-1">{d.label}</p>
      <p className="text-xs text-fg-3 truncate mb-2">{d.fileName}</p>
      <p className="text-xs text-blue-400">
        In-flight: {toVal(d.inFlightHrs).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
      </p>
    </div>
  )
}

export default function BowWaveMagnitudeChart({ magnitudeData, unit }) {
  const cc = useChartColors()
  if (!magnitudeData || magnitudeData.length < 2) return null

  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const chartData = magnitudeData.map(d => ({ ...d, value: toVal(d.inFlightHrs) }))

  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-fg-2">In-Flight Work Trend</h3>
        <p className="text-xs text-fg-4 mt-1">
          Work started but not yet finished at each schedule's data date — a rising trend indicates accumulating backlog.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
          <XAxis
            dataKey="label"
            tick={{ fill: cc.tick, fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: cc.tick, fontSize: 11 }}
            label={{
              value: unit === 'hrs' ? 'Hours' : 'Work Days',
              angle: -90,
              position: 'insideLeft',
              fill: cc.label,
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={cc.accent}
            strokeWidth={2}
            dot={{ fill: cc.accent, r: 5, strokeWidth: 2, stroke: cc.card }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
