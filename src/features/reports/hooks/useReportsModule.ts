import { useDownloadReport } from "../mutations/downloadReport"
import { useViewReport } from "../mutations/viewReport"
import { useGetReportCatalog } from "../queries/getReports"

export function useReportsModule() {
  const catalogQuery = useGetReportCatalog()
  const viewMutation = useViewReport()
  const downloadMutation = useDownloadReport()

  return {
    catalogItems: catalogQuery.data ?? [],
    isCatalogPending: catalogQuery.isPending,
    isCatalogFetching: catalogQuery.isFetching,
    catalogError: catalogQuery.error,
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
