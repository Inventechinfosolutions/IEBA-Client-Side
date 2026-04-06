/** Coerces form/API values into a positive integer `locationId` for create/update DTOs. */
export function normalizeLocationId(raw: unknown): number | undefined {
  if (raw == null) return undefined
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return undefined
  return n
}
