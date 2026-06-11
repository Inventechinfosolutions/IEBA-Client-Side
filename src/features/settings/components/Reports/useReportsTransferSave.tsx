import { useCallback, useRef } from "react"

import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { ReportsBucketMode, ReportsSaveScope } from "@/features/settings/types"

export type ReportsTransferDirection = "assign" | "unassign"

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

  /** Master codes always refetch with mode=include. */
  const saveMasterCodes = useCallback(() => {
    clickSave(masterCodesBtnRef.current, "masterCodes", "include")
  }, [clickSave])

  /** Assign → include; unassign → exclude. */
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

  const triggerSave = useCallback(
    (scope: ReportsSaveScope, direction: ReportsTransferDirection = "assign") => {
      if (scope === "masterCodes") saveMasterCodes()
      else saveActivities(direction)
    },
    [saveActivities, saveMasterCodes],
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

  return { triggerSave, saveMasterCodes, saveActivities, ReportsTransferSaveTriggers }
}
