import { useEffect, useState } from "react"

export function useDebounce<T>(value: T): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, 500)
    return () => clearTimeout(timer)
  }, [value])
  return debouncedValue
}
