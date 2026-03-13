import { useState } from 'react'

const SCENARIOS = [
  { key: 'front-load',             label: 'Front-Load',              desc: 'All unfinished work added to the first month after the latest data date.' },
  { key: 'end-load',               label: 'End-Load',                desc: 'All unfinished work pushed to the last month of the schedule.' },
  { key: 'distribute-to-end',      label: 'Distribute to End',       desc: 'Unfinished work spread evenly across all remaining months. Adjust the project end date below.' },
  { key: 'distribute-to-recovery', label: 'Distribute to Recovery',  desc: 'Unfinished work spread evenly between the latest data date and a chosen recovery date.' },
]

export default function ScenarioTabs({ bowWaveResult, onScenarioChange }) {
  const [activeScenario, setActiveScenario]       = useState('front-load')
  const [endDateOverride, setEndDateOverride]      = useState('')
  const [recoveryDate, setRecoveryDate]            = useState('')

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
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400">{active.desc}</p>

      {/* Distribute to End — end date slider */}
      {activeScenario === 'distribute-to-end' && (
        <div className="flex flex-col gap-1 max-w-xs">
          <label className="text-xs text-gray-400 font-medium">Adjusted Project End Date</label>
          <input
            type="date"
            value={endDateOverride}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
              focus:outline-none focus:border-orange-500 transition-colors"
          />
          {!endDateOverride && (
            <p className="text-xs text-gray-500">Defaulting to latest activity finish date.</p>
          )}
        </div>
      )}

      {/* Distribute to Recovery — recovery date picker */}
      {activeScenario === 'distribute-to-recovery' && (
        <div className="flex flex-col gap-1 max-w-xs">
          <label className="text-xs text-gray-400 font-medium">Recovery Date</label>
          <input
            type="date"
            value={recoveryDate}
            onChange={(e) => handleRecoveryDateChange(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
              focus:outline-none focus:border-orange-500 transition-colors"
          />
          {!recoveryDate && (
            <p className="text-xs text-gray-500">Defaulting to latest data date if not set.</p>
          )}
        </div>
      )}

    </div>
  )
}