import { useCallback, useRef } from "react"

import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { ReportsTransferDirection } from "@/features/settings/components/Reports/reportsTransfer.types"
import type { ReportsBucketMode, ReportsSaveScope } from "@/features/settings/types"

export type { ReportsTransferDirection }

export function useReportsTransferSave() {
  const masterCodesBtnRef = useRef<HTMLButtonElement>(null)
  const activitiesBtnRef = useRef<HTMLButtonElement>(null)

  const clickSave = useCallback(
    (
      btn: HTMLButtonElement | null,
      scope: ReportsSaveScope,
      bucketMode: ReportsBucketMode,
    ) => {
      if (!btn) return
      btn.dataset.reportsSaveScope = scope
      btn.dataset.reportsBucketMode = bucketMode
      btn.click()
    },
    [],
  )

  const saveMasterCodes = useCallback(
    (direction: ReportsTransferDirection) => {
      clickSave(
        masterCodesBtnRef.current,
        "masterCodes",
        direction === "assign" ? "include" : "exclude",
      )
    },
    [clickSave],
  )

  const saveActivities = useCallback(
    (direction: ReportsTransferDirection) => {
      clickSave(
        activitiesBtnRef.current,
        "activities",
        direction === "assign" ? "include" : "exclude",
      )
    },
    [clickSave],
  )

  function ReportsTransferSaveTriggers() {
    return (
      <>
        <button
          ref={masterCodesBtnRef}
          type="submit"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          data-settings-section={SettingsFormSaveSection.Reports}
          data-reports-save-scope="masterCodes"
          data-reports-bucket-mode="include"
        />
        <button
          ref={activitiesBtnRef}
          type="submit"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          data-settings-section={SettingsFormSaveSection.Reports}
          data-reports-save-scope="activities"
          data-reports-bucket-mode="include"
        />
      </>
    )
  }

  return { saveMasterCodes, saveActivities, ReportsTransferSaveTriggers }
}
