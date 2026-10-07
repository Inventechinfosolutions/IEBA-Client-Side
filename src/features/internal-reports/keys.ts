export const internalReportKeys = {
  all: ["internal-reports"] as const,
  access: () => [...internalReportKeys.all, "access"] as const,
  postedRecordsCountOptions: () => [...internalReportKeys.all, "posted-records-count", "options"] as const,
}
