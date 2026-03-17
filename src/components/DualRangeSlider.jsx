import { useRef } from 'react'

// DualRangeSlider — a single track with two draggable thumbs.
// Props:
//   min, max       — integer indices into a labels array
//   start, end     — current values
//   onStartChange, onEndChange — callbacks
//   startLabel, endLabel       — text shown at left / right ends
export default function DualRangeSlider({ min, max, start, end, onStartChange, onEndChange, startLabel, endLabel }) {
  const range    = max - min || 1
  const startPct = ((start - min) / range) * 100
  const endPct   = ((end   - min) / range) * 100

  // Which input sits on top is determined by cursor proximity to each thumb.
  // We store a ref for the track container to measure cursor X against it.
  const trackRef = useRef(null)
  const startOnTop = useRef(false)

  const handlePointerMove = (e) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const cursorPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100
    // Midpoint between the two thumbs
    const mid = (startPct + endPct) / 2
    startOnTop.current = cursorPct < mid
    // Apply z-index directly to avoid re-render on every mouse move
    const [startEl, endEl] = trackRef.current.querySelectorAll('input[type="range"]')
    if (startEl && endEl) {
      startEl.style.zIndex = startOnTop.current ? 5 : 3
      endEl.style.zIndex   = startOnTop.current ? 3 : 5
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Track + thumbs */}
      <div
        ref={trackRef}
        className="relative flex items-center h-5 w-full select-none"
        onPointerMove={handlePointerMove}
      >
        {/* Grey base track */}
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-gray-700" />

        {/* Blue active range */}
        <div
          className="absolute h-1.5 rounded-full bg-blue-500 pointer-events-none"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />

        {/* Start range input */}
        <input
          type="range"
          min={min} max={max} value={start}
          onChange={e => { const v = +e.target.value; if (v <= end) onStartChange(v) }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 3 }}
        />

        {/* End range input */}
        <input
          type="range"
          min={min} max={max} value={end}
          onChange={e => { const v = +e.target.value; if (v >= start) onEndChange(v) }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />

        {/* Visual start thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-blue-500 shadow-md ring-2 ring-gray-900 pointer-events-none"
          style={{ left: `calc(${startPct}% - 8px)`, zIndex: 6 }}
        />

        {/* Visual end thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-blue-500 shadow-md ring-2 ring-gray-900 pointer-events-none"
          style={{ left: `calc(${endPct}% - 8px)`, zIndex: 6 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  )
}
