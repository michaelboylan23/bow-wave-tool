import { useState } from 'react'
import { REQUIRED_FIELDS, autoMatch, isMappingComplete } from '../utils/columnMapping'

export default function ColumnMapper({ fileName, headers, onConfirm }) {
  const [mapping, setMapping] = useState(() => autoMatch(headers))

  const allMapped = isMappingComplete(mapping)

  const handleChange = (fieldKey, value) => {
    setMapping(prev => ({ ...prev, [fieldKey]: value }))
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-1">Map Columns</h2>
      <p className="text-gray-400 text-sm mb-1">
        File: <span className="text-white font-medium">{fileName}</span>
      </p>
      <p className="text-gray-400 text-sm mb-6">
        Match each required field to the corresponding column in your file.
        Auto-matched fields are pre-filled — review them before confirming.
      </p>

      <div className="bg-gray-900 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-3 text-left text-gray-300 font-semibold">Required Field</th>
              <th className="px-4 py-3 text-left text-gray-300 font-semibold">Your Column</th>
              <th className="px-4 py-3 text-left text-gray-300 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {REQUIRED_FIELDS.map((field, i) => {
              const value = mapping[field.key]
              const isMatched = !!value
              return (
                <tr key={field.key} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{field.label}</p>
                    <p className="text-gray-500 font-mono text-xs">{field.key}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={value || ''}
                      onChange={(e) => handleChange(field.key, e.target.value || null)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                        text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">— select a column —</option>
                      {[...headers].sort((a, b) => a.localeCompare(b)).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {isMatched ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                        <span>✓</span> Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-400 text-xs font-medium">
                        <span>⚠</span> Needs input
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onConfirm(mapping)}
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