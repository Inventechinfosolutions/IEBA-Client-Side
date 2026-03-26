export type TimeSelectionUIProps = {
  value: string
  onValueChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  /** Keep this at 120px to match existing Country UI */
  inputWidthClassName?: string
  /** Keep this at 155px to match existing dropdown UI */
  dropdownWidthClassName?: string
}
