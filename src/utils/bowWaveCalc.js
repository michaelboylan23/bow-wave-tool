// Convert a date value to a JS Date object
function toDate(val) {
  if (!val) return null
  if (val instanceof Date) return val
  const d = new Date(val)
  return isNaN(d) ? null : d
}

// Convert milliseconds to days
function msToDays(ms) {
  return ms / (1000 * 60 * 60 * 24)
}

// Calculate the proportional overlap of an activity within a window
function calcOverlapProportion(start, end, windowStart, windowEnd) {
  const s = Math.max(start.getTime(), windowStart.getTime())
  const e = Math.min(end.getTime(), windowEnd.getTime())
  if (e <= s) return 0

  const overlapDays = msToDays(e - s)
  const totalDays   = msToDays(end.getTime() - start.getTime())
  if (totalDays <= 0) return 0

  return overlapDays / totalDays
}

// Returns activities from a schedule that overlap the window,
// with their proportional planned and actual hours
function getWindowActivities(activities, windowStart, windowEnd) {
  const result = []

  for (const act of activities) {
    const start = toDate(act.start_date)
    const end   = toDate(act.end_date)
    if (!start || !end) continue

    const proportion = calcOverlapProportion(start, end, windowStart, windowEnd)
    if (proportion <= 0) continue

    const plannedHrs = act.target_drtn_hr_cnt * proportion
    const actualHrs  = act.target_drtn_hr_cnt * (act.complete_pct / 100) * proportion

    result.push({
      ...act,
      proportion,
      plannedHrs,
      actualHrs,
    })
  }

  return result
}

// Main calculation — takes two parsed schedules and their data dates,
// returns the bow wave summary
export function calcBowWave(scheduleA, scheduleB, dateA, dateB) {
  const windowStart = toDate(dateA)
  const windowEnd   = toDate(dateB)

  if (!windowStart || !windowEnd) {
    throw new Error('Invalid data dates')
  }

  if (windowStart >= windowEnd) {
    throw new Error('Data Date A must be earlier than Data Date B')
  }

  // Planned hours from Schedule A within the window
  const windowActivitiesA = getWindowActivities(scheduleA, windowStart, windowEnd)
  const plannedHrs = windowActivitiesA.reduce((sum, a) => sum + a.plannedHrs, 0)

  // Actual completed hours from Schedule B within the window
  const windowActivitiesB = getWindowActivities(scheduleB, windowStart, windowEnd)
  const actualHrs = windowActivitiesB.reduce((sum, a) => sum + a.actualHrs, 0)

  // Delta = the bow wave
  const deltaHrs = plannedHrs - actualHrs

  return {
    windowStart,
    windowEnd,
    plannedHrs:        Math.round(plannedHrs * 100) / 100,
    actualHrs:         Math.round(actualHrs * 100) / 100,
    deltaHrs:          Math.round(deltaHrs * 100) / 100,
    deltaWorkDays:     Math.round((deltaHrs / 8) * 100) / 100,
    plannedWorkDays:   Math.round((plannedHrs / 8) * 100) / 100,
    actualWorkDays:    Math.round((actualHrs / 8) * 100) / 100,
    completionPct:     plannedHrs > 0 ? Math.round((actualHrs / plannedHrs) * 10000) / 100 : 0,
    windowActivitiesA,
    windowActivitiesB,
  }
}