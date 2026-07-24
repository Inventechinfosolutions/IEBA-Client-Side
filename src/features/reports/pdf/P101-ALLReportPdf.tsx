/**
 * P101-ALL — same layout/design as P101.
 *
 * Difference: every non-FFP master code is remapped to FFP-05 before grouping,
 * so FFP-05 is the catch-all for FFP-05 hours plus all other non-FFP time.
 * Other FFP codes (FFP-50, etc.) are unchanged. The report still only shows
 * FFP values in the FFP column because non-FFP codes become FFP-05.
 *
 * Footer: pre-remap Total FFP / Total MAA / period combined lines, with
 * signatures fixed in the page footer for every employee.
 */

import { generateP101ReportPdf } from "./P101ReportPdf"
import {
  getP101AllCategoryTotalsByEmployee,
  remapP101AllNonFfpToFfp05,
  type P101ReportPdfProps,
} from "./reportPdf"

export async function generateP101AllReportPdf(props: P101ReportPdfProps): Promise<Blob> {
  const categoryTotalsByEmployee = getP101AllCategoryTotalsByEmployee(props.records)

  return generateP101ReportPdf({
    ...props,
    records: remapP101AllNonFfpToFfp05(props.records),
    categoryTotalsByEmployee,
    meta: {
      ...props.meta,
      reportCode: props.meta?.reportCode ?? "P101-ALL",
    },
  })
}
