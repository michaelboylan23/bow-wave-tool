import { useState, useMemo, useEffect } from 'react'
import Header from './components/Header'
import FileUpload from './components/FileUpload'
import Instructions from './components/Instructions'
import ProjectInfo from './components/ProjectInfo'
import ScenarioTabs from './components/ScenarioTabs'
import BowWaveChart from './components/BowWaveChart'
import MultiScheduleChart from './components/MultiScheduleChart'
import BowWaveMagnitudeChart from './components/BowWaveMagnitudeChart'
import SCurveChart from './components/SCurveChart'
import { buildChartData, buildMultiSeriesData, buildBowWaveMagnitudeData, buildSCurveData, buildChartDataByCategory } from './utils/buildChartData'
import { calcBowWave } from './utils/bowWaveCalc'
import ScheduleData from './components/ScheduleData'
import FilterBar from './components/FilterBar'
import VersionBanner from './components/VersionBanner'
import BugReportModal from './components/BugReportModal'
import RemapColumnsModal from './components/RemapColumnsModal'
import { trackOpen } from './utils/trackUsage'
import ConfigureTab from './components/ConfigureTab'
import {
  EXAMPLE_SCHEDULE_A, EXAMPLE_SCHEDULE_B,
  EXAMPLE_DATA_DATE_A, EXAMPLE_DATA_DATE_B,
  EXAMPLE_PROJECT_NAME, EXAMPLE_PROJECT_NUMBER,
} from './data/exampleProject'

const CORE_COLUMNS = new Set(['start_date', 'end_date', 'target_drtn_hr_cnt', 'complete_pct', 'activity_id', 'activity_name'])

const genId = () => `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

// ─── Apply filter config to a row array ──────────────────────────────────────
function applyFilterConfig(activities, fc) {
  if (!fc || !fc.length) return activities
  return activities.filter(a =>
    fc.every(f => f.selectedValues.includes(String(a[f.column] ?? '')))
  )
}

export default function App() {
  // ── Track app opens ─────────────────────────────────────────────────────────
  useEffect(() => { trackOpen() }, [])

  // ── Session data ────────────────────────────────────────────────────────────
  // Each schedule: { id, fileName, dataDate, rawRows, filteredRows }
  const [uploadedSchedules, setUploadedSchedules] = useState([])
  const [filterConfig, setFilterConfig]           = useState([])
  // Remap support — raw File objects + mapping stored after upload
  const [rawFileList,    setRawFileList]    = useState([]) // [{ id, file, dataDate }]
  const [columnHeaders,  setColumnHeaders]  = useState([])
  const [activeMapping,  setActiveMapping]  = useState({})

  // ── Project info ────────────────────────────────────────────────────────────
  const [projectName,   setProjectName]   = useState('')
  const [projectNumber, setProjectNumber] = useState('')

  // ── Analysis mode ───────────────────────────────────────────────────────────
  const [analysisMode, setAnalysisMode] = useState('two-schedule')

  // ── Two-schedule analysis state ─────────────────────────────────────────────
  const [selectedPair,  setSelectedPair]  = useState([null, null]) // [idA, idB]
  const [bowWaveResult, setBowWaveResult] = useState(null)
  const [twoSchedInfo,  setTwoSchedInfo]  = useState(null)
  // { earlyId, lateId, earlyFile, lateFile, earlyDate, lateDate }

  // ── Multi-schedule state ────────────────────────────────────────────────────
  const [baselineId, setBaselineId] = useState(null)

  // Category grouping (two-schedule chart)
  const [groupByColumn, setGroupByColumn] = useState(null)
  // Category grouping (multi-schedule chart)
  const [multiGroupByColumn, setMultiGroupByColumn] = useState(null)
  // Per-series display overrides — survive tab switches, reset on new upload
  const [multiSeriesOverrides, setMultiSeriesOverrides] = useState({})
  const [sCurveSeriesOverrides, setSCurveSeriesOverrides] = useState({})
  const [magnitudeScheduleOverrides, setMagnitudeScheduleOverrides] = useState({})
  const [bowWaveCategoryOverrides, setBowWaveCategoryOverrides] = useState({})

  // Track whether multi-schedule analysis has been run
  const [multiScheduleRun, setMultiScheduleRun] = useState(false)

  // ── Zoom state (persists across tab switches and save/load) ─────────────────
  const [bowWaveZoom,    setBowWaveZoom]    = useState({ start: 0, end: -1 })
  const [sCurveZoom,     setSCurveZoom]     = useState({ start: 0, end: -1 })
  const [multiChartZoom, setMultiChartZoom] = useState({ start: 0, end: -1 })
  const [bowWaveYZoom,   setBowWaveYZoom]   = useState({ start: 0, end: -1 })
  const [multiYZoom,     setMultiYZoom]     = useState({ start: 0, end: -1 })

  // ── Display settings ────────────────────────────────────────────────────────
  const [unit,           setUnit]           = useState('hrs')
  const [baseSchedule,   setBaseSchedule]   = useState('B')
  const [scenarioConfig, setScenarioConfig] = useState({
    scenario: 'front-load', endDateOverride: '', recoveryDate: '',
  })

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab,           setActiveTab]           = useState('Analysis')
  const [bugReportOpen,       setBugReportOpen]       = useState(false)
  const [configureOpen,       setConfigureOpen]       = useState(false)
  const [remapOpen,           setRemapOpen]           = useState(false)
  const [confirmingNew,       setConfirmingNew]       = useState(false)
  const [confirmingOverwrite, setConfirmingOverwrite] = useState(false)
  const [pendingUpload,       setPendingUpload]       = useState(null)
  // Edit data dates modal (two-schedule mode)
  const [editingDates,  setEditingDates]  = useState(false)
  const [editEarlyDate, setEditEarlyDate] = useState('')
  const [editLateDate,  setEditLateDate]  = useState('')
  const [editEarlyFile, setEditEarlyFile] = useState('')
  const [editLateFile,  setEditLateFile]  = useState('')

  // ── Derived ─────────────────────────────────────────────────────────────────
  const hasSchedules      = uploadedSchedules.length >= 2
  const hasTwoSchedResult = !!bowWaveResult && !!twoSchedInfo
  const hasMultiResult    = multiScheduleRun && hasSchedules
  const hasAnalysis       = hasTwoSchedResult || hasMultiResult
  const hasProject        = projectName.trim() && projectNumber.trim()

  const earlySchedule = uploadedSchedules.find(s => s.id === twoSchedInfo?.earlyId)
  const lateSchedule  = uploadedSchedules.find(s => s.id === twoSchedInfo?.lateId)

  const chartData = useMemo(() =>
    hasTwoSchedResult && earlySchedule && lateSchedule
      ? buildChartData(
          earlySchedule.filteredRows,
          lateSchedule.filteredRows,
          bowWaveResult,
          scenarioConfig.scenario,
          scenarioConfig.endDateOverride,
          scenarioConfig.recoveryDate,
          baseSchedule,
        )
      : null,
    [hasTwoSchedResult, earlySchedule, lateSchedule, bowWaveResult, scenarioConfig, baseSchedule]
  )

  const multiSeriesData = useMemo(() =>
    multiScheduleRun && hasSchedules
      ? buildMultiSeriesData(uploadedSchedules, baselineId, multiGroupByColumn)
      : null,
    [uploadedSchedules, multiScheduleRun, hasSchedules, baselineId, multiGroupByColumn]
  )

  const bowWaveMagnitudeData = useMemo(() =>
    multiScheduleRun && hasSchedules
      ? buildBowWaveMagnitudeData(uploadedSchedules)
      : null,
    [uploadedSchedules, multiScheduleRun, hasSchedules]
  )

  const sCurveData = useMemo(() =>
    multiScheduleRun && hasSchedules
      ? buildSCurveData(uploadedSchedules)
      : null,
    [uploadedSchedules, multiScheduleRun, hasSchedules]
  )

  const categoryChartData = useMemo(() => {
    if (!groupByColumn || !hasTwoSchedResult || !earlySchedule || !lateSchedule) return null
    return buildChartDataByCategory(
      earlySchedule.filteredRows,
      lateSchedule.filteredRows,
      bowWaveResult,
      scenarioConfig.scenario,
      scenarioConfig.endDateOverride,
      scenarioConfig.recoveryDate,
      baseSchedule,
      groupByColumn,
    )
  }, [groupByColumn, hasTwoSchedResult, earlySchedule, lateSchedule, bowWaveResult, scenarioConfig, baseSchedule])

  // Columns available for filtering/grouping (all non-core fields from schedule data)
  const availableFilterColumns = useMemo(() => {
    const row = uploadedSchedules[0]?.rawRows[0]
    if (!row) return []
    return Object.keys(row).filter(k => !CORE_COLUMNS.has(k)).sort()
  }, [uploadedSchedules])

  // ── Schedule upload callback ────────────────────────────────────────────────
  const applyUpload = (schedules, fc, fileList = [], headers = [], mapping = {}) => {
    setUploadedSchedules(schedules)
    setFilterConfig(fc)
    setRawFileList(fileList)
    setColumnHeaders(headers)
    setActiveMapping(mapping)
    // Reset analysis results
    setBowWaveResult(null)
    setTwoSchedInfo(null)
    setGroupByColumn(null)
    setMultiGroupByColumn(null)
    setMultiSeriesOverrides({})
    setSCurveSeriesOverrides({})
    setMagnitudeScheduleOverrides({})
    setBowWaveCategoryOverrides({})
    setMultiScheduleRun(false)
    // Pre-select first two schedules as the default pair
    if (schedules.length >= 2) {
      setSelectedPair([schedules[0].id, schedules[schedules.length - 1].id])
    }
    setActiveTab('Analysis')
  }

  const handleSchedulesReady = (schedules, fc, fileList = [], headers = [], mapping = {}) => {
    if (hasSchedules) {
      setPendingUpload({ schedules, fc, fileList, headers, mapping })
      setConfirmingOverwrite(true)
    } else {
      applyUpload(schedules, fc, fileList, headers, mapping)
    }
  }

  const confirmOverwrite = () => {
    if (pendingUpload) {
      const { schedules, fc, fileList, headers, mapping } = pendingUpload
      applyUpload(schedules, fc, fileList, headers, mapping)
      setPendingUpload(null)
    }
    setConfirmingOverwrite(false)
  }

  // ── Combined run ─────────────────────────────────────────────────────────────
  const runAllAnalyses = () => {
    let twoSchedOk = false
    const [idA, idB] = selectedPair
    if (idA && idB && idA !== idB) {
      const sA = uploadedSchedules.find(s => s.id === idA)
      const sB = uploadedSchedules.find(s => s.id === idB)
      if (sA && sB) {
        const dA = new Date(sA.dataDate)
        const dB = new Date(sB.dataDate)
        const [early, late] = dA <= dB ? [sA, sB] : [sB, sA]
        try {
          const result = calcBowWave(early.filteredRows, late.filteredRows, early.dataDate, late.dataDate)
          setBowWaveResult(result)
          setBowWaveZoom({ start: 0, end: -1 })
          setTwoSchedInfo({
            earlyId: early.id, lateId: late.id,
            earlyFile: early.fileName, lateFile: late.fileName,
            earlyDate: early.dataDate, lateDate: late.dataDate,
          })
          twoSchedOk = true
        } catch (err) {
          alert('Bow wave analysis failed: ' + err.message)
        }
      }
    }
    setMultiScheduleRun(true)
    setSCurveZoom({ start: 0, end: -1 })
    setMultiChartZoom({ start: 0, end: -1 })
    setActiveTab(twoSchedOk ? 'Bow Wave' : 'Trend')
  }

  // ── Edit data dates (two-schedule mode) ────────────────────────────────────
  const openDateModal = () => {
    setEditEarlyDate(twoSchedInfo?.earlyDate?.toString().slice(0, 10) ?? '')
    setEditLateDate(twoSchedInfo?.lateDate?.toString().slice(0, 10)   ?? '')
    setEditEarlyFile(twoSchedInfo?.earlyFile ?? '')
    setEditLateFile(twoSchedInfo?.lateFile   ?? '')
    setEditingDates(true)
  }

  const handleDateEdit = () => {
    const earlyActivities = editEarlyFile === twoSchedInfo.earlyFile
      ? earlySchedule?.filteredRows
      : lateSchedule?.filteredRows
    const lateActivities = editEarlyFile === twoSchedInfo.earlyFile
      ? lateSchedule?.filteredRows
      : earlySchedule?.filteredRows
    if (!earlyActivities || !lateActivities) return
    try {
      const result = calcBowWave(earlyActivities, lateActivities, editEarlyDate, editLateDate)
      setBowWaveResult(result)
      setTwoSchedInfo(prev => ({
        ...prev,
        earlyFile: editEarlyFile, lateFile: editLateFile,
        earlyDate: editEarlyDate, lateDate: editLateDate,
      }))
    } catch {}
    setEditingDates(false)
  }

  // ── Schedule list management ────────────────────────────────────────────────
  const deleteSchedule = (id) => {
    setUploadedSchedules(prev => prev.filter(s => s.id !== id))
    setSelectedPair(prev => prev.map(p => p === id ? null : p))
    if (baselineId === id) setBaselineId(null)
    if (twoSchedInfo?.earlyId === id || twoSchedInfo?.lateId === id) {
      setBowWaveResult(null)
      setTwoSchedInfo(null)
    }
  }

  const moveSchedule = (id, dir) => {
    setUploadedSchedules(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  // ── New Project ─────────────────────────────────────────────────────────────
  const confirmNew = () => {
    setProjectName('')
    setProjectNumber('')
    setUploadedSchedules([])
    setFilterConfig([])
    setBowWaveResult(null)
    setTwoSchedInfo(null)
    setSelectedPair([null, null])
    setBaselineId(null)
    setAnalysisMode('two-schedule')
    setActiveTab('Analysis')
    setScenarioConfig({ scenario: 'front-load', endDateOverride: '', recoveryDate: '' })
    setUnit('hrs')
    setBaseSchedule('B')
    setGroupByColumn(null)
    setMultiScheduleRun(false)
    setBowWaveZoom({ start: 0, end: -1 })
    setSCurveZoom({ start: 0, end: -1 })
    setMultiChartZoom({ start: 0, end: -1 })
    setConfirmingNew(false)
  }

  // ── Save / Load ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    const payload = {
      version: 2,
      projectName, projectNumber,
      uploadedSchedules,
      filterConfig,
      analysisMode,
      selectedPair,
      bowWaveResult,
      twoSchedInfo,
      baselineId,
      scenarioConfig,
      unit,
      baseSchedule,
      bowWaveZoom, sCurveZoom, multiChartZoom, bowWaveYZoom, multiYZoom,
      savedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${projectNumber}-${projectName}.bwt`.replace(/\s+/g, '-')
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoad = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const payload = JSON.parse(ev.target.result)

        const rehydrateRows = (rows) =>
          (rows || []).map(a => ({
            ...a,
            start_date: a.start_date ? new Date(a.start_date) : null,
            end_date:   a.end_date   ? new Date(a.end_date)   : null,
          }))

        // ── v2 format ──
        if (payload.version === 2) {
          const schedules = (payload.uploadedSchedules || []).map(s => ({
            ...s,
            rawRows:      rehydrateRows(s.rawRows),
            filteredRows: rehydrateRows(s.filteredRows),
          }))

          if (payload.bowWaveResult) {
            payload.bowWaveResult.windowStart = new Date(payload.bowWaveResult.windowStart)
            payload.bowWaveResult.windowEnd   = new Date(payload.bowWaveResult.windowEnd)
          }

          setProjectName(payload.projectName   || '')
          setProjectNumber(payload.projectNumber || '')
          setUploadedSchedules(schedules)
          setFilterConfig(payload.filterConfig   || [])
          setAnalysisMode(payload.analysisMode   || 'two-schedule')
          setSelectedPair(payload.selectedPair   || [null, null])
          setBowWaveResult(payload.bowWaveResult || null)
          setTwoSchedInfo(payload.twoSchedInfo   || null)
          setBaselineId(payload.baselineId       || null)
          setScenarioConfig(payload.scenarioConfig || { scenario: 'front-load', endDateOverride: '', recoveryDate: '' })
          setUnit(payload.unit         || 'hrs')
          setBaseSchedule(payload.baseSchedule || 'B')
          setMultiScheduleRun(payload.analysisMode === 'multi-schedule')
          setGroupByColumn(null)
          setBowWaveZoom(payload.bowWaveZoom     || { start: 0, end: -1 })
          setSCurveZoom(payload.sCurveZoom       || { start: 0, end: -1 })
          setMultiChartZoom(payload.multiChartZoom || { start: 0, end: -1 })
          setBowWaveYZoom(payload.bowWaveYZoom   || { start: 0, end: -1 })
          setMultiYZoom(payload.multiYZoom       || { start: 0, end: -1 })
          setActiveTab(payload.bowWaveResult ? 'Bow Wave' : 'Trend')

        // ── v1 migration ──
        } else {
          const earlyRows = rehydrateRows(payload.schedules?.early)
          const lateRows  = rehydrateRows(payload.schedules?.late)
          const earlyRaw  = rehydrateRows(payload.rawSchedules?.early || payload.schedules?.early)
          const lateRaw   = rehydrateRows(payload.rawSchedules?.late  || payload.schedules?.late)

          const idA = genId(), idB = genId()
          const migrated = [
            { id: idA, fileName: payload.scheduleInfo?.earlyFile || 'Schedule 1',
              dataDate: payload.scheduleInfo?.earlyDate || '', rawRows: earlyRaw, filteredRows: earlyRows },
            { id: idB, fileName: payload.scheduleInfo?.lateFile  || 'Schedule 2',
              dataDate: payload.scheduleInfo?.lateDate  || '', rawRows: lateRaw,  filteredRows: lateRows  },
          ]

          if (payload.bowWaveResult) {
            payload.bowWaveResult.windowStart = new Date(payload.bowWaveResult.windowStart)
            payload.bowWaveResult.windowEnd   = new Date(payload.bowWaveResult.windowEnd)
          }

          setProjectName(payload.projectName   || '')
          setProjectNumber(payload.projectNumber || '')
          setUploadedSchedules(migrated)
          setFilterConfig(payload.filterConfig   || [])
          setAnalysisMode('two-schedule')
          setSelectedPair([idA, idB])
          setBowWaveResult(payload.bowWaveResult || null)
          setTwoSchedInfo(payload.scheduleInfo ? {
            earlyId: idA, lateId: idB,
            earlyFile: payload.scheduleInfo.earlyFile, lateFile: payload.scheduleInfo.lateFile,
            earlyDate: payload.scheduleInfo.earlyDate, lateDate: payload.scheduleInfo.lateDate,
          } : null)
          setBaselineId(null)
          setScenarioConfig(payload.scenarioConfig || { scenario: 'front-load', endDateOverride: '', recoveryDate: '' })
          setUnit(payload.unit         || 'hrs')
          setBaseSchedule(payload.baseSchedule || 'B')
          setMultiScheduleRun(false)
          setGroupByColumn(null)
          setActiveTab('Bow Wave')
        }
      } catch (err) {
        alert('Failed to load project file. Please make sure it is a valid .bwt file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Example project ─────────────────────────────────────────────────────────
  const loadExample = () => {
    const result = calcBowWave(
      EXAMPLE_SCHEDULE_A, EXAMPLE_SCHEDULE_B,
      EXAMPLE_DATA_DATE_A, EXAMPLE_DATA_DATE_B,
    )
    const idA = 'example_a', idB = 'example_b'
    const schedules = [
      { id: idA, fileName: 'example-schedule-1.xlsx', dataDate: EXAMPLE_DATA_DATE_A,
        rawRows: EXAMPLE_SCHEDULE_A, filteredRows: EXAMPLE_SCHEDULE_A },
      { id: idB, fileName: 'example-schedule-2.xlsx', dataDate: EXAMPLE_DATA_DATE_B,
        rawRows: EXAMPLE_SCHEDULE_B, filteredRows: EXAMPLE_SCHEDULE_B },
    ]
    setProjectName(EXAMPLE_PROJECT_NAME)
    setProjectNumber(EXAMPLE_PROJECT_NUMBER)
    setUploadedSchedules(schedules)
    setFilterConfig([])
    setAnalysisMode('two-schedule')
    setSelectedPair([idA, idB])
    setBowWaveResult(result)
    setTwoSchedInfo({
      earlyId: idA, lateId: idB,
      earlyFile: 'example-schedule-1.xlsx', lateFile: 'example-schedule-2.xlsx',
      earlyDate: EXAMPLE_DATA_DATE_A, lateDate: EXAMPLE_DATA_DATE_B,
    })
    setBaselineId(null)
    setMultiScheduleRun(true)
    setActiveTab('Bow Wave')
  }

  const formatDate = (str) => {
    if (!str) return ''
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // ── FilterBar re-filter handler (two-schedule mode) ─────────────────────────
  const handleReFilter = (newConfig) => {
    const newSchedules = uploadedSchedules.map(s => ({
      ...s,
      filteredRows: applyFilterConfig(s.rawRows, newConfig),
    }))
    setUploadedSchedules(newSchedules)
    setFilterConfig(newConfig)
    // Recalculate two-schedule analysis if active
    if (bowWaveResult && twoSchedInfo) {
      const newEarly = newSchedules.find(s => s.id === twoSchedInfo.earlyId)
      const newLate  = newSchedules.find(s => s.id === twoSchedInfo.lateId)
      if (newEarly && newLate) {
        try {
          const result = calcBowWave(newEarly.filteredRows, newLate.filteredRows, twoSchedInfo.earlyDate, twoSchedInfo.lateDate)
          setBowWaveResult(result)
        } catch {}
      }
    }
  }

  const addFilterColumn = (column) => {
    if (!column || filterConfig.some(f => f.column === column)) return
    const allValues = [...new Set(
      uploadedSchedules.flatMap(s => s.rawRows.map(a => String(a[column] ?? '')).filter(Boolean))
    )].sort()
    handleReFilter([...filterConfig, { column, selectedValues: allValues }])
  }

  const removeFilterColumn = (column) => {
    handleReFilter(filterConfig.filter(f => f.column !== column))
  }

  const TABS = [
    { key: 'Instructions',  label: 'Instructions',          show: true },
    { key: 'Analysis',      label: 'Analysis',              show: true },
    { key: 'Bow Wave',      label: 'Two-Schedule Bow Wave', show: hasTwoSchedResult },
    { key: 'Trend',         label: 'Multi-Schedule Trend',  show: hasMultiResult },
    { key: 'Schedule Data', label: 'Schedule Data',         show: hasAnalysis },
  ]

  return (
    <div className="h-screen bg-bg text-fg flex flex-col overflow-hidden">

      <Header
        projectName={projectName}
        projectNumber={projectNumber}
        onProjectNameChange={setProjectName}
        onProjectNumberChange={setProjectNumber}
        hasAnalysis={hasAnalysis}
        onSave={handleSave}
        onNewProject={() => setConfirmingNew(true)}
        onReportBug={() => setBugReportOpen(true)}
        onConfigure={() => setConfigureOpen(true)}
      />
      {/* TODO: Re-enable once Azure Pipelines publishes releases */}
      {/* <VersionBanner /> */}
      {bugReportOpen && <BugReportModal onClose={() => setBugReportOpen(false)} />}

      {/* ── Configure Modal ── */}
      {configureOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-end z-50"
          onClick={() => setConfigureOpen(false)}>
          <div className="bg-bg h-full w-full max-w-lg overflow-y-auto p-8 flex flex-col gap-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-fg font-bold text-lg">Settings</h2>
              <button onClick={() => setConfigureOpen(false)}
                className="text-fg-4 hover:text-fg text-xl leading-none transition-colors">✕</button>
            </div>
            <ConfigureTab />
          </div>
        </div>
      )}
      {remapOpen && (
        <RemapColumnsModal
          headers={columnHeaders}
          currentMapping={activeMapping}
          rawFiles={rawFileList}
          onConfirm={(newSchedules, newMapping) => {
            setActiveMapping(newMapping)
            applyUpload(newSchedules, [], rawFileList, columnHeaders, newMapping)
            setRemapOpen(false)
          }}
          onClose={() => setRemapOpen(false)}
        />
      )}

      {/* ── Confirm New Project ── */}
      {confirmingNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-line rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h2 className="text-fg font-bold text-lg">Start New Project?</h2>
            <p className="text-fg-3 text-sm">All unsaved analysis data will be cleared.</p>
            <div className="flex gap-3">
              <button onClick={confirmNew}
                className="flex-1 bg-red-600 hover:bg-red-500 text-fg font-semibold py-2 rounded-lg text-sm transition-colors">
                Yes, Start New
              </button>
              <button onClick={() => setConfirmingNew(false)}
                className="flex-1 bg-control hover:bg-muted text-fg-2 font-semibold py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Overwrite ── */}
      {confirmingOverwrite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-line rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h2 className="text-fg font-bold text-lg">Replace Uploaded Schedules?</h2>
            <p className="text-fg-3 text-sm">
              This will replace all currently uploaded schedules and clear any existing analysis results.
            </p>
            <div className="flex gap-3">
              <button onClick={confirmOverwrite}
                className="flex-1 bg-accent-b hover:bg-orange-500 text-fg font-semibold py-2 rounded-lg text-sm transition-colors">
                Yes, Replace
              </button>
              <button onClick={() => { setConfirmingOverwrite(false); setPendingUpload(null) }}
                className="flex-1 bg-control hover:bg-muted text-fg-2 font-semibold py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Data Dates Modal (two-schedule mode) ── */}
      {editingDates && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card border border-line rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6">
            <h2 className="text-fg font-bold text-lg">Edit Data Dates</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-3 font-medium uppercase tracking-wide">
                  Schedule 1 — {editEarlyFile}
                </label>
                <input type="date" value={editEarlyDate} onChange={e => setEditEarlyDate(e.target.value)}
                  className="bg-control border border-line rounded-lg px-3 py-2 text-fg text-sm
                    focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    const td = editEarlyDate, tf = editEarlyFile
                    setEditEarlyDate(editLateDate); setEditEarlyFile(editLateFile)
                    setEditLateDate(td);  setEditLateFile(tf)
                  }}
                  className="text-xs text-fg-4 hover:text-fg bg-control hover:bg-muted
                    border border-line hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ⇄ Swap Schedules
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-3 font-medium uppercase tracking-wide">
                  Schedule 2 — {editLateFile}
                </label>
                <input type="date" value={editLateDate} onChange={e => setEditLateDate(e.target.value)}
                  className="bg-control border border-line rounded-lg px-3 py-2 text-fg text-sm
                    focus:outline-none focus:border-accent transition-colors" />
              </div>
              {editEarlyDate && editLateDate && editEarlyDate >= editLateDate && (
                <p className="text-red-400 text-xs">Schedule 1 date must be earlier than Schedule 2 date.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                disabled={!editEarlyDate || !editLateDate || editEarlyDate >= editLateDate}
                onClick={handleDateEdit}
                className="flex-1 bg-accent hover:bg-blue-500 text-fg font-semibold py-2 rounded-lg text-sm
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reanalyze
              </button>
              <button onClick={() => setEditingDates(false)}
                className="flex-1 bg-control hover:bg-muted text-fg-2 font-semibold py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">

          {/* ── Tab Bar ── */}
          <div className="sticky top-0 z-30 bg-bg -mx-8 px-8 pt-2 flex gap-2 border-b border-line-subtle">
            {TABS.filter(t => t.show).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${activeTab === tab.key
                    ? 'border-blue-500 text-fg'
                    : 'border-transparent text-fg-3 hover:text-fg'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Instructions ── */}
          {activeTab === 'Instructions' && <Instructions />}

          {/* ── Analysis Tab ── */}
          {activeTab === 'Analysis' && (
            <div className="flex flex-col gap-8">

              {/* Load / Example row */}
              <div className="max-w-3xl flex flex-col gap-3">
                <div className="bg-card rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-fg text-sm font-medium">Load Existing Project</p>
                    <p className="text-fg-3 text-xs mt-0.5">Restore a previously saved .bwt project file</p>
                  </div>
                  <label className="cursor-pointer bg-control hover:bg-muted text-fg-2 hover:text-fg
                    text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    Browse...
                    <input type="file" accept=".bwt" onChange={handleLoad} className="hidden" />
                  </label>
                </div>

                <div className="bg-card rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-fg text-sm font-medium">Example Project</p>
                    <p className="text-fg-3 text-xs mt-0.5">Load a pre-built example to explore the tool without uploading real schedule files</p>
                  </div>
                  <button onClick={loadExample}
                    className="bg-green-700 hover:bg-green-600 text-fg font-semibold
                      px-4 py-2 rounded-lg transition-colors text-sm shrink-0">
                    ⚡ Load Example
                  </button>
                </div>
              </div>

              <div className="max-w-3xl flex items-center gap-3">
                <div className="flex-1 h-px bg-control" />
                <span className="text-gray-600 text-xs">or start a new project below</span>
                <div className="flex-1 h-px bg-control" />
              </div>

              <ProjectInfo
                projectName={projectName}
                projectNumber={projectNumber}
                onProjectNameChange={setProjectName}
                onProjectNumberChange={setProjectNumber}
              />

              {!hasProject ? (
                <p className="text-fg-4 text-sm">Enter a project name and number above to begin.</p>
              ) : (
                <>
                  {/* ── Upload section ── */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-fg-4 uppercase tracking-wide font-medium">
                      {hasSchedules ? `Uploaded Schedules (${uploadedSchedules.length})` : 'Upload Schedules'}
                    </p>
                    <FileUpload onSchedulesReady={handleSchedulesReady} />
                  </div>

                  {/* ── Analysis configuration — only shown once schedules are loaded ── */}
                  {hasSchedules && (
                    <div className="flex flex-col gap-6 max-w-3xl">

                      {/* Divider */}
                      <div className="h-px bg-control" />

                      {/* Loaded schedules summary */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-fg-4 uppercase tracking-wide font-medium">Loaded Schedules</p>
                          {rawFileList.length > 0 && (
                            <button
                              onClick={() => setRemapOpen(true)}
                              className="text-xs text-fg-3 hover:text-fg bg-control hover:bg-muted
                                border border-line hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Remap Columns
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {uploadedSchedules.map((s, i) => (
                            <div key={s.id}
                              className="flex items-center gap-3 bg-card rounded-lg px-4 py-2.5">
                              {/* Reorder buttons */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  onClick={() => moveSchedule(s.id, -1)}
                                  disabled={i === 0}
                                  className="text-gray-600 hover:text-fg disabled:opacity-20 disabled:cursor-default
                                    leading-none text-xs px-0.5 transition-colors"
                                  title="Move up"
                                >▲</button>
                                <button
                                  onClick={() => moveSchedule(s.id, 1)}
                                  disabled={i === uploadedSchedules.length - 1}
                                  className="text-gray-600 hover:text-fg disabled:opacity-20 disabled:cursor-default
                                    leading-none text-xs px-0.5 transition-colors"
                                  title="Move down"
                                >▼</button>
                              </div>
                              <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                              <span className="text-fg text-sm flex-1 truncate">{s.fileName}</span>
                              <span className="text-fg-3 text-xs shrink-0">
                                Data Date: {formatDate(s.dataDate)}
                              </span>
                              <span className="text-blue-400 text-xs shrink-0">
                                {s.filteredRows.length.toLocaleString()} activities
                              </span>
                              {/* Delete button */}
                              <button
                                onClick={() => deleteSchedule(s.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors text-xs shrink-0 ml-1"
                                title="Remove schedule"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Two-column analysis settings */}
                      <div className="grid grid-cols-2 gap-4">

                        {/* Bow Wave Analysis */}
                        <div className="bg-bg rounded-xl p-4 flex flex-col gap-3">
                          <div>
                            <p className="text-sm font-semibold text-fg-2">Bow Wave Analysis</p>
                            <p className="text-xs text-fg-4 mt-0.5">Compare two snapshots to measure scope growth.</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-fg-3">Earlier Schedule</label>
                            <select
                              value={selectedPair[0] || ''}
                              onChange={e => setSelectedPair(prev => [e.target.value || null, prev[1]])}
                              className="bg-card border border-line rounded-lg px-3 py-2 text-fg text-sm
                                focus:outline-none focus:border-accent transition-colors w-full"
                            >
                              <option value="">— Select schedule —</option>
                              {uploadedSchedules.map(s => (
                                <option key={s.id} value={s.id}>{s.fileName} ({formatDate(s.dataDate)})</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-fg-3">Later Schedule</label>
                            <select
                              value={selectedPair[1] || ''}
                              onChange={e => setSelectedPair(prev => [prev[0], e.target.value || null])}
                              className="bg-card border border-line rounded-lg px-3 py-2 text-fg text-sm
                                focus:outline-none focus:border-accent transition-colors w-full"
                            >
                              <option value="">— Select schedule —</option>
                              {uploadedSchedules.map(s => (
                                <option key={s.id} value={s.id}>{s.fileName} ({formatDate(s.dataDate)})</option>
                              ))}
                            </select>
                          </div>
                          {selectedPair[0] && selectedPair[1] && selectedPair[0] === selectedPair[1] && (
                            <p className="text-red-400 text-xs">Please select two different schedules.</p>
                          )}
                        </div>

                        {/* Multi-Schedule Trend */}
                        <div className="bg-bg rounded-xl p-4 flex flex-col gap-3">
                          <div>
                            <p className="text-sm font-semibold text-fg-2">Multi-Schedule Trend</p>
                            <p className="text-xs text-fg-4 mt-0.5">Analyse all schedules together to reveal scope and progress trends.</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-fg-3">Baseline Schedule <span className="text-fg-4">(optional)</span></label>
                            <select
                              value={baselineId || ''}
                              onChange={e => setBaselineId(e.target.value || null)}
                              className="bg-card border border-line rounded-lg px-3 py-2 text-fg text-sm
                                focus:outline-none focus:border-accent transition-colors w-full"
                            >
                              <option value="">No baseline</option>
                              {uploadedSchedules.map(s => (
                                <option key={s.id} value={s.id}>{s.fileName} ({formatDate(s.dataDate)})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Single run button */}
                      <button
                        onClick={runAllAnalyses}
                        disabled={!hasSchedules}
                        className="w-fit bg-accent hover:bg-blue-500 text-fg font-semibold
                          px-6 py-2.5 rounded-xl text-sm transition-colors
                          disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Run Analysis
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Bow Wave Tab ── */}
          {activeTab === 'Bow Wave' && hasTwoSchedResult && (
            <div className="flex flex-col gap-8">

              {/* Schedule summary bar */}
              {twoSchedInfo && (
                <div className="bg-card rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-fg-4 uppercase tracking-wide font-medium">Schedule 1 (Earlier)</p>
                    <p className="text-fg text-sm font-medium">{twoSchedInfo.earlyFile}</p>
                    <p className="text-fg-3 text-xs">Data Date: {formatDate(twoSchedInfo.earlyDate)}</p>
                  </div>
                  <div className="text-gray-600 text-xl">→</div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-fg-4 uppercase tracking-wide font-medium">Schedule 2 (Later)</p>
                    <p className="text-fg text-sm font-medium">{twoSchedInfo.lateFile}</p>
                    <p className="text-fg-3 text-xs">Data Date: {formatDate(twoSchedInfo.lateDate)}</p>
                  </div>
                  <button
                    onClick={openDateModal}
                    className="ml-auto text-xs text-fg-4 hover:text-fg bg-control hover:bg-muted
                      border border-line hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit Data Dates
                  </button>
                </div>
              )}

              {/* Filter bar */}
              <FilterBar
                scheduleList={uploadedSchedules.map(s => s.rawRows)}
                filterConfig={filterConfig}
                onApply={handleReFilter}
                availableColumns={availableFilterColumns}
                onAddColumn={addFilterColumn}
                onRemoveColumn={removeFilterColumn}
              />

              {/* Scenario tabs */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-fg-4 uppercase tracking-wide font-medium">Redistribution Scenario</p>
                <ScenarioTabs bowWaveResult={bowWaveResult} onScenarioChange={setScenarioConfig} scenarioConfig={scenarioConfig} />
              </div>

              {/* Chart + KPI */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-fg-4 uppercase tracking-wide font-medium">Workload Chart</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-fg-3">Base schedule:</p>
                    <div className="flex items-center gap-1 bg-card rounded-lg p-1">
                      {[{ key: 'A', label: 'Schedule 1' }, { key: 'B', label: 'Schedule 2' }].map(opt => (
                        <button key={opt.key} onClick={() => setBaseSchedule(opt.key)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                            ${baseSchedule === opt.key ? 'bg-accent text-fg' : 'text-fg-3 hover:text-fg'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 bg-card rounded-lg p-1">
                      {[
                        { key: 'hrs', label: 'Hours' },
                        { key: 'days', label: 'Days' },
                        { key: 'act_finish', label: 'Finishing' },
                        { key: 'act_start', label: 'Starting' },
                      ].map(u => (
                        <button key={u.key} onClick={() => setUnit(u.key)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                            ${unit === u.key ? 'bg-accent text-fg' : 'text-fg-3 hover:text-fg'}`}>
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <BowWaveChart
                  chartData={chartData}
                  bowWaveResult={bowWaveResult}
                  unit={unit}
                  onUnitChange={setUnit}
                  baseSchedule={baseSchedule}
                  groupByColumn={groupByColumn}
                  onGroupByChange={setGroupByColumn}
                  groupByColumns={availableFilterColumns}
                  categoryChartData={categoryChartData}
                  zoomStart={bowWaveZoom.start}
                  zoomEnd={bowWaveZoom.end}
                  onZoomChange={(s, e) => setBowWaveZoom({ start: s, end: e })}
                  projectName={projectName}
                  projectNumber={projectNumber}
                  scenarioConfig={scenarioConfig}
                  categoryOverrides={bowWaveCategoryOverrides}
                  onCategoryOverridesChange={setBowWaveCategoryOverrides}
                  filterConfig={filterConfig}
                  yZoomStart={bowWaveYZoom.start}
                  yZoomEnd={bowWaveYZoom.end}
                  onYZoomChange={(s, e) => setBowWaveYZoom({ start: s, end: e })}
                />
              </div>
            </div>
          )}

          {/* ── Trend Tab ── */}
          {activeTab === 'Trend' && hasMultiResult && (
            <div className="flex flex-col gap-8">

              {/* Filter bar */}
              <FilterBar
                scheduleList={uploadedSchedules.map(s => s.rawRows)}
                filterConfig={filterConfig}
                onApply={handleReFilter}
                availableColumns={availableFilterColumns}
                onAddColumn={addFilterColumn}
                onRemoveColumn={removeFilterColumn}
              />

              {/* Units toggle */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-fg-4 uppercase tracking-wide font-medium">
                  Multi-Schedule Trend — {uploadedSchedules.length} schedules
                </p>
                <div className="flex items-center gap-1 bg-card rounded-lg p-1">
                  {[
                    { key: 'hrs', label: 'Hours' },
                    { key: 'days', label: 'Days' },
                    { key: 'act_finish', label: 'Finishing' },
                    { key: 'act_start', label: 'Starting' },
                  ].map(u => (
                    <button key={u.key} onClick={() => setUnit(u.key)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                        ${unit === u.key ? 'bg-accent text-fg' : 'text-fg-3 hover:text-fg'}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <MultiScheduleChart
                multiSeriesData={multiSeriesData}
                unit={unit}
                baselineId={baselineId}
                onBaselineChange={setBaselineId}
                uploadedSchedules={uploadedSchedules}
                zoomStart={multiChartZoom.start}
                zoomEnd={multiChartZoom.end}
                onZoomChange={(s, e) => setMultiChartZoom({ start: s, end: e })}
                projectName={projectName}
                projectNumber={projectNumber}
                groupByColumn={multiGroupByColumn}
                onGroupByChange={setMultiGroupByColumn}
                groupByColumns={availableFilterColumns}
                seriesOverrides={multiSeriesOverrides}
                onSeriesOverridesChange={setMultiSeriesOverrides}
                yZoomStart={multiYZoom.start}
                yZoomEnd={multiYZoom.end}
                onYZoomChange={(s, e) => setMultiYZoom({ start: s, end: e })}
              />

              <BowWaveMagnitudeChart
                magnitudeData={bowWaveMagnitudeData}
                unit={unit}
                projectName={projectName}
                projectNumber={projectNumber}
                scheduleOverrides={magnitudeScheduleOverrides}
                onScheduleOverridesChange={setMagnitudeScheduleOverrides}
              />

              <SCurveChart
                sCurveData={sCurveData}
                unit={unit}
                zoomStart={sCurveZoom.start}
                zoomEnd={sCurveZoom.end}
                onZoomChange={(s, e) => setSCurveZoom({ start: s, end: e })}
                projectName={projectName}
                projectNumber={projectNumber}
                seriesOverrides={sCurveSeriesOverrides}
                onSeriesOverridesChange={setSCurveSeriesOverrides}
              />
            </div>
          )}


          {/* ── Schedule Data Tab ── */}
          {activeTab === 'Schedule Data' && hasAnalysis && (
            <ScheduleData schedules={uploadedSchedules} />
          )}

        </div>
      </main>
    </div>
  )
}
