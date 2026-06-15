/**
 * form-change-guard.ts
 *
 * Reusable utility to detect whether a form has any actual changes before save.
 *
 * Two use-cases it covers:
 *  1. Add/Create form submitted empty (nothing typed) → "No changes to save"
 *  2. Edit form saved without modifying anything after API data loaded → "No changes to save"
 *
 * Usage in any save handler (one line):
 *   if (guardNoChanges(getValues(), serverData ?? defaultValues)) return
 */

import { toast } from "sonner"


/**
 * Deep-equal comparison that handles plain objects, arrays, and primitives.
 * Does NOT handle class instances, Dates, Maps, Sets, etc. — all form values
 * in this project are plain JSON-serialisable objects so this is sufficient.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  // null / undefined already handled by reference equality above
  if (a === null || b === null) return false
  if (a === undefined || b === undefined) return false

  if (typeof a !== typeof b) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>

    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)

    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }

  // primitives — string, number, boolean
  return a === b
}


/**
 * Checks whether the current form values differ from the reference snapshot.
 *
 * @param currentValues  - What `getValues()` returns right now.
 * @param referenceValues - The snapshot to compare against:
 *                          • Edit mode  → the object returned by the API (e.g. `serverData`)
 *                          • Create mode → the form's empty default values
 * @returns `true` if something changed, `false` if nothing changed.
 */
export function hasFormChanged<T>(currentValues: T, referenceValues: T): boolean {
  return !deepEqual(currentValues, referenceValues)
}

// ---------------------------------------------------------------------------

export type GuardNoChangesOptions = {
  /** Custom toast message. Defaults to "No changes to save". */
  message?: string
}

/**
 * Guards a save handler from firing when there are no actual changes.
 *
 * Internally does a deep equality check between `currentValues` and
 * `referenceValues`. If they are identical it shows a warning toast and
 * returns `true` (meaning "blocked — do not proceed").
 *
 * @param currentValues   - What `getValues()` returns right now.
 * @param referenceValues - Snapshot to compare against (API data or defaults).
 * @param options         - Optional: custom toast message.
 * @returns `true`  → save is blocked (no changes detected).
 *          `false` → changes detected, save should proceed normally.
 *
 * @example
 * // In any save/submit handler — one line, no inline logic:
 * if (guardNoChanges(getValues(), serverData ?? TODO_EMPTY_DEFAULTS)) return
 */
export function guardNoChanges<T>(
  currentValues: T,
  referenceValues: T,
  options?: GuardNoChangesOptions,
): boolean {
  if (hasFormChanged(currentValues, referenceValues)) {
    // Changes found — let the save proceed
    return false
  }

  // No changes — block the save and notify the user
  toast.warning(options?.message ?? "No changes to save", {
    position: "top-center",
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  })

  return true
}

// ---------------------------------------------------------------------------

/**
 * Returns an object containing only the fields that differ between
 * `currentValues` and `referenceValues`.
 *
 * Each field is compared with the same deep-equal logic used by the guard,
 * so nested objects and arrays are handled correctly.
 *
 * @example
 * // User only changed status — only { status: "completed" } is sent to the API
 * const patch = getChangedFields(formValues, originalValues)
 * // → { status: "completed" }
 */
export function getChangedFields<T extends Record<string, unknown>>(
  currentValues: T,
  referenceValues: T,
): Partial<T> {
  const changed: Partial<T> = {}
  for (const key of Object.keys(currentValues) as (keyof T)[]) {
    if (!deepEqual(currentValues[key], referenceValues[key])) {
      changed[key] = currentValues[key]
    }
  }
  return changed
}
