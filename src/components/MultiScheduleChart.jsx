import { useRef } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatMonthLabel } from '../utils/buildChartData'
import DualRangeSlider from './DualRangeSlider'
import { exportChart } from '../utils/exportChart'
import { useChartColors } from '../hooks/useChartColors'

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  return (
    <div className="bg-card border border-line rounded-lg p-3 text-sm max-w-xs">
      <p className="text-fg font-semibold mb-2">{label}</p>
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

export default function MultiScheduleChart({ multiSeriesData, unit, baselineId, onBaselineChange, uploadedSchedules, zoomStart, zoomEnd, onZoomChange, projectName, projectNumber }) {
  const exportRef = useRef(null)
  const cc = useChartColors()
  const { monthLabels = [], series = [] } = multiSeriesData || {}

  if (!monthLabels.length || !series.length) return null

  const startIdx = zoomStart
  const endIdx   = zoomEnd < 0 ? monthLabels.length - 1 : Math.min(zoomEnd, monthLabels.length - 1)

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

  // Assign colors to non-latest series — accentC leads, then cycle through fixed extras
  const EXTRA_COLORS = ['#22c55e', '#ec4899', '#14b8a6', '#eab308', '#f43f5e', '#06b6d4']
  let colorIdx = 0
  const seriesColor = {}
  others.forEach(s => {
    if (s.isBaseline) { seriesColor[s.id] = '#facc15'; return }
    seriesColor[s.id] = colorIdx === 0 ? cc.accentC : EXTRA_COLORS[(colorIdx - 1) % EXTRA_COLORS.length]
    colorIdx++
  })

  // Reference lines for each data date
  const dataDateLines = series.map(s => ({
    id:    s.id,
    label: formatMonthLabel(new Date(s.dataDate)),
    color: s.isLatest ? cc.accent : (seriesColor[s.id] || cc.accentC),
  }))

  const handleExport = () => {
    if (!exportRef.current) return
    const meta = []
    if (projectNumber || projectName) meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    const baselineSched = (uploadedSchedules || []).find(s => s.id === baselineId)
    meta.push(`Baseline: ${baselineSched ? baselineSched.fileName : 'None'}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 'multi-schedule'
    exportChart(exportRef.current, meta, `${slug}-trend`)
  }

  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-6">
      <div ref={exportRef} className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-fg-2">
          Multi-Schedule Trend — Remaining Planned Work
        </h3>
        <div className="flex items-center gap-3 print:hidden">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Legend explainer */}
      <div className="flex flex-wrap gap-4 text-xs text-fg-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: cc.accent }} />
          Latest schedule (bars)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2" style={{ borderColor: cc.accentC }} />
          Previous schedules (lines)
        </span>
        {baseline && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-yellow-400" />
            Baseline
          </span>
        )}
      </div>

      <ResponsiveContainer key={unit} width="100%" height={420}>
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
              value: unit === 'hrs' ? 'Hours' : 'Work Days',
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

          {/* Data date reference lines */}
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
              fill={cc.accent}
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      </div>{/* end exportRef */}

      {/* Zoom controls */}
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

      {/* Series summary table */}
      <div className="border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-4 uppercase tracking-wide font-medium mb-3">Schedules in View</p>
        <div className="flex flex-col gap-1">
          {[...series].reverse().map(s => (
            <div key={s.id} className="flex items-center gap-3 text-xs">
              <span
                className="inline-block w-3 shrink-0"
                style={{
                  height: s.isLatest ? '12px' : '2px',
                  background: s.isLatest ? cc.accent : seriesColor[s.id],
                  borderRadius: s.isLatest ? '2px' : '0',
                }}
              />
              <span className={`flex-1 truncate ${s.isLatest ? 'text-fg font-medium' : 'text-fg-3'}`}>
                {s.fileName}
              </span>
              {s.isBaseline && <span className="text-yellow-400 text-xs font-medium">Baseline</span>}
              {s.isLatest && <span className="text-xs font-medium" style={{ color: cc.accent }}>Latest</span>}
              <span className="text-fg-4 shrink-0">
                {s.dataDate ? new Date(s.dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
