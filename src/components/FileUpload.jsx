import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { autoMatch, REQUIRED_FIELDS, isMappingComplete } from '../utils/columnMapping'
import { parseFile } from '../parsers/parseFile'
import { extractXerDataDate } from '../parsers/parseXer'

const ACCEPTED = '.csv,.xlsx,.xls,.xer'

const genId = () => `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExt(name) {
  return name.split('.').pop().toLowerCase()
}

function extractHeaders(file) {
  return new Promise((resolve, reject) => {
    const ext = getExt(file.name)
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' })
          const sheet = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
          resolve((rows[0] || []).map(h => String(h).trim()).filter(Boolean))
        } catch (err) { reject(err) }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    } else if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const firstLine = e.target.result.split('\n')[0]
          resolve(firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, '')).filter(Boolean))
        } catch (err) { reject(err) }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    } else if (ext === 'xer') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const lines = e.target.result.split('\n')
          let inTask = false, headers = []
          for (const line of lines) {
            const t = line.trim()
            if (t.startsWith('%T')) { inTask = t.replace('%T', '').trim() === 'TASK' }
            else if (inTask && t.startsWith('%F')) {
              headers = t.replace('%F', '').trim().split('\t').map(h => h.trim()).filter(Boolean)
              break
            }
          }
          if (!headers.length) throw new Error('No TASK table found in XER file')
          resolve(headers)
        } catch (err) { reject(err) }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    } else {
      reject(new Error('Unsupported file type'))
    }
  })
}

const enrichXerHeaders = (headers, ext) => {
  if (ext !== 'xer') return headers
  const extras = ['start_date', 'end_date']
  return [...extras.filter(h => !headers.includes(h)), ...headers]
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-10 h-10 border-4 border-line border-t-blue-500 rounded-full animate-spin" />
      <p className="text-fg-3 text-sm">Parsing schedules…</p>
    </div>
  )
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function AddDropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const files = [...e.dataTransfer.files]
    if (files.length) onFiles(files)
  }

  const handleChange = (e) => {
    const files = [...e.target.files]
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors
        ${dragging ? 'border-blue-400 bg-blue-950' : 'border-line hover:border-gray-500 bg-card/50'}`}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED} multiple onChange={handleChange} className="hidden" />
      <p className="text-fg-3 text-sm mb-1">Drag & drop files here, or click to browse</p>
      <p className="text-gray-600 text-xs">CSV, Excel, or XER · Multiple files supported</p>
    </div>
  )
}

// ─── Single-file mapping column ───────────────────────────────────────────────

function MappingColumn({ fileName, allHeaders, mapping, onChange }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      <div className="bg-card rounded-xl overflow-hidden">
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
                      onChange={e => onChange(field.key, e.target.value || null)}
                      className="w-full bg-control border border-line rounded-lg px-2 py-1.5
                        text-fg text-xs focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="">— select —</option>
                      {[...allHeaders].sort((a, b) => a.localeCompare(b)).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {value ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">✓ Matched</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium">⚠ Needed</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Show which files have each mapped column */}
      <p className="text-xs text-fg-4">
        This mapping applies to all {fileName ? `files (reference: ${fileName})` : 'uploaded files'}.
      </p>
    </div>
  )
}

// ─── Main FileUpload component ─────────────────────────────────────────────────

// onSchedulesReady: (uploadedSchedules, filterConfig) =>
//   uploadedSchedules: [{ id, fileName, dataDate, rawRows, filteredRows }]
//   filterConfig: [{ column, selectedValues: string[] }]
export default function FileUpload({ onSchedulesReady }) {
  // Stage: 'upload' | 'mapping' | 'filtering'
  const [stage, setStage]       = useState('upload')
  const [fileList, setFileList] = useState([])
  // fileList items: { id, file, dataDate }

  // Mapping stage
  const [allHeaders, setAllHeaders] = useState([])   // union of headers from all files
  const [refFileName, setRefFileName] = useState('')  // name of the reference file for mapping hint
  const [mapping, setMapping]     = useState({})

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Upload stage helpers ──

  const handleAddFiles = async (files) => {
    const newEntries = []
    for (const file of files) {
      const id      = genId()
      const dateStr = getExt(file.name) === 'xer' ? await extractXerDataDate(file) : ''
      newEntries.push({ id, file, dataDate: dateStr || '' })
    }
    setFileList(prev => [...prev, ...newEntries])
    setError(null)
  }

  const handleRemoveFile = (id) => {
    setFileList(prev => prev.filter(f => f.id !== id))
  }

  const handleDateChange = (id, val) => {
    setFileList(prev => prev.map(f => f.id === id ? { ...f, dataDate: val } : f))
  }

  const readyToMap = fileList.length >= 2 && fileList.every(f => f.dataDate)

  const handleProceedToMapping = async () => {
    setError(null)
    setLoading(true)
    try {
      // Extract headers from all files
      const headerSets = await Promise.all(
        fileList.map(async (f) => {
          const raw = await extractHeaders(f.file)
          return enrichXerHeaders(raw, getExt(f.file.name))
        })
      )
      // Union of all headers, deduplicated
      const union = [...new Set(headerSets.flat())]
      setAllHeaders(union)
      setRefFileName(fileList[0].file.name)
      setMapping(autoMatch(headerSets[0])) // auto-match against first file's headers
      setStage('mapping')
    } catch (err) {
      setError('Failed to read file headers: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Mapping stage handlers ──

  const handleMappingChange = (key, value) => {
    setMapping(prev => ({ ...prev, [key]: value || null }))
  }

  const handleConfirmMapping = async () => {
    setError(null)
    setLoading(true)
    try {
      const parsed = await Promise.all(
        fileList.map(async (f) => {
          const rows = await parseFile(f.file, mapping)
          return { id: f.id, fileName: f.file.name, dataDate: f.dataDate, rows }
        })
      )
      // Skip filtering at upload time — filters are configured in the Results tab
      const uploaded = parsed.map(s => ({
        id:           s.id,
        fileName:     s.fileName,
        dataDate:     s.dataDate,
        rawRows:      s.rows,
        filteredRows: s.rows,
      }))
      onSchedulesReady(uploaded, [], fileList, allHeaders, mapping)
      // Reset back to upload stage so the component is clean for next use
      setStage('upload')
      setFileList([])
    } catch (err) {
      setError('Failed to parse files: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──

  if (loading) return <Spinner />

  if (stage === 'mapping') {
    const complete = isMappingComplete(mapping)
    const unmapped = REQUIRED_FIELDS.filter(f => !mapping[f.key]).length
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold mb-1">Map Columns</h2>
          <p className="text-fg-3 text-sm">
            Match each required field to the corresponding column in your files.
            This single mapping is applied to all {fileList.length} uploaded schedules.
            Auto-matched fields are pre-filled — review before confirming.
          </p>
        </div>

        <MappingColumn
          fileName={refFileName}
          allHeaders={allHeaders}
          mapping={mapping}
          onChange={handleMappingChange}
        />

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
            onClick={handleConfirmMapping}
            disabled={!complete}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors
              ${complete ? 'bg-accent hover:bg-blue-500 text-fg' : 'bg-control text-fg-4 cursor-not-allowed'}`}
          >
            {complete ? 'Confirm Mapping & Continue' : 'Please map all required fields to continue'}
          </button>
          <button
            onClick={() => setStage('upload')}
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-control hover:bg-muted
              text-fg-2 hover:text-fg transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  // ── Upload stage ──
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* File list */}
      {fileList.length > 0 && (
        <div className="flex flex-col gap-2">
          {fileList.map((f, i) => {
            const ext = getExt(f.file.name).toUpperCase()
            return (
              <div
                key={f.id}
                className="bg-card border border-line-subtle rounded-xl px-5 py-3 flex items-center gap-4"
              >
                <span className="text-xs font-bold text-fg-3 w-6 shrink-0">{i + 1}</span>
                <span className="inline-block bg-accent text-fg text-xs font-bold px-2 py-0.5 rounded shrink-0">
                  {ext}
                </span>
                <span className="text-fg text-sm flex-1 truncate">{f.file.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs text-fg-4">Data Date</label>
                  <input
                    type="date"
                    value={f.dataDate}
                    onChange={e => handleDateChange(f.id, e.target.value)}
                    className="bg-control border border-line rounded-lg px-2 py-1 text-fg text-xs
                      focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleRemoveFile(f.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none shrink-0"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Drop zone */}
      <AddDropZone onFiles={handleAddFiles} />

      {fileList.length < 2 && (
        <p className="text-fg-4 text-xs">
          Add at least 2 schedule files to continue.
          {fileList.length === 1 ? ' Add 1 more.' : ''}
        </p>
      )}

      {fileList.length >= 2 && !fileList.every(f => f.dataDate) && (
        <p className="text-yellow-400 text-xs">
          All schedules need a Data Date before you can continue.
        </p>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {readyToMap && (
        <button
          onClick={handleProceedToMapping}
          className="w-full bg-accent hover:bg-blue-500 text-fg font-semibold py-3 rounded-xl transition-colors"
        >
          Continue to Column Mapping →
        </button>
      )}
    </div>
  )
}
