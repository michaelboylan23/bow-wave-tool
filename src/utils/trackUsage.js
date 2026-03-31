const PAT     = import.meta.env.VITE_AZDO_PAT
const ORG     = import.meta.env.VITE_AZDO_ORG
const PROJECT = import.meta.env.VITE_AZDO_PROJECT
const REPO    = 'Bow Wave Tool'
const FILE    = 'usage-log.txt'
const BRANCH  = 'main'

const headers = () => ({
  Authorization: `Basic ${btoa(':' + PAT)}`,
  'Content-Type': 'application/json',
})

const api = (path) =>
  `https://dev.azure.com/${ORG}/${encodeURIComponent(PROJECT)}/_apis/git/repositories/${encodeURIComponent(REPO)}${path}`

export async function trackOpen() {
  if (!PAT || !ORG || !PROJECT) return
  try {
    const username = window.electronAPI?.username ?? 'unknown'
    const timestamp = new Date().toISOString()
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown'
    const entry = `${timestamp} | ${username} | v${version}\n`

    // Get the latest commit on the branch (needed for the push)
    const refRes = await fetch(api(`/refs?filter=heads/${BRANCH}&api-version=7.1`), { headers: headers() })
    if (!refRes.ok) return
    const refData = await refRes.json()
    const oldObjectId = refData.value?.[0]?.objectId
    if (!oldObjectId) return

    // Try to get existing file content
    let existing = ''
    const fileRes = await fetch(api(`/items?path=${FILE}&api-version=7.1`), { headers: headers() })
    if (fileRes.ok) existing = await fileRes.text()

    const changeType = existing ? 'edit' : 'add'

    await fetch(api('/pushes?api-version=7.1'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        refUpdates: [{ name: `refs/heads/${BRANCH}`, oldObjectId }],
        commits: [{
          comment: 'Usage tracking update',
          changes: [{
            changeType,
            item: { path: `/${FILE}` },
            newContent: { content: existing + entry, contentType: 'rawtext' },
          }],
        }],
      }),
    })
  } catch {
    // Fail silently — never surface tracking errors to users
  }
}
