/**
 * P101-ALL — same layout/design as P101.
 *
 * Difference: non-FFP program codes (WIC / BH / DSS / other PH) remap to FFP-05.
 * FFP and MAA rows stay as on basic P101 (MAA still broken out by code).
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
