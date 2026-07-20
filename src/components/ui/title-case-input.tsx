import * as React from "react"
import { Input } from "@/components/ui/input"
import { toTitleCase } from "@/lib/utils"

const SKIP_TITLE_CASE_TYPES = new Set([
  "date",
  "datetime-local",
  "month",
  "time",
  "week",
  "number",
  "range",
  "color",
  "checkbox",
  "radio",
  "file",
  "hidden",
  "password",
])

/** A drop-in replacement for `<Input>` that automatically capitalises the
 * first letter of every word as the user types.*/
const TitleCaseInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ onChange, type, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Date/month/etc. must pass through unchanged — title-casing can corrupt values
    // while the user edits segments (e.g. changing the month in a date picker).
    if (type && SKIP_TITLE_CASE_TYPES.has(type)) {
      onChange?.(e)
      return
    }

    const input = e.target
    const raw = input.value
    const titleCased = toTitleCase(raw)

    // Only mutate if something actually changed to avoid infinite loops
    if (titleCased !== raw) {
      // Preserve cursor position
      const selectionStart = input.selectionStart ?? raw.length
      const selectionEnd = input.selectionEnd ?? raw.length

      // Use native setter to bypass React's synthetic event deduplication
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, titleCased)
        input.dispatchEvent(new Event("input", { bubbles: true }))
      }

      // Restore cursor position
      requestAnimationFrame(() => {
        input.setSelectionRange(selectionStart, selectionEnd)
      })

      // Emit a synthetic event carrying the title-cased value
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: titleCased },
      } as React.ChangeEvent<HTMLInputElement>

      onChange?.(syntheticEvent)
    } else {
      onChange?.(e)
    }
  }

  return <Input ref={ref} type={type} onChange={handleChange} {...props} />
})

TitleCaseInput.displayName = "TitleCaseInput"

export { TitleCaseInput }
