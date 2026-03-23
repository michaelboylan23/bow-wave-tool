import { useState } from 'react'

const SCENARIOS = [
  { key: 'front-load',             label: 'Front-Load',              desc: 'All unfinished work added to the first month after the latest data date.' },
  { key: 'end-load',               label: 'End-Load',                desc: 'All unfinished work pushed to the last month of the schedule.' },
  { key: 'distribute-to-end',      label: 'Distribute to End',       desc: 'Unfinished work spread evenly across all remaining months. Adjust the project end date below.' },
  { key: 'distribute-to-recovery', label: 'Distribute to Recovery',  desc: 'Unfinished work spread evenly between the latest data date and a chosen recovery date.' },
]

export default function ScenarioTabs({ bowWaveResult, onScenarioChange, scenarioConfig }) {
  const [activeScenario, setActiveScenario]       = useState(scenarioConfig?.scenario       || 'front-load')
  const [endDateOverride, setEndDateOverride]      = useState(scenarioConfig?.endDateOverride || '')
  const [recoveryDate, setRecoveryDate]            = useState(scenarioConfig?.recoveryDate    || '')

  const handleScenarioChange = (key) => {
    setActiveScenario(key)
    onScenarioChange({ scenario: key, endDateOverride, recoveryDate })
  }

  const handleEndDateChange = (val) => {
    setEndDateOverride(val)
    onScenarioChange({ scenario: activeScenario, endDateOverride: val, recoveryDate })
  }

  const handleRecoveryDateChange = (val) => {
    setRecoveryDate(val)
    onScenarioChange({ scenario: activeScenario, endDateOverride, recoveryDate: val })
  }

  const active = SCENARIOS.find(s => s.key === activeScenario)

  return (
    <div className="flex flex-col gap-4">

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            onClick={() => handleScenarioChange(s.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeScenario === s.key
                ? 'bg-accent-b text-fg'
                : 'bg-control text-fg-3 hover:text-fg hover:bg-muted'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-fg-3">{active.desc}</p>

      {/* Distribute to End — end date slider */}
      {activeScenario === 'distribute-to-end' && (
        <div className="flex flex-col gap-1 max-w-xs">
          <label className="text-xs text-fg-3 font-medium">Adjusted Project End Date</label>
          <input
            type="date"
            value={endDateOverride}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="bg-card border border-line rounded-lg px-3 py-2 text-fg text-sm
              focus:outline-none focus:border-accent-b transition-colors"
          />
          {!endDateOverride && (
            <p className="text-xs text-fg-4">Defaulting to latest activity finish date.</p>
          )}
        </div>
      )}

      {/* Distribute to Recovery — recovery date picker */}
      {activeScenario === 'distribute-to-recovery' && (
        <div className="flex flex-col gap-1 max-w-xs">
          <label className="text-xs text-fg-3 font-medium">Recovery Date</label>
          <input
            type="date"
            value={recoveryDate}
            onChange={(e) => handleRecoveryDateChange(e.target.value)}
            className="bg-card border border-line rounded-lg px-3 py-2 text-fg text-sm
              focus:outline-none focus:border-accent-b transition-colors"
          />
          {!recoveryDate && (
            <p className="text-xs text-fg-4">Defaulting to latest data date if not set.</p>
          )}
        </div>
      )}

    </div>
  )
}