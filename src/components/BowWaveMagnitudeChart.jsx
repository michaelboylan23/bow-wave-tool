import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, unit }) => {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm">
      <p className="text-white font-semibold mb-1">{d.label}</p>
      <p className="text-xs text-gray-400 truncate mb-2">{d.fileName}</p>
      <p className="text-xs text-blue-400">
        In-flight: {toVal(d.inFlightHrs).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
      </p>
    </div>
  )
}

export default function BowWaveMagnitudeChart({ magnitudeData, unit }) {
  if (!magnitudeData || magnitudeData.length < 2) return null

  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const chartData = magnitudeData.map(d => ({ ...d, value: toVal(d.inFlightHrs) }))

  return (
    <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-300">In-Flight Work Trend</h3>
        <p className="text-xs text-gray-500 mt-1">
          Work started but not yet finished at each schedule's data date — a rising trend indicates accumulating backlog.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
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
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#1e3a5f' }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
