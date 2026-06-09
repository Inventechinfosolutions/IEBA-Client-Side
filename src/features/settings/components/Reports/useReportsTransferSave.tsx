import { useCallback, useRef } from "react"

import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { ReportsSaveScope } from "@/features/settings/types"

export function useReportsTransferSave() {
  const masterCodesBtnRef = useRef<HTMLButtonElement>(null)
  const activitiesBtnRef = useRef<HTMLButtonElement>(null)

  const saveMasterCodes = useCallback(() => {
    masterCodesBtnRef.current?.click()
  }, [])

  const saveActivities = useCallback(() => {
    activitiesBtnRef.current?.click()
  }, [])

  const triggerSave = useCallback(
    (scope: ReportsSaveScope) => {
      if (scope === "masterCodes") saveMasterCodes()
      else saveActivities()
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
        />
        <button
          ref={activitiesBtnRef}
          type="submit"
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          data-settings-section={SettingsFormSaveSection.Reports}
          data-reports-save-scope="activities"
        />
      </>
    )
  }

  return { triggerSave, saveMasterCodes, saveActivities, ReportsTransferSaveTriggers }
}
