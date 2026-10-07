import { postedRecordsCountReportSchema } from "../schemas"

/** Reports screen: unwrap `POST /report/data` (`{ data: [report] }`) and render the A010 PDF. */
export async function renderPostedRecordsCountPdf(response: unknown): Promise<Blob> {
  const envelope = response as { data?: unknown } | unknown[] | null
  const data = Array.isArray(envelope) ? envelope : (envelope as { data?: unknown } | null)?.data
  const first = Array.isArray(data) ? data[0] : data
  const report = postedRecordsCountReportSchema.parse(first)
  const { generatePostedRecordsCountPdf } = await import("../pdf/PostedRecordsCountPdf")
  return generatePostedRecordsCountPdf(report)
}
