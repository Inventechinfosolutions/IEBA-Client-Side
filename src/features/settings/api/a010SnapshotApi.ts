import { api } from "@/lib/api"

export type A010SnapshotResult = {
  nameSpace: string
  eventMonth: string
  inserted: number
}

/** Runs the same A010 month snapshot as the 1st-of-month backend job (current county). */
export async function runA010MonthlySnapshot(): Promise<A010SnapshotResult> {
  const raw = await api.post<{
    data?: A010SnapshotResult
    success?: boolean
    message?: string
  }>("/report/internal/a010-active-history/snapshot", {})

  const data = raw && typeof raw === "object" && "data" in raw ? raw.data : undefined
  if (!data?.eventMonth) {
    throw new Error(
      typeof raw === "object" && raw && "message" in raw && typeof raw.message === "string"
        ? raw.message
        : "A010 snapshot failed",
    )
  }
  return data
}
