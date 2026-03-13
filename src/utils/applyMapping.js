// Takes raw parsed rows and a confirmed column mapping,
// returns clean standardized activity objects
export function applyMapping(rows, mapping) {
  return rows
    .map(row => ({
      ...row,  
      task_code:          row[mapping.task_code]          ?? null,
      task_name:          row[mapping.task_name]          ?? null,
      start_date:         parseDate(row[mapping.start_date]),
      end_date:           parseDate(row[mapping.end_date]),
      target_drtn_hr_cnt: parseFloat(row[mapping.target_drtn_hr_cnt]) || 0,
      remain_drtn_hr_cnt: parseFloat(row[mapping.remain_drtn_hr_cnt]) || 0,
      complete_pct:       parseFloat(row[mapping.complete_pct])       || 0,
      status_code:        row[mapping.status_code]        ?? null,
      task_type:          row[mapping.task_type]          ?? null,
    }))
    .filter(row => row.task_code !== null && row.start_date !== null && row.end_date !== null)
}

// Attempt to parse a variety of date formats into a JS Date object
function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return isNaN(value) ? null : value

  // Handle Excel serial numbers (SheetJS returns these when raw: true)
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000))
    return isNaN(date) ? null : date
  }

  const str = String(value).trim()
  if (!str) return null

  // Try native parsing
  const d = new Date(str)
  if (!isNaN(d)) return d

  // Try MM/DD/YYYY
  const parts = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (parts) return new Date(`${parts[3]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`)

  return null
}