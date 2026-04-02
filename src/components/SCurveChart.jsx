import { useRef, useState } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import DualRangeSlider from './DualRangeSlider'
import { exportChart } from '../utils/exportChart'
import { exportXlsx, sCurveXlsxConfig } from '../utils/exportXlsx'
import PrintPreviewModal from './PrintPreviewModal'
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

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

export default function SCurveChart({
  sCurveData, unit,
  zoomStart, zoomEnd, onZoomChange,
  projectName, projectNumber,
  seriesOverrides, onSeriesOverridesChange,
}) {
  const exportRef = useRef(null)
  const [showPreview, setShowPreview] = useState(false)
  const cc = useChartColors()
  const { monthLabels = [], series = [] } = sCurveData || {}

  if (!monthLabels.length || !series.length) return null

  const startIdx = zoomStart
  const endIdx   = zoomEnd < 0 ? monthLabels.length - 1 : Math.min(zoomEnd, monthLabels.length - 1)
  const toVal    = (v) => unit === 'hrs' ? v : v / 8

  // ── Per-series overrides ──────────────────────────────────────────────────
  const getOv = (id) => seriesOverrides[id] || {}
  const setOv = (id, key, val) =>
    onSeriesOverridesChange(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }))

  const isHidden     = (id) => getOv(id).hidden === true
  const getOverColor = (id) => getOv(id).color || null
  const getLabel     = (id) => getOv(id).label?.trim() || null

  // ── Auto-assign colors ─────────────────────────────────────────────────────
  const EXTRA_COLORS = ['#22c55e', '#ec4899', '#14b8a6', '#eab308', '#f43f5e', '#06b6d4']
  let colorIdx = 0
  const autoColor = {}
  series.forEach(s => {
    if (s.isLatest) { autoColor[s.id] = cc.accent; return }
    autoColor[s.id] = colorIdx === 0 ? cc.accentC : EXTRA_COLORS[(colorIdx - 1) % EXTRA_COLORS.length]
    colorIdx++
  })
  const effectiveColor = (id) => getOverColor(id) || autoColor[id] || cc.accent

  const activeSeries = series.filter(s => !isHidden(s.id))

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = monthLabels.slice(startIdx, endIdx + 1).map(label => {
    const row = { month: label }
    activeSeries.forEach(s => {
      row[s.id] = toVal(s.cumByMonth[label] || 0)
    })
    return row
  })

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!exportRef.current) return
    const meta = []
    if (projectNumber || projectName)
      meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 's-curve'
    exportChart(exportRef.current, meta, `${slug}-s-curve`)
  }

  const handleExportXlsx = () => {
    const meta = []
    if (projectNumber || projectName) meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 's-curve'
    const { data, columns, headers } = sCurveXlsxConfig(sCurveData, { unit })
    exportXlsx(data, { filename: `${slug}-s-curve`, columns, headers, metaLines: meta })
  }

  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-6">
      <div ref={exportRef} className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-fg-2">S-Curve — Cumulative Planned Work</h3>
            <p className="text-xs text-fg-4 mt-1">
              Cumulative planned hours per schedule. Diverging end-points indicate scope growth between updates.
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-control hover:bg-muted
                text-fg-3 hover:text-fg text-xs font-medium transition-colors"
            >
              <DownloadIcon />
              PDF
            </button>
            <button
              onClick={handleExportXlsx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-control hover:bg-muted
                text-fg-3 hover:text-fg text-xs font-medium transition-colors"
            >
              <DownloadIcon />
              XLSX
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-control hover:bg-muted
                text-fg-3 hover:text-fg text-xs font-medium transition-colors"
            >
              Preview
            </button>
          </div>
        </div>

        <ResponsiveContainer key={unit} width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 80 }}>
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
                if (!s) return value
                return getLabel(s.id) || shortName(s.fileName, s.dataDate)
              }}
              wrapperStyle={{ paddingTop: '20px', color: cc.tick, fontSize: '11px' }}
            />

            {activeSeries.map(s => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.id}
                name={s.id}
                stroke={effectiveColor(s.id)}
                strokeWidth={s.isLatest ? 2.5 : 1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>

      </div>{/* end exportRef */}

      {/* Zoom */}
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

      {/* Schedules in View */}
      <div className="border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-4 uppercase tracking-wide font-medium mb-3">Schedules in View</p>
        <div className="flex flex-col gap-2">
          {[...series].reverse().map(s => {
            const ov       = getOv(s.id)
            const hidden   = ov.hidden === true
            const color    = effectiveColor(s.id)
            const inputVal = ov.label != null ? ov.label : shortName(s.fileName, s.dataDate)

            return (
              <div key={s.id}
                className={`flex items-center gap-2 text-xs transition-opacity ${hidden ? 'opacity-40' : ''}`}
              >
                {/* Include / exclude */}
                <input
                  type="checkbox"
                  checked={!hidden}
                  onChange={e => setOv(s.id, 'hidden', !e.target.checked)}
                  className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-accent"
                  title={hidden ? 'Include in chart' : 'Exclude from chart'}
                />

                {/* Color swatch / picker */}
                <label className="relative shrink-0 cursor-pointer" title="Click to change color">
                  <span className="flex w-4 h-4 rounded-sm border border-line/50"
                    style={{ background: color }} />
                  <input
                    key={ov.color || color}
                    type="color"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    defaultValue={ov.color || color}
                    onBlur={e => setOv(s.id, 'color', e.target.value)}
                  />
                </label>
                {ov.color && (
                  <button
                    onClick={() => setOv(s.id, 'color', null)}
                    className="shrink-0 text-fg-4 hover:text-fg leading-none"
                    title="Reset to default color"
                  >↺</button>
                )}

                {/* Editable name */}
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setOv(s.id, 'label', e.target.value)}
                  onBlur={e => { if (!e.target.value.trim()) setOv(s.id, 'label', null) }}
                  className={`flex-1 min-w-0 bg-transparent border-b border-transparent
                    hover:border-line focus:border-accent outline-none py-0.5
                    ${s.isLatest ? 'text-fg font-medium' : 'text-fg-3'}`}
                  placeholder={shortName(s.fileName, s.dataDate)}
                />

                {s.isLatest && (
                  <span className="shrink-0 font-medium" style={{ color: cc.accent }}>Latest</span>
                )}
                <span className="shrink-0 text-fg-4">
                  {s.dataDate
                    ? new Date(s.dataDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {showPreview && (
        <PrintPreviewModal
          sourceRef={exportRef}
          metaLines={(() => {
            const meta = []
            if (projectNumber || projectName) meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
            return meta
          })()}
          filename={`${[projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 's-curve'}-s-curve`}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
