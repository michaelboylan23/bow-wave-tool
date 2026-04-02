/**
 * Prints a single DOM element via the system print dialog.
 * Uses CSS transform to scale the chart content for A3 landscape.
 *
 * @param {HTMLElement} element   - The element to print
 * @param {string[]}    metaLines - Metadata strings shown at the top of the printout
 * @param {string}      filename  - Suggested document title (shown in print dialog / PDF filename)
 */
export function exportChart(element, metaLines = [], filename = 'chart') {
  const s = getComputedStyle(document.documentElement)
  const bg   = s.getPropertyValue('--bg').trim()   || '#111827'
  const card = s.getPropertyValue('--card').trim() || '#111827'
  const line = s.getPropertyValue('--line').trim() || '#374151'
  const fg3  = s.getPropertyValue('--fg-3').trim() || '#9ca3af'

  // Prepend metadata header
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
  element.prepend(meta)
  element.classList.add('--print-target')

  const prevTitle = document.title
  document.title = filename

  const style = document.createElement('style')
  style.textContent = `
    @media print {
      @page { size: A3 landscape; margin: 0; }
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
        top: 1cm !important;
        left: 1cm !important;
        width: 29.5cm !important;
        height: 20.5cm !important;
        padding: 0 1.5cm !important;
        background: ${card} !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        transform: scale(1.35) !important;
        transform-origin: top left !important;
      }
      .--print-target .grid {
        gap: 0.5rem !important;
        max-width: 85% !important;
      }
      .--print-target * { visibility: visible !important; }
      .--print-target svg {
        overflow: visible !important;
      }
    }
  `
  document.head.appendChild(style)

  window.print()

  // Cleanup
  document.title = prevTitle
  document.head.removeChild(style)
  element.classList.remove('--print-target')
  element.removeChild(meta)
}
