import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"

import { apiPostViewReport } from "../api"
import type { ReportRunPayload } from "../types"

async function viewReport(payload: ReportRunPayload, signal: AbortSignal) {
  return await apiPostViewReport(payload, { signal })
}

export function useViewReport() {
  const abortRef = useRef<AbortController | null>(null)

  const mutation = useMutation({
    mutationFn: async (payload: ReportRunPayload) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      return await viewReport(payload, ac.signal)
    },
  })

  const stopViewReport = () => {
    abortRef.current?.abort()
    mutation.reset()
  }

  return { ...mutation, stopViewReport }
}
