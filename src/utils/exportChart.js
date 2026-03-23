/**
 * Prints a single DOM element via the system print dialog.
 * Everything else on the page is hidden during printing.
 *
 * @param {HTMLElement} element   - The element to print
 * @param {string[]}    metaLines - Metadata strings shown at the top of the printout
 * @param {string}      filename  - Suggested document title (shown in print dialog / PDF filename)
 */
export function exportChart(element, metaLines = [], filename = 'chart') {
  // Prepend a metadata header with logo + info
  const meta = document.createElement('div')
  meta.style.cssText = [
    'padding: 8px 0 10px',
    'font-family: ui-sans-serif, system-ui, sans-serif',
    'font-size: 11px',
    'color: #9ca3af',
    'display: flex',
    'align-items: center',
    'gap: 16px',
    'border-bottom: 1px solid #374151',
    'margin-bottom: 8px',
  ].join(';')

  // Grab the already-loaded logo src from the DOM (resolves correctly in dev + Electron)
  const existingLogo = document.querySelector('img[alt="Logo"]')
  if (existingLogo?.src) {
    const img = document.createElement('img')
    img.src = existingLogo.src
    img.style.cssText = 'height: 32px; width: auto; object-fit: contain; flex-shrink: 0;'
    meta.appendChild(img)
  }

  const metaText = document.createElement('div')
  metaText.style.cssText = 'display: flex; flex-wrap: wrap; gap: 16px;'
  metaLines.forEach(line => {
    const span = document.createElement('span')
    span.textContent = line
    metaText.appendChild(span)
  })
  meta.appendChild(metaText)
  element.prepend(meta)
  element.classList.add('--print-target')

  const prevTitle = document.title
  document.title = filename

  // The visibility technique: hide everything, then reveal just the target.
  // Must use visibility (not display:none) so children can override it.
  const style = document.createElement('style')
  style.textContent = `
    @media print {
      @page { size: landscape; margin: 0; }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background: #111827 !important;
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
        background: #111827 !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      }
      .--print-target * { visibility: visible !important; }
      .--print-target svg { overflow: visible !important; }
    }
  `
  document.head.appendChild(style)

  window.print()

  // Cleanup after dialog closes
  document.title = prevTitle
  document.head.removeChild(style)
  element.classList.remove('--print-target')
  element.removeChild(meta)
}
