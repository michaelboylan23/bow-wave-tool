/* global __APP_VERSION__ */
import { useEffect, useState } from 'react'

const REPO = 'michaelboylan23/bow-wave-tool'

function parseVersion(v) {
  return v.replace(/^v/, '').split('.').map(Number)
}

function isNewer(latest, current) {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true
    if ((a[i] || 0) < (b[i] || 0)) return false
  }
  return false
}

export default function VersionBanner() {
  const appVersion = __APP_VERSION__
  const [status, setStatus]               = useState('checking') // checking | up-to-date | outdated | error
  const [latestVersion, setLatestVersion] = useState('')
  const [downloadUrl, setDownloadUrl]     = useState('')
  const [visible, setVisible]             = useState(true)

  useEffect(() => {
    let timer
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then(r => r.json())
      .then(data => {
        const tag = data.tag_name
        if (!tag) { setStatus('error'); return }
        setLatestVersion(tag.replace(/^v/, ''))
        setDownloadUrl(data.html_url)
        if (isNewer(tag, appVersion)) {
          setStatus('outdated')
        } else {
          setStatus('up-to-date')
          timer = setTimeout(() => setVisible(false), 5000)
        }
      })
      .catch(() => setStatus('error'))
    return () => clearTimeout(timer)
  }, [appVersion])

  if (!visible || status === 'checking' || status === 'error') return null

  if (status === 'up-to-date') {
    return (
      <div className="bg-green-900/30 border-b border-green-800/40 px-8 py-1.5 flex items-center justify-between">
        <span className="text-green-400 text-xs">
          ✓ You are on the latest version (v{appVersion})
        </span>
        <button
          onClick={() => setVisible(false)}
          className="text-green-700 hover:text-green-400 text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="bg-amber-900/30 border-b border-amber-700/40 px-8 py-2 flex items-center justify-between gap-4">
      <span className="text-amber-300 text-xs">
        A new version is available — <strong>v{latestVersion}</strong>. You are on v{appVersion}.
      </span>
      <div className="flex items-center gap-3 shrink-0">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium px-3 py-1 rounded-lg transition-colors"
        >
          Download Latest
        </a>
        <button
          onClick={() => setVisible(false)}
          className="text-amber-700 hover:text-amber-400 text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
