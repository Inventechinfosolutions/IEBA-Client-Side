/** Madera runs the MAATCM report with its own edits (Zoho I-1-I441); other counties keep the original layout. */
export const MAATCM_MADERA_REPORT_TITLE = "MAA-TCM-MAD Timestudy Report"

export function isMaderaCounty(countyName: string | null | undefined): boolean {
  return /\bmadera\b/i.test(String(countyName ?? ""))
}
