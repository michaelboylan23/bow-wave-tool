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

// Private helper — compute bow wave distribution by month given scenario config
function computeBowWaveByMonth(months, windowEnd, deltaHrs, scenario, recoveryDateOverride) {
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

  return bowWaveByMonth
}

// Build multi-schedule trend data.
// schedules: [{ id, fileName, dataDate, filteredRows }] — sorted by dataDate ascending inside this fn.
// baselineId: optional id of the schedule to mark as baseline.
// groupByColumn: optional column name; when provided, each series includes dataByCategory.
// Returns { monthLabels, series: [{ id, fileName, dataDate, isLatest, isBaseline, dataByMonth, categories, dataByCategory }], allCategories }
export function buildMultiSeriesData(schedules, baselineId = null, groupByColumn = null) {
  if (!schedules || schedules.length === 0) return { monthLabels: [], series: [], allCategories: [] }

  const sorted = [...schedules].sort((a, b) => new Date(a.dataDate) - new Date(b.dataDate))

  const allActivities = sorted.flatMap(s => s.filteredRows || [])
  const allStarts = allActivities.map(a => a.start_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))
  const allEnds   = allActivities.map(a => a.end_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))

  if (!allStarts.length || !allEnds.length) return { monthLabels: [], series: [], allCategories: [] }

  const projectStart = new Date(Math.min(...allStarts))
  const projectEnd   = new Date(Math.max(...allEnds))
  const months       = generateMonths(projectStart, projectEnd)
  const monthLabels  = months.map(formatMonthLabel)

  const series = sorted.map((s, i) => {
    const dd        = new Date(s.dataDate)
    // Remaining work = activities whose end_date is after this schedule's data date
    const remaining = (s.filteredRows || []).filter(a => {
      const end = a.end_date instanceof Date ? a.end_date : new Date(a.end_date)
      return !isNaN(end) && end > dd
    })

    const dataByMonth = {}
    for (const m of months) {
      const mStart = monthStart(m)
      const mEnd   = monthEnd(m)
      const label  = formatMonthLabel(m)
      dataByMonth[label] = Math.round(
        remaining.reduce((sum, act) => sum + hoursInMonth(act, mStart, mEnd), 0) * 10
      ) / 10
    }

    // Per-category remaining work — only computed when groupByColumn is provided
    let dataByCategory = null
    let categories = []
    if (groupByColumn) {
      categories = [...new Set(
        remaining.map(a => String(a[groupByColumn] ?? '')).filter(Boolean)
      )].sort()
      dataByCategory = {}
      for (const cat of categories) {
        dataByCategory[cat] = {}
        const catActs = remaining.filter(a => String(a[groupByColumn] ?? '') === cat)
        for (const m of months) {
          const label = formatMonthLabel(m)
          dataByCategory[cat][label] = Math.round(
            catActs.reduce((sum, act) => sum + hoursInMonth(act, monthStart(m), monthEnd(m)), 0) * 10
          ) / 10
        }
      }
    }

    return {
      id:            s.id,
      fileName:      s.fileName,
      dataDate:      s.dataDate,
      isLatest:      i === sorted.length - 1,
      isBaseline:    s.id === baselineId,
      dataByMonth,
      categories,
      dataByCategory,
    }
  })

  const allCategories = groupByColumn
    ? [...new Set(series.flatMap(s => s.categories))].sort()
    : []

  return { monthLabels, series, allCategories }
}

// Build in-flight work trend — one data point per schedule.
// "In-flight" = activities where start_date <= dataDate AND end_date > dataDate.
// A growing number indicates work is accumulating faster than it's being completed.
// Returns [{ id, fileName, dataDate, label, inFlightHrs }] sorted by dataDate.
export function buildBowWaveMagnitudeData(schedules) {
  if (!schedules || schedules.length === 0) return []

  const sorted = [...schedules].sort((a, b) => new Date(a.dataDate) - new Date(b.dataDate))

  return sorted.map(s => {
    const dd = new Date(s.dataDate)
    const inFlightHrs = (s.filteredRows || []).reduce((sum, act) => {
      const start = act.start_date instanceof Date ? act.start_date : new Date(act.start_date)
      const end   = act.end_date   instanceof Date ? act.end_date   : new Date(act.end_date)
      if (isNaN(start) || isNaN(end)) return sum
      if (start <= dd && end > dd) return sum + (act.target_drtn_hr_cnt || 0)
      return sum
    }, 0)

    return {
      id:          s.id,
      fileName:    s.fileName,
      dataDate:    s.dataDate,
      label:       new Date(s.dataDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
      inFlightHrs: Math.round(inFlightHrs * 10) / 10,
    }
  })
}

// Build S-Curve (cumulative planned hours) for all schedules.
// Uses ALL activities (not filtered by dataDate) so the full planned scope is shown.
// Month range is the global union across all schedules so lines are aligned.
// Returns { monthLabels: string[], series: [{ id, fileName, dataDate, isLatest, cumByMonth }] }
export function buildSCurveData(schedules) {
  if (!schedules || schedules.length === 0) return { monthLabels: [], series: [] }

  const sorted = [...schedules].sort((a, b) => new Date(a.dataDate) - new Date(b.dataDate))

  const allActivities = sorted.flatMap(s => s.filteredRows || [])
  const allStarts = allActivities.map(a => a.start_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))
  const allEnds   = allActivities.map(a => a.end_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))

  if (!allStarts.length || !allEnds.length) return { monthLabels: [], series: [] }

  const projectStart = new Date(Math.min(...allStarts))
  const projectEnd   = new Date(Math.max(...allEnds))
  const months       = generateMonths(projectStart, projectEnd)
  const monthLabels  = months.map(formatMonthLabel)

  const series = sorted.map((s, i) => {
    let running = 0
    const cumByMonth = {}
    for (const m of months) {
      const mStart = monthStart(m)
      const mEnd   = monthEnd(m)
      const label  = formatMonthLabel(m)
      const hrs    = (s.filteredRows || []).reduce((sum, act) => sum + hoursInMonth(act, mStart, mEnd), 0)
      running += hrs
      cumByMonth[label] = Math.round(running * 10) / 10
    }

    return {
      id:        s.id,
      fileName:  s.fileName,
      dataDate:  s.dataDate,
      isLatest:  i === sorted.length - 1,
      cumByMonth,
    }
  })

  return { monthLabels, series }
}

// Build chart data split by a category column (for the two-schedule Bow Wave chart).
// Category keys in rows are namespaced as `cat__${value}` to avoid conflicts.
// Returns { categories: string[], chartData: [{ month, cat__X, ..., bowWave, isPast, isWindow }] }
export function buildChartDataByCategory(scheduleA, scheduleB, bowWaveResult, scenario, endDateOverride, recoveryDateOverride, baseSchedule, groupByColumn) {
  if (!groupByColumn) return null

  const { windowStart, windowEnd, deltaHrs } = bowWaveResult

  const allActivities = [...scheduleA, ...scheduleB]
  const allStarts = allActivities.map(a => a.start_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))
  const allEnds   = allActivities.map(a => a.end_date).filter(Boolean).map(d => new Date(d)).filter(d => !isNaN(d))

  if (!allStarts.length || !allEnds.length) return null

  const projectStart = new Date(Math.min(...allStarts))
  const projectEnd   = endDateOverride ? new Date(endDateOverride) : new Date(Math.max(...allEnds))
  const months       = generateMonths(projectStart, projectEnd)

  const baseActivities = baseSchedule === 'A' ? scheduleA : scheduleB

  // Get distinct categories from base schedule, sorted
  const categories = [...new Set(
    baseActivities.map(a => String(a[groupByColumn] ?? '')).filter(Boolean)
  )].sort()

  // Build per-category hours per month
  const catByMonth = {}
  for (const cat of categories) {
    catByMonth[cat] = {}
    const catActivities = baseActivities.filter(a => String(a[groupByColumn] ?? '') === cat)
    for (const m of months) {
      const label = formatMonthLabel(m)
      catByMonth[cat][label] = catActivities.reduce(
        (sum, act) => sum + hoursInMonth(act, monthStart(m), monthEnd(m)), 0
      )
    }
  }

  const bowWaveByMonth = computeBowWaveByMonth(months, windowEnd, deltaHrs, scenario, recoveryDateOverride)

  const chartData = months.map(m => {
    const label  = formatMonthLabel(m)
    const mStart = monthStart(m)
    const isPast    = mStart < windowStart
    const isWindow  = mStart >= monthStart(windowStart) && mStart <= monthStart(windowEnd)

    const row = { month: label, isPast, isWindow }

    const totalPlanned = categories.reduce((sum, cat) => sum + (catByMonth[cat][label] || 0), 0)
    const bwTotal = bowWaveByMonth[label] || 0

    for (const cat of categories) {
      const planned = catByMonth[cat][label] || 0
      row[`cat__${cat}`] = Math.round(planned * 10) / 10
      // Proportional share of this month's bow wave for this category
      const bwShare = totalPlanned > 0 ? bwTotal * (planned / totalPlanned) : 0
      row[`cat__${cat}__bw`] = Math.round(bwShare * 10) / 10
    }

    row.bowWave = Math.round(bwTotal * 10) / 10
    return row
  })

  return { categories, chartData }
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

  const bowWaveByMonth = computeBowWaveByMonth(months, windowEnd, deltaHrs, scenario, recoveryDateOverride)

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
