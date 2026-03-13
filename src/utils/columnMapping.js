export const REQUIRED_FIELDS = [
  { key: 'task_code',            label: 'Activity ID' },
  { key: 'task_name',            label: 'Activity Name' },
  { key: 'start_date',           label: 'Start Date' },
  { key: 'end_date',             label: 'Finish Date' },
  { key: 'target_drtn_hr_cnt',   label: 'Original Duration (h)' },
  { key: 'remain_drtn_hr_cnt',   label: 'Remaining Duration (h)' },
  { key: 'complete_pct',         label: 'Activity % Complete' },
  { key: 'status_code',          label: 'Activity Status' },
  { key: 'task_type',            label: 'Activity Type' },
]

// Known XER / P6 column aliases for each required field
const ALIASES = {
  task_code:            ['task_code'],
  task_name:            ['task_name'],
  start_date:           ['start_date'],
  end_date:             ['end_date'],
  target_drtn_hr_cnt:   ['target_drtn_hr_cnt'],
  remain_drtn_hr_cnt:   ['remain_drtn_hr_cnt'],
  complete_pct:         ['complete_pct', 'phys_complete_pct'],
  status_code:          ['status_code'],
  task_type:            ['task_type'],
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function autoMatch(headers) {
  const mapping = {}

  for (const field of REQUIRED_FIELDS) {
    const normKey   = normalize(field.key)
    const normLabel = normalize(field.label)
    const aliases   = ALIASES[field.key] || []

    // 1. Exact match on field key
    let match = headers.find(h => h === field.key)

    // 2. Case-insensitive match on field key
    if (!match) match = headers.find(h => h.toLowerCase() === field.key.toLowerCase())

    // 3. Normalized match on field key or label
    if (!match) match = headers.find(h => normalize(h) === normKey || normalize(h) === normLabel)

    // 4. Alias match
    if (!match) match = headers.find(h => aliases.includes(h.toLowerCase()))

    mapping[field.key] = match || null
  }

  return mapping
}

export function isMappingComplete(mapping) {
  return REQUIRED_FIELDS.every(f => mapping[f.key] !== null && mapping[f.key] !== undefined)
}