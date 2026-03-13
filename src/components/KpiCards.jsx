const fmt = (val, unit) => {
  const num = unit === 'hrs' ? val : val / 8
  return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

const unitLabel = (unit) => unit === 'hrs' ? 'hrs' : 'days'

function Card({ title, value, sub, color }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 flex flex-col gap-1">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-sm text-gray-400">{sub}</p>}
    </div>
  )
}

export default function KpiCards({ result, unit, onUnitChange }) {
  const { plannedHrs, actualHrs, deltaHrs, completionPct, windowStart, windowEnd } = result

  const dateLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex flex-col gap-3 h-full">
      <Card
        title="Planned"
        value={`${fmt(plannedHrs, unit)} ${unitLabel(unit)}`}
        sub="Scheduled in window"
        color="text-blue-400"
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
        color="text-orange-400"
      />
      <Card
        title="Completion"
        value={`${completionPct.toFixed(2)}%`}
        sub="Of planned work done"
        color={completionPct >= 80 ? 'text-green-400' : completionPct >= 50 ? 'text-yellow-400' : 'text-red-400'}
      />
    </div>
  )
}