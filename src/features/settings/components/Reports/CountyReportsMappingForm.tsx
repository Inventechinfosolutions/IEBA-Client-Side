import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { Spinner } from "@/components/ui/spinner"
import { TransferPanel } from "@/features/department/components/TransferPanel"
import type { DepartmentReportOption } from "@/features/department/types"
import {
  getAllReportOptionsForCountyMapping,
  getCountyMappedReports,
  mapCountyReports,
} from "@/features/settings/api/countyReports"
import { settingsKeys } from "@/features/settings/keys"
import { departmentKeys } from "@/features/department/keys"
import { reportKeys } from "@/features/reports/keys"
import {
  parseDepartmentReportIdsForSave,
  serializeDepartmentReportIds,
} from "@/features/department/lib/departmentReport.utils"

const labelClassName = "mb-2 block text-[13px] font-[500] text-[#374151]"

type CountyReportMultiSelectFieldProps = {
  reportOptions: DepartmentReportOption[]
  serverMappedReportIds: string
  isLoading: boolean
  onImmediateUpdate: (reportIds: number[]) => void
}

function CountyReportMultiSelectField({
  reportOptions,
  serverMappedReportIds,
  isLoading,
  onImmediateUpdate,
}: CountyReportMultiSelectFieldProps) {
  const [userReportIds, setUserReportIds] = useState<string | null>(null)
  const [searchAvailable, setSearchAvailable] = useState("")
  const [searchSelected, setSearchSelected] = useState("")
  const [toggledAvailable, setToggledAvailable] = useState<string[]>([])
  const [toggledSelected, setToggledSelected] = useState<string[]>([])

  const selectedIds = useMemo(() => {
    const raw = userReportIds ?? serverMappedReportIds
    return raw
      .split(/[,;\n]+/g)
      .map((p) => p.trim())
      .filter(Boolean)
  }, [userReportIds, serverMappedReportIds])

  const { availableReports, selectedReports } = useMemo(() => {
    const selected = reportOptions.filter((opt) => selectedIds.includes(String(opt.id)))
    const available = reportOptions.filter((opt) => !selectedIds.includes(String(opt.id)))
    return { availableReports: available, selectedReports: selected }
  }, [reportOptions, selectedIds])

  const filteredAvailable = useMemo(() => {
    if (!searchAvailable.trim()) return availableReports
    const query = searchAvailable.toLowerCase()
    return availableReports.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query),
    )
  }, [availableReports, searchAvailable])

  const filteredSelected = useMemo(() => {
    if (!searchSelected.trim()) return selectedReports
    const query = searchSelected.toLowerCase()
    return selectedReports.filter(
      (r) =>
        r.label.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query),
    )
  }, [selectedReports, searchSelected])

  const handleMoveForward = () => {
    if (toggledAvailable.length === 0) return
    const nextIds = [...new Set([...selectedIds, ...toggledAvailable])]
    setUserReportIds(nextIds.join(", "))
    setToggledAvailable([])
    onImmediateUpdate(nextIds.map(Number))
  }

  const handleMoveBack = () => {
    if (toggledSelected.length === 0) return
    const nextIds = selectedIds.filter((id) => !toggledSelected.includes(id))
    setUserReportIds(nextIds.join(", "))
    setToggledSelected([])
    onImmediateUpdate(nextIds.map(Number))
  }

  if (isLoading) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFBFD] px-3 py-2 text-sm text-gray-400">
        Loading reports…
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_60px_1fr] items-center gap-4 w-full">
      <TransferPanel
        title="Select Reports(Available)"
        items={filteredAvailable}
        selectedIds={toggledAvailable}
        onToggleItem={(id) =>
          setToggledAvailable((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
        onSelectAll={(checked) =>
          setToggledAvailable(checked ? filteredAvailable.map((r) => String(r.id)) : [])
        }
        searchValue={searchAvailable}
        onSearchChange={setSearchAvailable}
      />

      <div className="flex sm:flex-col gap-3 justify-center items-center py-2 sm:pt-8">
        <TransferListMoveButton
          direction="forward"
          disabled={toggledAvailable.length === 0}
          aria-label="Move selected to assigned"
          onClick={handleMoveForward}
          className="[&>svg]:rotate-90 sm:[&>svg]:rotate-0"
        />
        <TransferListMoveButton
          direction="back"
          disabled={toggledSelected.length === 0}
          aria-label="Move selected to unassigned"
          onClick={handleMoveBack}
          className="[&>svg]:-rotate-90 sm:[&>svg]:rotate-180"
        />
      </div>

      <TransferPanel
        title="Select Reports(Selected)"
        items={filteredSelected}
        selectedIds={toggledSelected}
        onToggleItem={(id) =>
          setToggledSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
        onSelectAll={(checked) =>
          setToggledSelected(checked ? filteredSelected.map((r) => String(r.id)) : [])
        }
        searchValue={searchSelected}
        onSearchChange={setSearchSelected}
      />
    </div>
  )
}

type CountyReportsMappingFormProps = {
  isSectionOpen?: boolean
}

/** Settings → Reports: map which reports belong to this county. */
export function CountyReportsMappingForm({ isSectionOpen = false }: CountyReportsMappingFormProps) {
  const queryClient = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: [...settingsKeys.reports.all(), "county-catalog"] as const,
    queryFn: getAllReportOptionsForCountyMapping,
    enabled: isSectionOpen,
    staleTime: 60_000,
  })

  const mappedQuery = useQuery({
    queryKey: [...settingsKeys.reports.all(), "county-mapped"] as const,
    queryFn: () => getCountyMappedReports({ method: "reportscreen" }),
    enabled: isSectionOpen,
    staleTime: 30_000,
  })

  const mapMutation = useMutation({
    mutationFn: (reportIds: number[]) => mapCountyReports(reportIds),
    onSuccess: async () => {
      // County Selected list
      await queryClient.invalidateQueries({
        queryKey: [...settingsKeys.reports.all(), "county-mapped"],
      })
      // County options used by new-dept report setting / settings helpers
      await queryClient.invalidateQueries({
        queryKey: [...settingsKeys.reports.all(), "county-mapped-options"],
      })
      // Department Report Setting Available pool + Selected (all depts)
      await queryClient.invalidateQueries({
        queryKey: departmentKeys.reportSettings.all(),
      })
      // Reports run screen dropdowns (per department)
      await queryClient.invalidateQueries({
        queryKey: [...reportKeys.all, "by-department"],
      })
      toast.success("County reports updated successfully")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update county reports")
    },
  })

  const serverMappedReportIds = serializeDepartmentReportIds(mappedQuery.data?.reportIds ?? [])
  const countyName = mappedQuery.data?.countyName?.trim() || ""
  const isLoading =
    isSectionOpen &&
    (catalogQuery.isPending ||
      catalogQuery.isFetching ||
      mappedQuery.isPending ||
      mappedQuery.isFetching)

  return (
    <div className="space-y-4">
      {countyName ? (
        <p className="text-[13px] text-[#6B7280]">
          County: <span className="font-medium text-[#374151]">{countyName}</span>
        </p>
      ) : null}

      <div>
        <label className={labelClassName}>Reports</label>
        <CountyReportMultiSelectField
          key={serverMappedReportIds}
          reportOptions={catalogQuery.data ?? []}
          serverMappedReportIds={serverMappedReportIds}
          isLoading={isLoading}
          onImmediateUpdate={(reportIds) => {
            void mapMutation.mutateAsync(reportIds)
          }}
        />
      </div>

      {mapMutation.isPending ? (
        <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
          <Spinner className="size-4 text-[#6C5DD3]" />
          Saving county report mapping…
        </div>
      ) : null}

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          disabled={mapMutation.isPending || isLoading}
          onClick={() => {
            const ids = parseDepartmentReportIdsForSave(serverMappedReportIds)
            void mapMutation.mutateAsync(ids)
          }}
          className="hidden"
          aria-hidden
        >
          Save
        </Button>
      </div>
    </div>
  )
}
