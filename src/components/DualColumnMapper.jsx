import { useState } from 'react'
import { REQUIRED_FIELDS, autoMatch, isMappingComplete } from '../utils/columnMapping'

function MappingColumn({ fileName, headers, mapping, onChange }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">File</p>
        <p className="text-white text-sm font-medium truncate">{fileName}</p>
      </div>
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-3 text-left text-gray-300 font-semibold text-xs">Required Field</th>
              <th className="px-4 py-3 text-left text-gray-300 font-semibold text-xs">Your Column</th>
              <th className="px-4 py-3 text-left text-gray-300 font-semibold text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {REQUIRED_FIELDS.map((field, i) => {
              const value = mapping[field.key]
              const isMatched = !!value
              return (
                <tr key={field.key} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium text-xs">{field.label}</p>
                    <p className="text-gray-500 font-mono text-xs">{field.key}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={value || ''}
                      onChange={e => onChange(field.key, e.target.value || null)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5
                        text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">— select —</option>
                      {[...headers].sort((a, b) => a.localeCompare(b)).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isMatched ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                        ✓ Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium">
                        ⚠ Needed
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DualColumnMapper({ fileNameA, headersA, fileNameB, headersB, onConfirm }) {
  const [mappingA, setMappingA] = useState(() => autoMatch(headersA))
  const [mappingB, setMappingB] = useState(() => autoMatch(headersB))

  const allMapped = isMappingComplete(mappingA) && isMappingComplete(mappingB)

  const handleChangeA = (key, value) => setMappingA(prev => ({ ...prev, [key]: value }))
  const handleChangeB = (key, value) => setMappingB(prev => ({ ...prev, [key]: value }))

  const unmappedA = REQUIRED_FIELDS.filter(f => !mappingA[f.key]).length
  const unmappedB = REQUIRED_FIELDS.filter(f => !mappingB[f.key]).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Map Columns</h2>
        <p className="text-gray-400 text-sm">
          Match each required field to the corresponding column in your files.
          Auto-matched fields are pre-filled — review before confirming.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        <MappingColumn
          fileName={fileNameA}
          headers={headersA}
          mapping={mappingA}
          onChange={handleChangeA}
        />
        <div className="w-px bg-gray-800 self-stretch shrink-0 mt-12" />
        <MappingColumn
          fileName={fileNameB}
          headers={headersB}
          mapping={mappingB}
          onChange={handleChangeB}
        />
      </div>

      {!allMapped && (
        <p className="text-yellow-400 text-xs">
          {[
            unmappedA > 0 && `${fileNameA}: ${unmappedA} field${unmappedA > 1 ? 's' : ''} still needed`,
            unmappedB > 0 && `${fileNameB}: ${unmappedB} field${unmappedB > 1 ? 's' : ''} still needed`,
          ].filter(Boolean).join(' · ')}
        </p>
      )}

      <button
        onClick={() => onConfirm(mappingA, mappingB)}
        disabled={!allMapped}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors
          ${allMapped
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
      >
        {allMapped ? 'Confirm Mapping & Continue' : 'Please map all required fields to continue'}
      </button>
    </div>
  )
}