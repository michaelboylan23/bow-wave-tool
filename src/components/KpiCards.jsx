const fmt = (val, unit) => {
  if (unit === 'act_finish' || unit === 'act_start') return Math.round(val).toLocaleString('en-US')
  const num = unit === 'hrs' ? val : val / 8
  return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const unitLabel = (unit) =>
  unit === 'hrs' ? 'hrs' : unit === 'days' ? 'days' : 'activities'

function Card({ title, value, sub, color }) {
  return (
    <div className="bg-control rounded-xl p-5 flex flex-col gap-1">
      <p className="text-xs text-fg-3 font-medium uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold ${color || 'text-fg'}`}>{value}</p>
      {sub && <p className="text-sm text-fg-3">{sub}</p>}
    </div>
  )
}

export default function KpiCards({ result, unit, onUnitChange }) {
  const { plannedHrs, actualHrs, deltaHrs, completionPct } = result
  const isCount = unit === 'act_finish' || unit === 'act_start'

  if (isCount) {
    // In count mode, derive activity counts from the hours-based ratio
    const incompleteFraction = plannedHrs > 0 ? deltaHrs / plannedHrs : 0
    const windowActivities = result.windowActivitiesA?.length || 0
    const slippedCount = Math.round(windowActivities * incompleteFraction)
    const completedCount = windowActivities - slippedCount

    return (
      <>
        <Card
          title="Activities in Window"
          value={`${windowActivities}`}
          sub={unit === 'act_finish' ? 'Planned to finish' : 'Planned to start'}
          color="text-accent"
        />
        <Card
          title="On Track"
          value={`${completedCount}`}
          sub="Completed as planned"
          color="text-green-400"
        />
        <Card
          title="Bow Wave (Slipped)"
          value={`${slippedCount}`}
          sub={`${(100 - completionPct).toFixed(1)}% incomplete`}
          color="text-accent-b"
        />
        <Card
          title="Completion"
          value={`${completionPct.toFixed(1)}%`}
          sub="Of planned work done"
          color={completionPct >= 80 ? 'text-green-400' : completionPct >= 50 ? 'text-yellow-400' : 'text-red-400'}
        />
      </>
    )
  }

  return (
    <>
      <Card
        title="Planned"
        value={`${fmt(plannedHrs, unit)} ${unitLabel(unit)}`}
        sub="Scheduled in window"
        color="text-accent"
      />
      <Card
        title="Actual Completed"
        value={`${fmt(actualHrs, unit)} ${unitLabel(unit)}`}
        sub="Completed in window"
        color="text-green-400"
      />
      <Card
        title="Bow Wave (Delta)"
        value={`${fmt(deltaHrs, unit)} ${unitLabel(unit)}`}
        sub={`${(100 - completionPct).toFixed(2)}% incomplete`}
        color="text-accent-b"
      />
      <Card
        title="Completion"
        value={`${completionPct.toFixed(2)}%`}
        sub="Of planned work done"
        color={completionPct >= 80 ? 'text-green-400' : completionPct >= 50 ? 'text-yellow-400' : 'text-red-400'}
      />
    </>
  )
}
