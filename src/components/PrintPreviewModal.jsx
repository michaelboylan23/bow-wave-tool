import { useRef, useEffect } from 'react'

export default function PrintPreviewModal({ sourceRef, metaLines = [], filename = 'chart', onClose }) {
  const previewRef = useRef(null)

  useEffect(() => {
    if (!sourceRef?.current || !previewRef.current) return
    // Clone the chart content into the preview container
    const clone = sourceRef.current.cloneNode(true)
    // Remove interactive elements from the clone
    clone.querySelectorAll('button, input, select, .print\\:hidden').forEach(el => el.remove())
    previewRef.current.innerHTML = ''
    previewRef.current.appendChild(clone)
  }, [sourceRef])

  const handlePrint = () => {
    const s = getComputedStyle(document.documentElement)
    const bg   = s.getPropertyValue('--bg').trim()   || '#111827'
    const card = s.getPropertyValue('--card').trim() || '#111827'
    const line = s.getPropertyValue('--line').trim() || '#374151'
    const fg3  = s.getPropertyValue('--fg-3').trim() || '#9ca3af'

    const target = previewRef.current
    if (!target) return

    // Add metadata header
    const meta = document.createElement('div')
    meta.style.cssText = [
      'padding: 8px 0 10px',
      'font-family: ui-sans-serif, system-ui, sans-serif',
      'font-size: 11px',
      `color: ${fg3}`,
      'display: flex',
      'align-items: center',
      'gap: 16px',
      `border-bottom: 1px solid ${line}`,
      'margin-bottom: 8px',
    ].join(';')

    const existingLogo = document.querySelector('img[alt="Logo"]')
    if (existingLogo?.src) {
      const img = document.createElement('img')
      img.src = existingLogo.src
      img.style.cssText = 'height: 32px; width: auto; object-fit: contain; flex-shrink: 0;'
      meta.appendChild(img)
    }

    const metaText = document.createElement('div')
    metaText.style.cssText = 'display: flex; flex-wrap: wrap; gap: 16px;'
    metaLines.forEach(l => {
      const span = document.createElement('span')
      span.textContent = l
      metaText.appendChild(span)
    })
    meta.appendChild(metaText)
    target.prepend(meta)
    target.classList.add('--print-target')

    const prevTitle = document.title
    document.title = filename

    const style = document.createElement('style')
    style.textContent = `
      @media print {
        @page { size: landscape; margin: 0; }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background: ${bg} !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body * { visibility: hidden !important; }
        .--print-target {
          visibility: visible !important;
          position: fixed !important;
          top: 1.2cm !important;
          bottom: 1.2cm !important;
          left: 2.2cm !important;
          right: 2.2cm !important;
          padding: 0 1cm !important;
          background: ${card} !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }
        .--print-target * { visibility: visible !important; }
        .--print-target svg {
          overflow: visible !important;
          max-width: 100% !important;
          height: auto !important;
        }
      }
    `
    document.head.appendChild(style)
    window.print()

    document.title = prevTitle
    document.head.removeChild(style)
    target.classList.remove('--print-target')
    target.removeChild(meta)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-line shrink-0">
        <h2 className="text-fg font-semibold text-sm">Print Preview</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-accent hover:bg-blue-500 text-fg text-xs font-semibold rounded-lg transition-colors"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-control hover:bg-muted text-fg-2 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Preview area — landscape aspect ratio */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-8">
        <div className="bg-card rounded-xl shadow-2xl border border-line"
          style={{ width: '1100px', minHeight: '750px', aspectRatio: '11 / 8.5' }}
        >
          <div ref={previewRef} className="p-8" />
        </div>
      </div>
    </div>
  )
}
