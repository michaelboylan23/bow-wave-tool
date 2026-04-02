const PAT        = import.meta.env.VITE_AZDO_PAT
const ORG        = import.meta.env.VITE_AZDO_ORG
const PROJECT    = import.meta.env.VITE_AZDO_PROJECT
const WORK_ITEM  = 3 // "Usage Tracking Log" work item

export async function trackOpen() {
  if (!PAT || !ORG || !PROJECT) return
  try {
    // Wait briefly for the main process fallback injection if preload didn't load
    if (!window.electronAPI) await new Promise(r => setTimeout(r, 500))
    const username = window.electronAPI?.username ?? 'unknown'
    const timestamp = new Date().toISOString()
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown'
    const entry = `${timestamp} | ${username} | v${version}`

    await fetch(
      `https://dev.azure.com/${ORG}/${encodeURIComponent(PROJECT)}/_apis/wit/workItems/${WORK_ITEM}/comments?api-version=7.1-preview.4`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(':' + PAT)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: entry }),
      }
    )
  } catch {
    // Fail silently — never surface tracking errors to users
  }
}
