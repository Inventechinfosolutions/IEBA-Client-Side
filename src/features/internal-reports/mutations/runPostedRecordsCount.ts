import { useMutation } from "@tanstack/react-query"
import { useRef } from "react"

import { downloadPostedRecordsCountFile, fetchPostedRecordsCountReport } from "../api/postedRecordsCount"
import type { PostedRecordsCountRequest, PostedRecordsCountRunResult, PostedRecordsOutputType } from "../types"
import { buildPostedRecordsCountFileName } from "../utils/postedRecordsCountFormat"

type RunInput = { request: PostedRecordsCountRequest; outputType: PostedRecordsOutputType }

async function runPostedRecordsCount({ request, outputType }: RunInput, signal: AbortSignal): Promise<PostedRecordsCountRunResult> {
  if (outputType === "PDF") {
    const report = await fetchPostedRecordsCountReport(request, signal)
    const { generatePostedRecordsCountPdf } = await import("../pdf/PostedRecordsCountPdf")
    return { kind: "PDF", blob: await generatePostedRecordsCountPdf(report), report }
  }
  const blob = await downloadPostedRecordsCountFile(request, outputType, signal)
  return { kind: "FILE", blob, fileName: buildPostedRecordsCountFileName(request, outputType) }
}

export function useRunPostedRecordsCount() {
  const abortRef = useRef<AbortController | null>(null)

  const mutation = useMutation({
    mutationFn: async (input: RunInput) => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      return await runPostedRecordsCount(input, ac.signal)
    },
  })

  const cancel = () => {
    abortRef.current?.abort()
    mutation.reset()
  }

  return { ...mutation, cancel }
}
