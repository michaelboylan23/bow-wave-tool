import { parseCsv } from './parseCsv'
import { parseExcel } from './parseExcel'
import { parseXer } from './parseXer'

export function parseFile(file, mapping) {
  const ext = file.name.split('.').pop().toLowerCase()

  switch (ext) {
    case 'csv':
      return parseCsv(file, mapping)
    case 'xlsx':
    case 'xls':
      return parseExcel(file, mapping)
    case 'xer':
      return parseXer(file, mapping)
    default:
      return Promise.reject(new Error(`Unsupported file type: .${ext}`))
  }
}