import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const FONT_FAMILIES = {
  system:  'ui-sans-serif, system-ui, sans-serif',
  inter:   '"Inter", ui-sans-serif, system-ui, sans-serif',
  mono:    'ui-monospace, "Cascadia Code", "Fira Mono", monospace',
  serif:   'ui-serif, Georgia, Cambria, serif',
}

const FONT_SIZES = { sm: '13px', md: '15px', lg: '17px' }

function load(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

export function ThemeProvider({ children }) {
  const [theme,      setThemeState]  = useState(() => load('bw-theme', 'dark'))
  const [accent,     setAccentState] = useState(() => load('bw-accent', '#2563eb'))
  const [accentB,    setAccentBState]= useState(() => load('bw-accent-b', '#ea580c'))
  const [fontSize,   setFontSizeState]  = useState(() => load('bw-fs', 'md'))
  const [fontFamily, setFontFamilyState]= useState(() => load('bw-ff', 'system'))

  // Apply theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('bw-theme', theme)
  }, [theme])

  // Apply accent colors
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
    localStorage.setItem('bw-accent', accent)
  }, [accent])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-b', accentB)
    localStorage.setItem('bw-accent-b', accentB)
  }, [accentB])

  // Apply font size
  useEffect(() => {
    document.documentElement.style.setProperty('--fs-base', FONT_SIZES[fontSize] || '15px')
    localStorage.setItem('bw-fs', fontSize)
  }, [fontSize])

  // Apply font family
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', FONT_FAMILIES[fontFamily] || FONT_FAMILIES.system)
    localStorage.setItem('bw-ff', fontFamily)
  }, [fontFamily])

  const resetDefaults = () => {
    setThemeState('dark')
    setAccentState('#2563eb')
    setAccentBState('#ea580c')
    setFontSizeState('md')
    setFontFamilyState('system')
    // Clear inline overrides so CSS vars from :root take over
    ;['--accent', '--accent-b', '--fs-base', '--font-family'].forEach(v =>
      document.documentElement.style.removeProperty(v)
    )
    ;['bw-theme','bw-accent','bw-accent-b','bw-fs','bw-ff'].forEach(k =>
      localStorage.removeItem(k)
    )
  }

  return (
    <ThemeContext.Provider value={{
      theme,      setTheme: setThemeState,
      accent,     setAccent: setAccentState,
      accentB,    setAccentB: setAccentBState,
      fontSize,   setFontSize: setFontSizeState,
      fontFamily, setFontFamily: setFontFamilyState,
      fontFamilies: FONT_FAMILIES,
      fontSizes: FONT_SIZES,
      resetDefaults,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
