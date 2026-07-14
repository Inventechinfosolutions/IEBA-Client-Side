/** Focus the first editable TS Program field in the personal time-entry form. */
export function focusFirstTsProgramField() {
  const root = document.querySelector("[data-time-entries-form]")
  if (!root) return false

  const candidates = Array.from(
    root.querySelectorAll<HTMLInputElement>("[data-pts-program]"),
  )
  const input = candidates.find((el) => !el.disabled) ?? null
  if (!input) return false

  input.focus()
  input.scrollIntoView({ block: "nearest", behavior: "smooth" })
  return true
}

/** Retry focus after React remounts the form (`key={dateStr}`) — no useEffect. */
export function focusFirstTsProgramFieldSoon(maxFrames = 48) {
  let frames = 0
  const tryFocus = () => {
    if (focusFirstTsProgramField()) return
    frames += 1
    if (frames < maxFrames) requestAnimationFrame(tryFocus)
  }
  requestAnimationFrame(tryFocus)
}

/**
 * Park keyboard focus on a non-interactive sink after Submit.
 * Prevents the browser from moving focus to header / sidebar / "+" when controls disable.
 */
export function parkPersonalTimeStudyFocus() {
  const sink = document.querySelector("[data-pts-focus-sink]") as HTMLElement | null
  if (sink) {
    sink.focus({ preventScroll: true })
    return true
  }
  ;(document.activeElement as HTMLElement | null)?.blur()
  return false
}

/** Re-park across dialog close + mutation loading/refetch paints (still no useEffect). */
export function parkPersonalTimeStudyFocusSoon() {
  parkPersonalTimeStudyFocus()
  requestAnimationFrame(() => parkPersonalTimeStudyFocus())
  for (const ms of [0, 50, 150, 300, 600]) {
    window.setTimeout(() => parkPersonalTimeStudyFocus(), ms)
  }
}
