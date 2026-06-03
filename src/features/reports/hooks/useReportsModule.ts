import { useDownloadReport } from "../mutations/downloadReport"
import { useViewReport } from "../mutations/viewReport"

/** View/download mutations for the Reports screen. Data queries live in ReportForm. */
export function useReportsModule() {
  const viewMutation = useViewReport()
  const downloadMutation = useDownloadReport()

  return {
    viewReport: viewMutation.mutate,
    viewReportAsync: viewMutation.mutateAsync,
    isViewPending: viewMutation.isPending,
    isViewError: viewMutation.isError,
    viewError: viewMutation.error,
    stopViewReport: viewMutation.stopViewReport,
    downloadReport: downloadMutation.mutate,
    downloadReportAsync: downloadMutation.mutateAsync,
    isDownloadPending: downloadMutation.isPending,
    isDownloadError: downloadMutation.isError,
    downloadError: downloadMutation.error,
    stopDownloadReport: downloadMutation.stopDownloadReport,
  }
}

export type ReportsModuleApi = ReturnType<typeof useReportsModule>
