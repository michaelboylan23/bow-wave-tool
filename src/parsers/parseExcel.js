import * as XLSX from 'xlsx'
import { applyMapping } from '../utils/applyMapping'

export function parseExcel(file, mapping) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false })
        const trimmed = rows.map(row =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => [k.trim(), v]))
        )
        resolve(applyMapping(trimmed, mapping))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}