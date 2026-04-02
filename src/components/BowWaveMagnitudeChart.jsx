import { useRef, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useChartColors } from '../hooks/useChartColors'
import { exportChart } from '../utils/exportChart'
import { exportXlsx, magnitudeXlsxConfig } from '../utils/exportXlsx'
import PrintPreviewModal from './PrintPreviewModal'

const CustomTooltip = ({ active, payload, unit, scheduleOverrides }) => {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const u = unit === 'hrs' ? 'hrs' : 'days'
  const displayName = scheduleOverrides?.[d.id]?.label?.trim() || d.fileName
  return (
    <div className="bg-card border border-line rounded-lg p-3 text-sm">
      <p className="text-fg font-semibold mb-1">{d.label}</p>
      <p className="text-xs text-fg-3 truncate mb-2">{displayName}</p>
      <p className="text-xs text-blue-400">
        In-flight: {toVal(d.inFlightHrs).toLocaleString('en-US', { maximumFractionDigits: 1 })} {u}
      </p>
    </div>
  )
}

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

export default function BowWaveMagnitudeChart({
  magnitudeData, unit, projectName, projectNumber,
  scheduleOverrides, onScheduleOverridesChange,
}) {
  const exportRef = useRef(null)
  const [showPreview, setShowPreview] = useState(false)
  const cc = useChartColors()

  const getOv = (id) => scheduleOverrides?.[id] || {}
  const setOv = (id, key, val) =>
    onScheduleOverridesChange(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }))

  // Filter out hidden schedules
  const visibleData = (magnitudeData || []).filter(d => !getOv(d.id).hidden)

  if (!visibleData || visibleData.length < 2) {
    // Still render the Schedules in View section even if chart is hidden
    if (!magnitudeData || magnitudeData.length < 2) return null
  }

  const toVal = (v) => unit === 'hrs' ? v : v / 8
  const chartData = visibleData.map(d => ({ ...d, value: toVal(d.inFlightHrs) }))

  const handleExport = () => {
    if (!exportRef.current) return
    const meta = []
    if (projectNumber || projectName)
      meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 'in-flight'
    exportChart(exportRef.current, meta, `${slug}-in-flight-trend`)
  }

  const handleExportXlsx = () => {
    const meta = []
    if (projectNumber || projectName) meta.push(`Project: ${[projectNumber, projectName].filter(Boolean).join(' — ')}`)
    const slug = [projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 'in-flight'
    const { data, columns, headers } = magnitudeXlsxConfig(magnitudeData, { unit })
    exportXlsx(data, { filename: `${slug}-in-flight-trend`, columns, headers, metaLines: meta })
  }

  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-4">
      <div ref={exportRef} className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-fg-2">In-Flight Work Trend</h3>
            <p className="text-xs text-fg-4 mt-1">
              Work started but not yet finished at each schedule's data date — a rising trend indicates accumulating backlog.
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

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: cc.tick, fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                tickMargin={12}
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
              <Tooltip content={<CustomTooltip unit={unit} scheduleOverrides={scheduleOverrides} />} />
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
        ) : (
          <p className="text-xs text-fg-4 text-center py-8">
            At least 2 visible schedules required to draw the trend line.
          </p>
        )}
      </div>{/* end exportRef */}

      {/* Schedules in View */}
      <div className="border-t border-line-subtle pt-4">
        <p className="text-xs text-fg-4 uppercase tracking-wide font-medium mb-3">Schedules in View</p>
        <div className="flex flex-col gap-2">
          {(magnitudeData || []).map(d => {
            const ov       = getOv(d.id)
            const hidden   = ov.hidden === true
            const inputVal = ov.label != null ? ov.label : d.fileName.replace(/\.[^.]+$/, '')

            return (
              <div key={d.id}
                className={`flex items-center gap-2 text-xs transition-opacity ${hidden ? 'opacity-40' : ''}`}
              >
                {/* Line swatch */}
                <span className="inline-block w-4 shrink-0" style={{ height: '2px', background: cc.accent }} />

                {/* Include / exclude */}
                <input
                  type="checkbox"
                  checked={!hidden}
                  onChange={e => setOv(d.id, 'hidden', !e.target.checked)}
                  className="w-3.5 h-3.5 shrink-0 cursor-pointer accent-accent"
                  title={hidden ? 'Include in chart' : 'Exclude from chart'}
                />

                {/* Editable name */}
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setOv(d.id, 'label', e.target.value)}
                  onBlur={e => { if (!e.target.value.trim()) setOv(d.id, 'label', null) }}
                  className="flex-1 min-w-0 bg-transparent border-b border-transparent
                    hover:border-line focus:border-accent outline-none py-0.5 text-fg-3"
                  placeholder={d.fileName.replace(/\.[^.]+$/, '')}
                />

                <span className="shrink-0 text-fg-4">
                  {d.dataDate
                    ? new Date(d.dataDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : d.label}
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
          filename={`${[projectNumber, projectName].filter(Boolean).join('-').replace(/\s+/g, '-') || 'in-flight'}-in-flight-trend`}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
