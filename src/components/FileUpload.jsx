import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { autoMatch } from '../utils/columnMapping'
import DualColumnMapper from './DualColumnMapper'
import ActivityFilter from './ActivityFilter'
import { parseFile } from '../parsers/parseFile'
import { calcBowWave } from '../utils/bowWaveCalc'
import { extractXerDataDate } from '../parsers/parseXer'

const ACCEPTED = '.csv,.xlsx,.xls,.xer'

function DropZone({ label, file, onFile, dataDate, onDataDate }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFile(dropped)
  }

  const handleChange = (e) => {
    if (e.target.files[0]) onFile(e.target.files[0])
  }

  const getExt = (name) => name.split('.').pop().toUpperCase()

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors
          ${dragging ? 'border-blue-400 bg-blue-950' : 'border-gray-600 hover:border-gray-400 bg-gray-900'}`}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} onChange={handleChange} className="hidden" />
        <p className="text-sm text-gray-400 mb-3">{label}</p>
        {file ? (
          <div className="mt-2">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded mr-2">
              {getExt(file.name)}
            </span>
            <span className="text-white text-sm">{file.name}</span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Drag & drop or click to browse<br />CSV, Excel, or XER</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 font-medium">Data Date</label>
        <input
          type="date"
          value={dataDate}
          onChange={(e) => onDataDate(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
            focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  )
}

function extractHeaders(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
          const headers = (rows[0] || []).map(h => String(h).trim()).filter(Boolean)
          resolve(headers)
        } catch (err) { reject(err) }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    } else if (ext === 'csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const firstLine = e.target.result.split('\n')[0]
          const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, '')).filter(Boolean)
          resolve(headers)
        } catch (err) { reject(err) }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    } else if (ext === 'xer') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const lines = e.target.result.split('\n')
          let inTaskTable = false
          let headers = []
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('%T')) {
              inTaskTable = trimmed.replace('%T', '').trim() === 'TASK'
            } else if (inTaskTable && trimmed.startsWith('%F')) {
              headers = trimmed.replace('%F', '').trim().split('\t').map(h => h.trim()).filter(Boolean)
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
  const missing = extras.filter(h => !headers.includes(h))
  return [...missing, ...headers]
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Parsing schedules and running analysis...</p>
    </div>
  )
}

export default function FileUpload({ onResult }) {
  const [fileA, setFileA]             = useState(null)
  const [fileB, setFileB]             = useState(null)
  const [dateA, setDateA]             = useState('')
  const [dateB, setDateB]             = useState('')
  const [stage, setStage]             = useState('upload')
  const [headersA, setHeadersA]       = useState([])
  const [headersB, setHeadersB]       = useState([])
  const [mappingA, setMappingA]       = useState(null)
  const [mappingB, setMappingB]       = useState(null)
  const [parsedA, setParsedA]         = useState(null)
  const [parsedB, setParsedB]         = useState(null)
  const [error, setError]             = useState(null)
  const [loading, setLoading]         = useState(false)

  const readyToAnalyze = fileA && fileB && dateA && dateB

  const handleFileSelected = async (file, setFile, setDate) => {
    setFile(file)
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'xer') {
      const dateStr = await extractXerDataDate(file)
      if (dateStr) setDate(dateStr)
    }
  }

  const handleAnalyzeClick = async () => {
    setError(null)
    try {
      const [hA, hB] = await Promise.all([extractHeaders(fileA), extractHeaders(fileB)])
      const extA = fileA.name.split('.').pop().toLowerCase()
      const extB = fileB.name.split('.').pop().toLowerCase()
      setHeadersA(enrichXerHeaders(hA, extA))
      setHeadersB(enrichXerHeaders(hB, extB))
      setMappingA(autoMatch(enrichXerHeaders(hA, extA)))
      setMappingB(autoMatch(enrichXerHeaders(hB, extB)))
      setStage('mapping')
    } catch (err) {
      setError('Failed to read file headers: ' + err.message)
    }
  }

  const handleConfirmMapping = async (confirmedMappingA, confirmedMappingB) => {
    setMappingA(confirmedMappingA)
    setMappingB(confirmedMappingB)
    setError(null)
    setLoading(true)
    try {
      const [activitiesA, activitiesB] = await Promise.all([
        parseFile(fileA, confirmedMappingA),
        parseFile(fileB, confirmedMappingB),
      ])
      setParsedA(activitiesA)
      setParsedB(activitiesB)
      setStage('filtering')
    } catch (err) {
      setError('Failed to parse files: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = (activitiesA, activitiesB, filterConfig, rawA, rawB) => {
    setLoading(true)
    try {
      const dA = new Date(dateA)
      const dB = new Date(dateB)
      const [scheduleEarly, scheduleLate, dateEarly, dateLate, fileEarly, fileLate, ddEarly, ddLate] =
        dA <= dB
          ? [activitiesA, activitiesB, dateA, dateB, fileA.name, fileB.name, dateA, dateB]
          : [activitiesB, activitiesA, dateB, dateA, fileB.name, fileA.name, dateB, dateA]

      const result = calcBowWave(scheduleEarly, scheduleLate, dateEarly, dateLate)

      // Determine raw order to match early/late assignment
      const rawEarly = dA <= dB ? rawA : rawB
      const rawLate  = dA <= dB ? rawB : rawA

      onResult(result, scheduleEarly, scheduleLate, {
        earlyFile: fileEarly, lateFile: fileLate,
        earlyDate: ddEarly,   lateDate: ddLate,
      }, filterConfig, rawEarly, rawLate)
    } catch (err) {
      setError('Failed to analyze schedules: ' + err.message)
      setLoading(false)
    }
  }

  const handleConfirmFilters = (filteredA, filteredB, filterConfig) => {
    runAnalysis(filteredA, filteredB, filterConfig, parsedA, parsedB)
  }

  const handleSkipFilters = () => {
    runAnalysis(parsedA, parsedB, [], parsedA, parsedB)
  }

  if (loading) return <Spinner />

  if (stage === 'mapping') {
    return (
      <DualColumnMapper
        fileNameA={fileA.name}
        headersA={headersA}
        fileNameB={fileB.name}
        headersB={headersB}
        onConfirm={handleConfirmMapping}
      />
    )
  }

  if (stage === 'filtering') {
    return (
      <ActivityFilter
        activitiesA={parsedA}
        activitiesB={parsedB}
        fileNameA={fileA.name}
        fileNameB={fileB.name}
        onConfirm={handleConfirmFilters}
        onSkip={handleSkipFilters}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <DropZone
          label="Schedule File 1"
          file={fileA}
          onFile={(f) => handleFileSelected(f, setFileA, setDateA)}
          dataDate={dateA}
          onDataDate={setDateA}
        />
        <DropZone
          label="Schedule File 2"
          file={fileB}
          onFile={(f) => handleFileSelected(f, setFileB, setDateB)}
          dataDate={dateB}
          onDataDate={setDateB}
        />
      </div>
      {error && (
        <div className="max-w-3xl bg-red-900/30 border border-red-700 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {readyToAnalyze && (
        <div className="max-w-3xl">
          <button
            onClick={handleAnalyzeClick}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Analyze Schedules
          </button>
        </div>
      )}
    </div>
  )
}