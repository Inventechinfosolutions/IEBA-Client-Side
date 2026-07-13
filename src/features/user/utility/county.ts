/** True when the logged-in tenant county is Mono (case-insensitive). */
export function isMonoCounty(countyName?: string | null): boolean {
  return countyName?.trim().toLowerCase() === "mono"
}
