import { useState } from 'react'

const PAT     = import.meta.env.VITE_AZDO_PAT
const ORG     = import.meta.env.VITE_AZDO_ORG
const PROJECT = import.meta.env.VITE_AZDO_PROJECT

export default function BugReportModal({ onClose }) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [contact,     setContact]     = useState('')
  const [status,      setStatus]      = useState('idle') // idle | submitting | success | error

  const canSubmit = title.trim().length > 0 && status === 'idle'

  const handleSubmit = async () => {
    if (!canSubmit) return
    setStatus('submitting')

    const body = [
      description.trim() ? `### Description\n${description.trim()}` : null,
      contact.trim()     ? `### Submitted by\n${contact.trim()}`     : null,
      `---\n*Submitted from Bow Wave Analysis app*`,
    ].filter(Boolean).join('\n\n')

    try {
      const res = await fetch(
        `https://dev.azure.com/${ORG}/${encodeURIComponent(PROJECT)}/_apis/wit/workitems/$Issue?api-version=7.1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(':' + PAT)}`,
            'Content-Type': 'application/json-patch+json',
          },
          body: JSON.stringify([
            { op: 'add', path: '/fields/System.Title', value: title.trim() },
            { op: 'add', path: '/fields/System.Description', value: body.replace(/\n/g, '<br>') },
          ]),
        }
      )
      if (!res.ok) throw new Error()
      setStatus('success')
      setTimeout(onClose, 2500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-card border border-line rounded-2xl p-8 max-w-md w-full mx-4 flex flex-col gap-5">

        <div className="flex items-center justify-between">
          <h2 className="text-fg font-bold text-lg">Report a Bug</h2>
          <button onClick={onClose} className="text-fg-4 hover:text-fg transition-colors text-sm">✕</button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-green-400 text-3xl">✓</span>
            <p className="text-fg font-medium">Bug report submitted</p>
            <p className="text-fg-3 text-sm text-center">Thanks — it's been logged to Azure DevOps.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-fg-3 font-medium uppercase tracking-wide">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="bg-control border border-line rounded-lg px-3 py-2 text-fg text-sm
                  placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-fg-3 font-medium uppercase tracking-wide">
                Description & Steps to Reproduce
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What happened? How can it be reproduced?"
                rows={5}
                className="bg-control border border-line rounded-lg px-3 py-2 text-fg text-sm
                  placeholder-gray-600 focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-fg-3 font-medium uppercase tracking-wide">
                Your Name / Contact <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="So I know who to follow up with"
                className="bg-control border border-line rounded-lg px-3 py-2 text-fg text-sm
                  placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-400 text-xs">Something went wrong — please try again or contact Michael directly.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 bg-accent hover:bg-blue-500 text-fg font-semibold py-2 rounded-lg
                  text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? 'Submitting…' : 'Submit Report'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-control hover:bg-muted text-fg-2 font-semibold py-2
                  rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
