import { applyMapping } from '../utils/applyMapping'

// Parse the full XER file into a tables object
function parseXerTables(text) {
  const lines = text.split('\n')
  const tables = {}
  let currentTable = null
  let currentFields = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line === '%E') continue

    if (line.startsWith('%T')) {
      currentTable = line.replace('%T', '').trim()
      tables[currentTable] = []
      currentFields = []
    } else if (line.startsWith('%F')) {
      currentFields = line.replace('%F', '').trim().split('\t').map(f => f.trim())
    } else if (line.startsWith('%R')) {
      const values = line.replace('%R', '').trim().split('\t')
      const row = {}
      currentFields.forEach((field, i) => {
        row[field] = values[i] !== undefined ? values[i].trim() : null
      })
      if (currentTable) tables[currentTable].push(row)
    }
  }

  return tables
}

// Extract the data date from the PROJECT table
export function extractXerDataDate(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const tables = parseXerTables(e.target.result)
        const projectRows = tables['PROJECT'] || []
        if (!projectRows.length) { resolve(null); return }

        const raw = projectRows[0]['last_recalc_date']
        if (!raw) { resolve(null); return }

        // Trim time component if present — "2024-01-15 07:00" → "2024-01-15"
        const dateStr = raw.trim().slice(0, 10)
        resolve(dateStr)
      } catch (err) {
        resolve(null) // Non-fatal — caller falls back to manual entry
      }
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file)
  })
}

export function parseXer(file, mapping) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const tables = parseXerTables(e.target.result)
        const taskRows = tables['TASK'] || []
        if (taskRows.length === 0) {
          reject(new Error('No TASK table found in XER file'))
          return
        }

        // Read day_hr_cnt from the default or first calendar to normalize durations.
        // P6 stores durations in raw hours in XER but divides by day_hr_cnt in Excel exports.
        const calendarRows = tables['CALENDAR'] || []
        const defaultCal = calendarRows.find(c => c.default_flag === 'Y') || calendarRows[0]
        const dayHrCnt = defaultCal ? (parseFloat(defaultCal.day_hr_cnt) || 8) : 8
        
        // Build activity code lookup maps
        const actvTypeMap = {}  // actv_code_type_id → actv_code_type name
        for (const row of (tables['ACTVTYPE'] || [])) {
          actvTypeMap[row.actv_code_type_id] = row.actv_code_type
        }

        const actvCodeMap = {}  // actv_code_id → short_name
        for (const row of (tables['ACTVCODE'] || [])) {
          actvCodeMap[row.actv_code_id] = row.short_name
        }

        // Build task → activity codes map: task_id → { typeName: codeValue }
        const taskActvMap = {}  // task_id → { col: val }
        for (const row of (tables['TASKACTV'] || [])) {
          const typeName = actvTypeMap[row.actv_code_type_id]
          const codeVal  = actvCodeMap[row.actv_code_id]
          if (!typeName || !codeVal) continue
          if (!taskActvMap[row.task_id]) taskActvMap[row.task_id] = {}
          taskActvMap[row.task_id][typeName] = codeVal
        }

        // Join activity codes onto task rows
        const taskRowsWithCodes = taskRows.map(row => ({
          ...row,
          ...(taskActvMap[row.task_id] || {}),
        }))

        // Normalize durations to match Excel export (divide raw hours by day_hr_cnt)
        const normalizedRows = taskRowsWithCodes.map(row => ({
          ...row,
          target_drtn_hr_cnt: row.target_drtn_hr_cnt
            ? String(parseFloat(row.target_drtn_hr_cnt) / dayHrCnt)
            : row.target_drtn_hr_cnt,
          remain_drtn_hr_cnt: row.remain_drtn_hr_cnt
            ? String(parseFloat(row.remain_drtn_hr_cnt) / dayHrCnt)
            : row.remain_drtn_hr_cnt,
        }))

        // Synthesize start_date and end_date based on activity status
        // so the mapping always has a reliable date regardless of status
        const enriched = normalizedRows.map(row => {
          const status = (row.status_code || '').trim()
          let start, end

          if (status === 'TK_Complete') {
            // Completed — use actual dates
            start = row.act_start_date  || row.early_start_date  || row.target_start_date
            end   = row.act_end_date    || row.early_end_date    || row.target_end_date
          } else if (status === 'TK_Active') {
            // In progress — started but not finished
            start = row.act_start_date  || row.early_start_date  || row.target_start_date
            end   = row.early_end_date  || row.target_end_date
          } else {
            // Not started (TK_NotStart) or anything else
            start = row.early_start_date || row.target_start_date
            end   = row.early_end_date   || row.target_end_date
          }

          return { ...row, start_date: start || null, end_date: end || null }
        })

        resolve(applyMapping(enriched, mapping))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}