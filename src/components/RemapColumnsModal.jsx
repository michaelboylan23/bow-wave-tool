import { useState } from 'react'
import { REQUIRED_FIELDS, isMappingComplete } from '../utils/columnMapping'
import { parseFile } from '../parsers/parseFile'

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="w-8 h-8 border-4 border-line border-t-blue-500 rounded-full animate-spin" />
      <p className="text-fg-3 text-sm">Re-parsing schedules…</p>
    </div>
  )
}

// rawFiles: [{ id, file, dataDate }]
export default function RemapColumnsModal({ headers, currentMapping, rawFiles, onConfirm, onClose }) {
  const [mapping, setMapping] = useState({ ...currentMapping })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const complete = isMappingComplete(mapping)
  const unmapped = REQUIRED_FIELDS.filter(f => !mapping[f.key]).length

  const handleConfirm = async () => {
    if (!complete) return
    setError(null)
    setLoading(true)
    try {
      const parsed = await Promise.all(
        rawFiles.map(async (f) => {
          const rows = await parseFile(f.file, mapping)
          return { id: f.id, fileName: f.file.name, dataDate: f.dataDate, rows }
        })
      )
      const uploaded = parsed.map(s => ({
        id:           s.id,
        fileName:     s.fileName,
        dataDate:     s.dataDate,
        rawRows:      s.rows,
        filteredRows: s.rows,
      }))
      onConfirm(uploaded, mapping)
    } catch (err) {
      setError('Failed to re-parse files: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-card border border-line rounded-2xl p-8 max-w-2xl w-full mx-4 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-fg font-bold text-lg">Remap Columns</h2>
            <p className="text-fg-3 text-sm mt-0.5">
              Adjust the column mapping and re-parse all {rawFiles.length} uploaded schedules.
            </p>
          </div>
          <button onClick={onClose} className="text-fg-4 hover:text-fg transition-colors text-sm ml-4 shrink-0">✕</button>
        </div>

        {loading ? <Spinner /> : (
          <>
            <div className="bg-card rounded-xl overflow-hidden border border-line-subtle">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-control">
                    <th className="px-4 py-3 text-left text-fg-2 font-semibold text-xs">Required Field</th>
                    <th className="px-4 py-3 text-left text-fg-2 font-semibold text-xs">Your Column</th>
                    <th className="px-4 py-3 text-left text-fg-2 font-semibold text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUIRED_FIELDS.map((field, i) => {
                    const value = mapping[field.key]
                    return (
                      <tr key={field.key} className={i % 2 === 0 ? 'bg-card' : 'bg-control/50'}>
                        <td className="px-4 py-3">
                          <p className="text-fg font-medium text-xs">{field.label}</p>
                          <p className="text-fg-4 font-mono text-xs">{field.key}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={value || ''}
                            onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value || null }))}
                            className="w-full bg-control border border-line rounded-lg px-2 py-1.5
                              text-fg text-xs focus:outline-none focus:border-accent transition-colors"
                          >
                            <option value="">— select —</option>
                            {[...headers].sort((a, b) => a.localeCompare(b)).map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {value
                            ? <span className="text-green-400 text-xs font-medium">✓ Matched</span>
                            : <span className="text-yellow-400 text-xs font-medium">⚠ Needed</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {!complete && (
              <p className="text-yellow-400 text-xs">
                {unmapped} field{unmapped !== 1 ? 's' : ''} still need{unmapped === 1 ? 's' : ''} to be mapped.
              </p>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={!complete}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors
                  ${complete ? 'bg-accent hover:bg-blue-500 text-fg' : 'bg-control text-fg-4 cursor-not-allowed'}`}
              >
                {complete ? 'Confirm & Re-parse' : 'Please map all required fields'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-control hover:bg-muted
                  text-fg-2 hover:text-fg transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
