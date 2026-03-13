// Returns the first day of a month for a given date
function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Returns the last day of a month for a given date
function monthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
}

// Format a date as "MMM YYYY" for chart labels
export function formatMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Calculate proportional hours of an activity that fall within a given month
function hoursInMonth(activity, mStart, mEnd) {
  const start = activity.start_date instanceof Date ? activity.start_date : new Date(activity.start_date)
  const end = activity.end_date instanceof Date ? activity.end_date : new Date(activity.end_date)
  if (!start || !end || isNaN(start) || isNaN(end)) return 0

  const overlapStart = Math.max(start.getTime(), mStart.getTime())
  const overlapEnd = Math.min(end.getTime(), mEnd.getTime())
  if (overlapEnd <= overlapStart) return 0

  const totalMs = end.getTime() - start.getTime()
  if (totalMs <= 0) return 0

  const overlapMs = overlapEnd - overlapStart
  return activity.target_drtn_hr_cnt * (overlapMs / totalMs)
}

// Generate all months between two dates inclusive
function generateMonths(start, end) {
  const months = []
  const current = monthStart(start)
  const last = monthStart(end)
  while (current <= last) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

// Distribute delta hours across a set of months evenly
function distributeEvenly(months, deltaHrs) {
  if (months.length === 0) return {}
  const perMonth = deltaHrs / months.length
  const result = {}
  for (const m of months) {
    result[formatMonthLabel(m)] = perMonth
  }
  return result
}

export function buildChartData(scheduleA, scheduleB, bowWaveResult, scenario, endDateOverride, recoveryDateOverride, baseSchedule = 'B') {
  const { windowStart, windowEnd, deltaHrs } = bowWaveResult

  // Find earliest start and latest finish across both schedules
  const allActivities = [...scheduleA, ...scheduleB]
  const allStarts = allActivities.map(a => a.start_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))
  const allEnds = allActivities.map(a => a.end_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))

  if (allStarts.length === 0 || allEnds.length === 0) return []

  const projectStart = new Date(Math.min(...allStarts))
  const projectEnd = endDateOverride ? new Date(endDateOverride) : new Date(Math.max(...allEnds))

  const months = generateMonths(projectStart, projectEnd)

  // Build planned hours per month from selected base schedule
  const baseActivities = baseSchedule === 'A' ? scheduleA : scheduleB
  const plannedByMonth = {}
  for (const m of months) {
    const mStart = monthStart(m)
    const mEnd = monthEnd(m)
    const label = formatMonthLabel(m)
    plannedByMonth[label] = baseActivities.reduce((sum, act) => sum + hoursInMonth(act, mStart, mEnd), 0)
  }

  // Determine bow wave distribution based on scenario
  const futuremonths = months.filter(m => monthStart(m) > monthStart(windowEnd))
  const lastMonth = months[months.length - 1]

  let bowWaveByMonth = {}

  if (scenario === 'front-load') {
    const firstFuture = futuremonths[0]
    if (firstFuture) bowWaveByMonth[formatMonthLabel(firstFuture)] = deltaHrs

  } else if (scenario === 'end-load') {
    bowWaveByMonth[formatMonthLabel(lastMonth)] = deltaHrs

  } else if (scenario === 'distribute-to-end') {
    bowWaveByMonth = distributeEvenly(futuremonths, deltaHrs)

  } else if (scenario === 'distribute-to-recovery') {
    const recoveryEnd = recoveryDateOverride ? new Date(recoveryDateOverride) : windowEnd
    const recoveryMonths = futuremonths.filter(m => monthStart(m) <= monthStart(recoveryEnd))
    bowWaveByMonth = distributeEvenly(recoveryMonths.length > 0 ? recoveryMonths : futuremonths, deltaHrs)
  }

  // Assemble final chart data array
  return months.map(m => {
    const label = formatMonthLabel(m)
    const mStart = monthStart(m)
    const isPast = mStart < windowStart
    const isWindow = mStart >= monthStart(windowStart) && mStart <= monthStart(windowEnd)

    return {
      month: label,
      planned: Math.round((plannedByMonth[label] || 0) * 10) / 10,
      bowWave: Math.round((bowWaveByMonth[label] || 0) * 10) / 10,
      isPast,
      isWindow,
    }
  })
}