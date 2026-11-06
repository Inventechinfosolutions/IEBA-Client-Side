import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { runA010MonthlySnapshot } from "@/features/settings/api/a010SnapshotApi"

export function useRunA010MonthlySnapshot() {
  return useMutation({
    mutationFn: runA010MonthlySnapshot,
    onSuccess: (data) => {
      toast.success(
        `A010 snapshot for ${data.eventMonth}: ${data.inserted} row(s) saved`,
      )
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "A010 snapshot failed"
      toast.error(message)
    },
  })
}
