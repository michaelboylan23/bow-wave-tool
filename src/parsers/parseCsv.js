import Papa from 'papaparse'
import { applyMapping } from '../utils/applyMapping'

export function parseCsv(file, mapping) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => resolve(applyMapping(results.data, mapping)),
      error: (err) => reject(err),
    })
  })
}