import * as XLSX from 'xlsx'

function addSheet(wb, sheetName, columns, headers, data) {
  const headerRow = columns.map(c => headers[c] || c)
  const rows = data.map(d => columns.map(c => d[c] ?? ''))
  const wsData = [headerRow, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = columns.map((_, i) => ({
    wch: Math.max(
      headerRow[i].length,
      ...rows.map(r => String(r[i] ?? '').length)
    ) + 2,
  }))
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
}

function addInfoSheet(wb, { metaLines = [], filterConfig = [], groupByColumn = null }) {
  if (!metaLines.length && !filterConfig.length && !groupByColumn) return
  const rows = []
  metaLines.forEach(line => rows.push([line]))
  if (groupByColumn) rows.push([`Group by: ${groupByColumn}`])
  if (filterConfig.length > 0) {
    rows.push([])
    rows.push(['Active Filters'])
    filterConfig.forEach(f => {
      rows.push([`${f.column}: ${f.selectedValues.join(', ')}`])
    })
  }
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Info')
}

/**
 * Export chart data to an XLSX file with multiple sheets.
 */
export function exportXlsx(data, {
  filename = 'chart-data',
  columns,
  headers = {},
  metaLines = [],
  filterConfig = [],
  groupByColumn = null,
} = {}) {
  const wb = XLSX.utils.book_new()
  const cols = columns || (data.length > 0 ? Object.keys(data[0]) : [])
  addSheet(wb, 'Chart Data', cols, headers, data)
  addInfoSheet(wb, { metaLines, filterConfig, groupByColumn })
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── Bow Wave XLSX (all units on separate sheets) ────────────────────────────

function bowWaveSheetConfig(data, unit, categoryChartData) {
  const isCount = unit === 'act_finish' || unit === 'act_start'
  const cats = categoryChartData?.categories

  if (cats) {
    const columns = ['month']
    const headers = { month: 'Month' }

    for (const cat of cats) {
      if (isCount) {
        const countKey = unit === 'act_finish' ? 'finishing' : 'starting'
        const colKey = `cat__${cat}__${countKey}`
        columns.push(colKey)
        headers[colKey] = `${cat} (${unit === 'act_finish' ? 'Finishing' : 'Starting'})`
        const bwKey = `cat__${cat}__bwcount`
        columns.push(bwKey)
        headers[bwKey] = `${cat} (Bow Wave)`
      } else {
        columns.push(`cat__${cat}`)
        headers[`cat__${cat}`] = `${cat} (${unit === 'hrs' ? 'Hours' : 'Days'})`
        columns.push(`cat__${cat}__bw`)
        headers[`cat__${cat}__bw`] = `${cat} (Bow Wave)`
      }
    }

    if (isCount) {
      columns.push('bowWaveCount')
      headers.bowWaveCount = 'Total Bow Wave (Activities)'
    } else {
      columns.push('bowWave')
      headers.bowWave = `Total Bow Wave (${unit === 'hrs' ? 'Hours' : 'Days'})`
    }

    return { columns, headers }
  }

  // Non-grouped
  if (isCount) {
    const countKey = unit === 'act_finish' ? 'finishing' : 'starting'
    return {
      columns: ['month', countKey, 'bowWaveCount'],
      headers: {
        month: 'Month',
        [countKey]: unit === 'act_finish' ? 'Activities Finishing' : 'Activities Starting',
        bowWaveCount: 'Bow Wave (Activities)',
      },
    }
  }

  return {
    columns: ['month', 'planned', 'bowWave'],
    headers: {
      month: 'Month',
      planned: `Planned (${unit === 'hrs' ? 'Hours' : 'Days'})`,
      bowWave: `Bow Wave (${unit === 'hrs' ? 'Hours' : 'Days'})`,
    },
  }
}

function convertBowWaveData(data, unit) {
  if (unit === 'days') {
    return data.map(d => ({
      ...d,
      planned: Math.round((d.planned || 0) / 8 * 10) / 10,
      bowWave: Math.round((d.bowWave || 0) / 8 * 10) / 10,
    }))
  }
  return data
}

export function exportBowWaveAllSheets(activeData, {
  filename,
  categoryChartData,
  metaLines = [],
  filterConfig = [],
  groupByColumn = null,
}) {
  const wb = XLSX.utils.book_new()

  const units = [
    { key: 'hrs', label: 'Hours' },
    { key: 'days', label: 'Days' },
    { key: 'act_finish', label: 'Finishing' },
    { key: 'act_start', label: 'Starting' },
  ]

  for (const u of units) {
    const converted = convertBowWaveData(activeData, u.key)
    const { columns, headers } = bowWaveSheetConfig(converted, u.key, categoryChartData)
    addSheet(wb, u.label, columns, headers, converted)
  }

  addInfoSheet(wb, { metaLines, filterConfig, groupByColumn })
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── Multi-Schedule XLSX (all units on separate sheets) ──────────────────────

function multiScheduleSheetData(multiSeriesData, unit) {
  const isCount = unit === 'act_finish' || unit === 'act_start'
  const columns = ['month']
  const headers = { month: 'Month' }
  const unitLabel = unit === 'hrs' ? 'Hours' : unit === 'days' ? 'Days'
    : unit === 'act_finish' ? 'Finishing' : 'Starting'

  for (const s of multiSeriesData.series) {
    const key = `series__${s.id}`
    columns.push(key)
    headers[key] = `${s.fileName} (${unitLabel})`
  }

  const data = multiSeriesData.monthLabels.map(month => {
    const row = { month }
    for (const s of multiSeriesData.series) {
      if (isCount) {
        const countMap = unit === 'act_finish' ? s.finishingByMonth : s.startingByMonth
        row[`series__${s.id}`] = countMap?.[month] || 0
      } else {
        const val = s.dataByMonth[month] || 0
        row[`series__${s.id}`] = unit === 'hrs' ? val : Math.round(val / 8 * 10) / 10
      }
    }
    return row
  })

  return { data, columns, headers }
}

export function exportMultiScheduleAllSheets(multiSeriesData, {
  filename,
  metaLines = [],
  filterConfig = [],
  groupByColumn = null,
}) {
  const wb = XLSX.utils.book_new()

  const units = [
    { key: 'hrs', label: 'Hours' },
    { key: 'days', label: 'Days' },
    { key: 'act_finish', label: 'Finishing' },
    { key: 'act_start', label: 'Starting' },
  ]

  for (const u of units) {
    const { data, columns, headers } = multiScheduleSheetData(multiSeriesData, u.key)
    addSheet(wb, u.label, columns, headers, data)
  }

  addInfoSheet(wb, { metaLines, filterConfig, groupByColumn })
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── S-Curve XLSX ────────────────────────────────────────────────────────────

export function sCurveXlsxConfig(sCurveData, { unit }) {
  const columns = ['month']
  const headers = { month: 'Month' }
  const unitLabel = unit === 'hrs' ? 'Hours' : 'Days'

  for (const s of sCurveData.series) {
    const key = `series__${s.id}`
    columns.push(key)
    headers[key] = `${s.fileName} — Cumulative (${unitLabel})`
  }

  const data = sCurveData.monthLabels.map(month => {
    const row = { month }
    for (const s of sCurveData.series) {
      const val = s.cumByMonth[month] || 0
      row[`series__${s.id}`] = unit === 'hrs' ? val : Math.round(val / 8 * 10) / 10
    }
    return row
  })

  return { data, columns, headers }
}

// ── Magnitude XLSX ──────────────────────────────────────────────────────────

export function magnitudeXlsxConfig(magnitudeData, { unit }) {
  const unitLabel = unit === 'hrs' ? 'Hours' : 'Days'
  const data = magnitudeData.map(d => ({
    label: d.label,
    fileName: d.fileName,
    dataDate: d.dataDate,
    inFlight: unit === 'hrs' ? d.inFlightHrs : Math.round(d.inFlightHrs / 8 * 10) / 10,
  }))

  return {
    data,
    columns: ['label', 'fileName', 'dataDate', 'inFlight'],
    headers: {
      label: 'Data Date',
      fileName: 'Schedule',
      dataDate: 'Data Date (ISO)',
      inFlight: `In-Flight Work (${unitLabel})`,
    },
  }
}
