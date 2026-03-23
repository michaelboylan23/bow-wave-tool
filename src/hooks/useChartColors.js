import { useTheme } from '../contexts/ThemeContext'

/**
 * Returns theme-aware color strings for use in Recharts SVG props.
 * Subscribes to theme so charts re-render on theme change.
 */
export function useChartColors() {
  const { theme, accent, accentB } = useTheme() // eslint-disable-line no-unused-vars
  const s = getComputedStyle(document.documentElement)
  const get = (v) => s.getPropertyValue(v).trim()
  return {
    grid:    get('--line')         || '#374151',
    tick:    get('--fg-3')         || '#9ca3af',
    label:   get('--fg-3')         || '#9ca3af',
    card:    get('--card')         || '#111827',
    line:    get('--line')         || '#374151',
    accent:  get('--accent')       || '#2563eb',
    accentB: get('--accent-b')     || '#ea580c',
  }
}
