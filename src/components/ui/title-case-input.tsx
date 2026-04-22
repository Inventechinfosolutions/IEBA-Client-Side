import * as React from "react"
import { Input } from "@/components/ui/input"
import { toTitleCase } from "@/lib/utils"

/** A drop-in replacement for `<Input>` that automatically capitalises the
 * first letter of every word as the user types.*/
const TitleCaseInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return <Input ref={ref} onChange={handleChange} {...props} />
})

TitleCaseInput.displayName = "TitleCaseInput"

export { TitleCaseInput }
