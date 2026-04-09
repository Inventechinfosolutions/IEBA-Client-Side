import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"

import { apiPostDownloadReport } from "../api"
import type { ReportRunPayload } from "../types"

async function downloadReport(payload: ReportRunPayload, signal: AbortSignal) {
  return await apiPostDownloadReport(payload, { signal })
}

export function useDownloadReport() {
  const abortRef = useRef<AbortController | null>(null)

  const mutation = useMutation({
    mutationFn: async (payload: ReportRunPayload) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      return await downloadReport(payload, ac.signal)
    },
  })

  const stopDownloadReport = () => {
    abortRef.current?.abort()
    mutation.reset()
  }

  return { ...mutation, stopDownloadReport }
}
