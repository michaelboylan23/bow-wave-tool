const TOKEN   = import.meta.env.VITE_GITHUB_TOKEN
const GIST_ID = import.meta.env.VITE_USAGE_GIST_ID
const FILE    = 'usage-log.txt'

export async function trackOpen() {
  if (!TOKEN || !GIST_ID) return
  try {
    const username = window.electronAPI?.username ?? 'unknown'
    const timestamp = new Date().toISOString()
    const entry = `${timestamp} | ${username}`

    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    if (!res.ok) return
    const gist = await res.json()
    const current = gist.files[FILE]?.content ?? ''

    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: { [FILE]: { content: current + entry + '\n' } } }),
    })
  } catch {
    // Fail silently — never surface tracking errors to users
  }
}
