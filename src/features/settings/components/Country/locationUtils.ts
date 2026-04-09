export function parseLocationId(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined
  const n = typeof raw === "number" ? raw : Number(String(raw))
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.trunc(n)
}
