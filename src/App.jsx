import { useState } from 'react'
import Header from './components/Header'
import FileUpload from './components/FileUpload'
import Instructions from './components/Instructions'
import ProjectInfo from './components/ProjectInfo'
import KpiCards from './components/KpiCards'
import ScenarioTabs from './components/ScenarioTabs'
import BowWaveChart from './components/BowWaveChart'
import { buildChartData } from './utils/buildChartData'
import { calcBowWave } from './utils/bowWaveCalc'
import ScheduleData from './components/ScheduleData'
import ActivityFilter from './components/ActivityFilter'
import FilterBar from './components/FilterBar'
import {
  EXAMPLE_SCHEDULE_A, EXAMPLE_SCHEDULE_B,
  EXAMPLE_DATA_DATE_A, EXAMPLE_DATA_DATE_B,
  EXAMPLE_PROJECT_NAME, EXAMPLE_PROJECT_NUMBER,
} from './data/exampleProject'

export default function App() {
  const [projectName, setProjectName]       = useState('')
  const [projectNumber, setProjectNumber]   = useState('')
  const [activeTab, setActiveTab]           = useState('Analysis')
  const [bowWaveResult, setBowWaveResult]   = useState(null)
  const [schedules, setSchedules]           = useState(null)
  const [scheduleInfo, setScheduleInfo]     = useState(null)
  const [unit, setUnit]                     = useState('hrs')
  const [baseSchedule, setBaseSchedule]     = useState('B')
  const [scenarioConfig, setScenarioConfig] = useState({
    scenario: 'front-load',
    endDateOverride: '',
    recoveryDate: '',
  })
  const [confirmingNew, setConfirmingNew]         = useState(false)
  const [confirmingOverwrite, setConfirmingOverwrite] = useState(false)
  const [pendingResult, setPendingResult]         = useState(null)
  const [editingDates, setEditingDates]   = useState(false)
  const [editEarlyDate, setEditEarlyDate] = useState('')
  const [editLateDate, setEditLateDate]   = useState('')
  const [editEarlyFile, setEditEarlyFile] = useState('')
  const [editLateFile, setEditLateFile]   = useState('')
  const [filterConfig, setFilterConfig]   = useState([])
  const [rawSchedules, setRawSchedules]   = useState(null)

  const hasAnalysis = !!bowWaveResult
  const hasProject  = projectName.trim() && projectNumber.trim()

  const chartData = bowWaveResult && schedules
    ? buildChartData(
        schedules.early,
        schedules.late,
        bowWaveResult,
        scenarioConfig.scenario,
        scenarioConfig.endDateOverride,
        scenarioConfig.recoveryDate,
        baseSchedule,
      )
    : null

  const applyResult = (result, early, late, info, fc = [], rawEarly = null, rawLate = null) => {
    setBowWaveResult(result)
    setSchedules({ early, late })
    setScheduleInfo(info)
    setFilterConfig(fc)
    if (rawEarly && rawLate) setRawSchedules({ early: rawEarly, late: rawLate })
    setActiveTab('Results')
  }

  const handleResult = (result, early, late, info, fc = [], rawEarly = null, rawLate = null) => {
    if (hasAnalysis) {
      setPendingResult({ result, early, late, info, fc, rawEarly, rawLate })
      setConfirmingOverwrite(true)
    } else {
      applyResult(result, early, late, info, fc, rawEarly, rawLate)
    }
  }

  const confirmOverwrite = () => {
    if (pendingResult) {
      const { result, early, late, info, fc, rawEarly, rawLate } = pendingResult
      applyResult(result, early, late, info, fc, rawEarly, rawLate)
      setPendingResult(null)
    }
    setConfirmingOverwrite(false)
  }

  const handleSave = () => {
    const payload = {
      projectName,
      projectNumber,
      bowWaveResult,
      scheduleInfo,
      scenarioConfig,
      unit,
      baseSchedule,
      schedules: {
        early: schedules.early,
        late:  schedules.late,
      },
      filterConfig,
      rawSchedules: {
        early: rawSchedules?.early,
        late:  rawSchedules?.late,
      },
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

        // Rehydrate date strings into Date objects for schedule arrays
        const rehydrate = (activities) =>
          (activities || []).map(a => ({
            ...a,
            start_date: a.start_date ? new Date(a.start_date) : null,
            end_date:   a.end_date   ? new Date(a.end_date)   : null,
          }))

        // Rehydrate bowWaveResult dates
        if (payload.bowWaveResult) {
          payload.bowWaveResult.windowStart = new Date(payload.bowWaveResult.windowStart)
          payload.bowWaveResult.windowEnd   = new Date(payload.bowWaveResult.windowEnd)
        }

        setProjectName(payload.projectName   || '')
        setProjectNumber(payload.projectNumber || '')
        setBowWaveResult(payload.bowWaveResult || null)
        setScheduleInfo(payload.scheduleInfo   || null)
        setScenarioConfig(payload.scenarioConfig || { scenario: 'front-load', endDateOverride: '', recoveryDate: '' })
        setUnit(payload.unit               || 'hrs')
        setBaseSchedule(payload.baseSchedule   || 'B')
        setFilterConfig(payload.filterConfig   || [])
        setRawSchedules(payload.rawSchedules ? {
          early: rehydrate(payload.rawSchedules.early),
          late:  rehydrate(payload.rawSchedules.late),
        } : null)
        setSchedules({
          early: rehydrate(payload.schedules?.early),
          late:  rehydrate(payload.schedules?.late),
        })
        setActiveTab('Results')
      } catch (err) {
        alert('Failed to load project file. Please make sure it is a valid .bwt file.')
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be loaded again if needed
    e.target.value = ''
  }

  const handleNewProject = () => setConfirmingNew(true)

  const confirmNew = () => {
    setProjectName('')
    setProjectNumber('')
    setBowWaveResult(null)
    setSchedules(null)
    setScheduleInfo(null)
    setActiveTab('Analysis')
    setScenarioConfig({ scenario: 'front-load', endDateOverride: '', recoveryDate: '' })
    setUnit('hrs')
    setBaseSchedule('B')
    setFilterConfig([])
    setRawSchedules(null)
    setConfirmingNew(false)
  }

  const loadExample = () => {
    const result = calcBowWave(
      EXAMPLE_SCHEDULE_A,
      EXAMPLE_SCHEDULE_B,
      EXAMPLE_DATA_DATE_A,
      EXAMPLE_DATA_DATE_B,
    )
    setProjectName(EXAMPLE_PROJECT_NAME)
    setProjectNumber(EXAMPLE_PROJECT_NUMBER)
    applyResult(result, EXAMPLE_SCHEDULE_A, EXAMPLE_SCHEDULE_B, {
      earlyFile: 'example-schedule-1.xlsx',
      lateFile:  'example-schedule-2.xlsx',
      earlyDate: EXAMPLE_DATA_DATE_A,
      lateDate:  EXAMPLE_DATA_DATE_B,
    })
  }

  const formatDate = (str) => {
    if (!str) return ''
    const d = new Date(str)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const TABS = [
    { key: 'Instructions', label: 'Instructions', always: true },
    { key: 'Analysis',     label: 'Analysis',     always: true },
    { key: 'Results',      label: 'Results',       always: false },
    { key: 'Schedule Data', label: 'Schedule Data', always: false },
    { key: 'Example',      label: 'Example Project', always: true },
  ]

  const handleDateEdit = (newEarlyStr, newLateStr) => {
  const newEarly = new Date(newEarlyStr)
  const newLate  = new Date(newLateStr)
  if (isNaN(newEarly) || isNaN(newLate)) return
  if (newEarly >= newLate) return

  const swap = newEarly > newLate // always false here but kept for clarity

  // Determine if we need to swap based on original assignment
  const earlyFirst = newEarlyStr <= newLateStr

  const [early, late, eFile, lFile, eDate, lDate] = earlyFirst
    ? [schedules.early, schedules.late, scheduleInfo.earlyFile, scheduleInfo.lateFile, newEarlyStr, newLateStr]
    : [schedules.late, schedules.early, scheduleInfo.lateFile, scheduleInfo.earlyFile, newLateStr, newEarlyStr]

  try {
    const result = calcBowWave(early, late, eDate, lDate)
    setBowWaveResult(result)
    setSchedules({ early, late })
    setScheduleInfo({
      earlyFile: eFile,
      lateFile:  lFile,
      earlyDate: eDate,
      lateDate:  lDate,
    })
  } catch (err) {
    // Invalid window — silently ignore, leave results intact
  }
}

  const openDateModal = () => {
    setEditEarlyDate(scheduleInfo.earlyDate?.toString().slice(0, 10) ?? '')
    setEditLateDate(scheduleInfo.lateDate?.toString().slice(0, 10)  ?? '')
    setEditEarlyFile(scheduleInfo.earlyFile)
    setEditLateFile(scheduleInfo.lateFile)
    setEditingDates(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      <Header
        projectName={projectName}
        projectNumber={projectNumber}
        onProjectNameChange={setProjectName}
        onProjectNumberChange={setProjectNumber}
        hasAnalysis={hasAnalysis}
        onSave={handleSave}
        onNewProject={handleNewProject}
      />

      {/* Confirm New Project */}
      {confirmingNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h2 className="text-white font-bold text-lg">Start New Project?</h2>
            <p className="text-gray-400 text-sm">All unsaved analysis data will be cleared. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={confirmNew}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                Yes, Start New
              </button>
              <button onClick={() => setConfirmingNew(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Overwrite */}
      {confirmingOverwrite && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h2 className="text-white font-bold text-lg">Replace Current Results?</h2>
            <p className="text-gray-400 text-sm">Running a new analysis will replace your current results. Any unsaved data will be lost.</p>
            <div className="flex gap-3">
              <button onClick={confirmOverwrite}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                Yes, Replace
              </button>
              <button onClick={() => { setConfirmingOverwrite(false); setPendingResult(null) }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Data Dates Modal */}
      {editingDates && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6">
            <h2 className="text-white font-bold text-lg">Edit Data Dates</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Schedule 1 — {editEarlyFile}
                </label>
                <input
                  type="date"
                  value={editEarlyDate}
                  onChange={e => setEditEarlyDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
                    focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    const tmpDate = editEarlyDate
                    const tmpFile = editEarlyFile
                    setEditEarlyDate(editLateDate)
                    setEditEarlyFile(editLateFile)
                    setEditLateDate(tmpDate)
                    setEditLateFile(tmpFile)
                  }}
                  className="text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700
                    border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ⇄ Swap Schedules
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Schedule 2 — {editLateFile}
                </label>
                <input
                  type="date"
                  value={editLateDate}
                  onChange={e => setEditLateDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
                    focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              {editEarlyDate && editLateDate && editEarlyDate >= editLateDate && (
                <p className="text-red-400 text-xs">Schedule 1 date must be earlier than Schedule 2 date.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                disabled={!editEarlyDate || !editLateDate || editEarlyDate >= editLateDate}
                onClick={() => {
                  const earlyActivities = editEarlyFile === scheduleInfo.earlyFile ? schedules.early : schedules.late
                  const lateActivities  = editEarlyFile === scheduleInfo.earlyFile ? schedules.late  : schedules.early
                  try {
                    const result = calcBowWave(earlyActivities, lateActivities, editEarlyDate, editLateDate)
                    setBowWaveResult(result)
                    setSchedules({ early: earlyActivities, late: lateActivities })
                    setScheduleInfo({
                      earlyFile: editEarlyFile,
                      lateFile:  editLateFile,
                      earlyDate: editEarlyDate,
                      lateDate:  editLateDate,
                    })
                  } catch (err) {}
                  setEditingDates(false)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg text-sm
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Reanalyze
              </button>
              <button
                onClick={() => setEditingDates(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">

          {/* Tab Bar */}
          <div className="flex gap-2 border-b border-gray-800">
            {TABS.filter(t => t.always || hasAnalysis).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${activeTab === tab.key
                    ? 'border-blue-500 text-white'
                    : tab.key === 'Example'
                      ? 'border-transparent text-gray-500 hover:text-green-400'
                      : 'border-transparent text-gray-400 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Instructions */}
          {activeTab === 'Instructions' && <Instructions />}

          {/* Example */}
          {activeTab === 'Example' && (
            <div className="flex flex-col gap-4 max-w-sm">
              <p className="text-gray-400 text-sm">
                Load a pre-built example project to explore the tool without uploading real schedule files.
              </p>
              <button
                onClick={loadExample}
                className="bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                ⚡ Load Example Project
              </button>
            </div>
          )}

          {/* Analysis */}
          {activeTab === 'Analysis' && (
            <div className="flex flex-col gap-6">

              {/* Load Existing Project */}
              <div className="max-w-3xl bg-gray-900 rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">Load Existing Project</p>
                  <p className="text-gray-400 text-xs mt-0.5">Restore a previously saved .bwt project file</p>
                </div>
                <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white
                  text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  Browse...
                  <input type="file" accept=".bwt" onChange={handleLoad} className="hidden" />
                </label>
              </div>

              <div className="max-w-3xl flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-600 text-xs">or start a new project below</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              <ProjectInfo
                projectName={projectName}
                projectNumber={projectNumber}
                onProjectNameChange={setProjectName}
                onProjectNumberChange={setProjectNumber}
              />
              {hasProject ? (
                <FileUpload onResult={handleResult} />
              ) : (
                <p className="text-gray-500 text-sm">Enter a project name and number above to begin.</p>
              )}

            </div>
          )}

          {/* Results */}
          {activeTab === 'Results' && hasAnalysis && (
            <div className="flex flex-col gap-8">

              {scheduleInfo && (
                <div className="bg-gray-900 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Schedule 1 (Earlier)</p>
                    <p className="text-white text-sm font-medium">{scheduleInfo.earlyFile}</p>
                    <p className="text-gray-400 text-xs">Data Date: {formatDate(scheduleInfo.earlyDate)}</p>
                  </div>
                  <div className="text-gray-600 text-xl">→</div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Schedule 2 (Later)</p>
                    <p className="text-white text-sm font-medium">{scheduleInfo.lateFile}</p>
                    <p className="text-gray-400 text-xs">Data Date: {formatDate(scheduleInfo.lateDate)}</p>
                  </div>
                  <button
                    onClick={openDateModal}
                    className="ml-auto text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700
                      border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit Data Dates
                  </button>
                </div>
              )}

              {/* Filter bar */}
              {rawSchedules && filterConfig.length > 0 && (
                <FilterBar
                  rawSchedules={rawSchedules}
                  filterConfig={filterConfig}
                  onApply={(newConfig) => {
                    const applyFilterConfig = (activities, fc) => {
                      if (!fc.length) return activities
                      return activities.filter(a =>
                        fc.every(f => f.selectedValues.includes(String(a[f.column] ?? '')))
                      )
                    }
                    const filteredEarly = applyFilterConfig(rawSchedules.early, newConfig)
                    const filteredLate  = applyFilterConfig(rawSchedules.late,  newConfig)
                    try {
                      const result = calcBowWave(
                        filteredEarly, filteredLate,
                        scheduleInfo.earlyDate, scheduleInfo.lateDate
                      )
                      setBowWaveResult(result)
                      setSchedules({ early: filteredEarly, late: filteredLate })
                      setFilterConfig(newConfig)
                    } catch (err) {}
                  }}
                />
              )}

              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Redistribution Scenario</p>
                <ScenarioTabs
                  bowWaveResult={bowWaveResult}
                  onScenarioChange={setScenarioConfig}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Workload Chart</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">Base schedule:</p>
                    <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
                      {[
                        { key: 'A', label: 'Schedule 1' },
                        { key: 'B', label: 'Schedule 2' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setBaseSchedule(opt.key)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                            ${baseSchedule === opt.key
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
                      {['hrs', 'days'].map(u => (
                        <button
                          key={u}
                          onClick={() => setUnit(u)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                            ${unit === u ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-stretch">
                  <div className="flex-1 min-w-0">
                    <BowWaveChart
                      chartData={chartData}
                      bowWaveResult={bowWaveResult}
                      unit={unit}
                      baseSchedule={baseSchedule}
                    />
                  </div>
                  <div className="w-64 shrink-0 flex flex-col gap-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Summary</p>
                    <KpiCards
                      result={bowWaveResult}
                      unit={unit}
                      onUnitChange={setUnit}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
          {/* Schedule Data */}
          {activeTab === 'Schedule Data' && hasAnalysis && (
            <ScheduleData schedules={schedules} scheduleInfo={scheduleInfo} />
          )}

        </div>
      </main>

    </div>
  )
}