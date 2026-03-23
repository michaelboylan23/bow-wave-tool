import { useTheme } from '../contexts/ThemeContext'

function Section({ title, children }) {
  return (
    <div className="bg-card rounded-xl p-6 flex flex-col gap-5">
      <h3 className="text-sm font-semibold text-fg-2 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm text-fg">{label}</p>
        {hint && <p className="text-xs text-fg-4 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-control rounded-lg p-1">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
            ${value === o.value ? 'bg-accent text-white' : 'text-fg-3 hover:text-fg'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function ConfigureTab() {
  const {
    theme, setTheme,
    accent, setAccent,
    accentB, setAccentB,
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    resetDefaults,
  } = useTheme()

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      <Section title="Appearance">
        <Row label="Theme" hint="Switches between dark and light colour palette">
          <SegmentedControl
            options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
            value={theme}
            onChange={setTheme}
          />
        </Row>

        <Row label="Accent colour" hint="Used for active tabs, buttons, and highlights">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accent}
              onChange={e => setAccent(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-line bg-transparent"
            />
            <span className="text-xs text-fg-3 font-mono">{accent}</span>
          </div>
        </Row>

        <Row label="Bow wave colour" hint="Used for bow wave bars, reference lines, and scenario tabs">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentB}
              onChange={e => setAccentB(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-line bg-transparent"
            />
            <span className="text-xs text-fg-3 font-mono">{accentB}</span>
          </div>
        </Row>
      </Section>

      <Section title="Typography">
        <Row label="Font size" hint="Scales all text proportionally">
          <SegmentedControl
            options={[
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
              { value: 'lg', label: 'Large' },
            ]}
            value={fontSize}
            onChange={setFontSize}
          />
        </Row>

        <Row label="Font family">
          <select
            value={fontFamily}
            onChange={e => setFontFamily(e.target.value)}
            className="bg-control border border-line rounded-lg px-3 py-1.5 text-sm text-fg
              focus:outline-none focus:border-accent transition-colors"
          >
            <option value="system">System Default</option>
            <option value="inter">Inter</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
          </select>
        </Row>
      </Section>

      <div className="flex justify-start">
        <button
          onClick={resetDefaults}
          className="px-4 py-2 rounded-lg bg-control hover:bg-muted border border-line
            text-fg-3 hover:text-fg text-sm transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

    </div>
  )
}
