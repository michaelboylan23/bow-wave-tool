import { useRef } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import DualRangeSlider from './DualRangeSlider'
import { exportChart } from '../utils/exportChart'
import { useChartColors } from '../hooks/useChartColors'

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
    <div className="bg-card border border-line rounded-lg p-3 text-sm max-w-xs">
      <p className="text-fg font-semibold mb-2">{label}</p>
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

export default function SCurveChart({ sCurveData, unit, zoomStart, zoomEnd, onZoomChange, projectName, projectNumber }) {
  const exportRef = useRef(null)
  const cc = useChartColors()
  const { monthLabels = [], series = [] } = sCurveData || {}

  if (!monthLabels.length || !series.length) return null

  const startIdx = zoomStart
  const endIdx   = zoomEnd < 0 ? monthLabels.length - 1 : Math.min(zoomEnd, monthLabels.length - 1)

  const toVal = (v) => unit === 'hrs' ? v : v / 8

  // Assign colors — latest = primary, others start with accentC then cycle
  const EXTRA_COLORS = ['#22c55e', '#ec4899', '#14b8a6', '#eab308', '#f43f5e', '#06b6d4']
  let colorIdx = 0
  const seriesColor = {}
  series.forEach(s => {
    if (s.isLatest) { seriesColor[s.id] = cc.accent; return }
    seriesColor[s.id] = colorIdx === 0 ? cc.accentC : EXTRA_COLORS[(colorIdx - 1) % EXTRA_COLORS.length]
    colorIdx++
  })
  const chartData = monthLabels.slice(startIdx, endIdx + 1).map(label => {
    const row = { month: label }
    series.forEach(s => {
      row[s.id] = toVal(s.cumByMonth[label] || 0)
    })
    return row
  })

  const handleExport = () => {
    if (!exportRef.current) return
    const meta = []
    if (projectNumber || projectName) meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 's-curve'
    exportChart(exportRef.current, meta, `${slug}-s-curve`)
  }

  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-6">
      <div ref={exportRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-fg-2">S-Curve — Cumulative Planned Work</h3>
          <p className="text-xs text-fg-4 mt-1">
            Cumulative planned hours per schedule. Diverging end-points indicate scope growth between updates.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="print:hidden flex items-center gap-1.5 px-3 py-1 rounded-lg bg-control hover:bg-muted
            text-fg-3 hover:text-fg text-xs font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export PDF
        </button>
      </div>

      <ResponsiveContainer key={unit} width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
          <XAxis
            dataKey="month"
            tick={{ fill: cc.tick, fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: cc.tick, fontSize: 11 }}
            label={{
              value: unit === 'hrs' ? 'Cumulative Hours' : 'Cumulative Work Days',
              angle: -90,
              position: 'insideLeft',
              fill: cc.tick,
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend
            formatter={(value) => {
              const s = series.find(s => s.id === value)
              return s ? shortName(s.fileName, s.dataDate) : value
            }}
            wrapperStyle={{ paddingTop: '20px', color: cc.tick, fontSize: '11px' }}
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
      </div>{/* end exportRef */}

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
    </div>
  )
}
