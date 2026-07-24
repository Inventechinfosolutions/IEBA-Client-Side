import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail, Save } from "lucide-react"
import { useGetDepartmentNotificationConfig } from "../queries/getDepartmentNotificationConfig"
import { useDepartmentNotificationConfigSave } from "../hooks/useDepartmentNotificationConfigSave"
import {
  ALL_NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  type DepartmentNotificationType,
} from "../api/departmentNotificationConfig"

interface NotificationRow {
  notificationType: DepartmentNotificationType
  emailEnabled: boolean
  inAppEnabled: boolean
  active: boolean
}

function buildDefaultRows(): NotificationRow[] {
  return ALL_NOTIFICATION_TYPES.map((nt) => ({
    notificationType: nt,
    emailEnabled: true,
    inAppEnabled: true,
    active: true,
  }))
}

interface DepartmentNotificationsPanelProps {
  departmentId: string | null
  departmentCode?: string
  departmentName?: string
  onEnsureDepartmentId: () => Promise<string | null>
}

export function DepartmentNotificationsPanel({
  departmentId,
  departmentName,
  onEnsureDepartmentId,
}: DepartmentNotificationsPanelProps) {
  const { data: savedConfigs, isLoading } = useGetDepartmentNotificationConfig(departmentId)
  const saveMutation = useDepartmentNotificationConfigSave(departmentId)
  const [rows, setRows] = useState<NotificationRow[]>(buildDefaultRows)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync local state from server data
  useEffect(() => {
    if (!savedConfigs || savedConfigs.length === 0) {
      setRows(buildDefaultRows())
      return
    }
    const merged = ALL_NOTIFICATION_TYPES.map((nt) => {
      const server = savedConfigs.find((c) => c.notificationType === nt)
      if (server) {
        return {
          notificationType: nt,
          emailEnabled: server.emailEnabled,
          inAppEnabled: server.inAppEnabled,
          active: server.active,
        }
      }
      return { notificationType: nt, emailEnabled: true, inAppEnabled: true, active: true }
    })
    setRows(merged)
    setHasChanges(false)
  }, [savedConfigs])

  const updateRow = useCallback(
    (notificationType: DepartmentNotificationType, field: keyof NotificationRow, value: boolean) => {
      setRows((prev) =>
        prev.map((r) =>
          r.notificationType === notificationType ? { ...r, [field]: value } : r,
        ),
      )
      setHasChanges(true)
    },
    [],
  )

  const handleSave = async () => {
    let resolvedId = departmentId
    if (!resolvedId) {
      resolvedId = await onEnsureDepartmentId()
    }
    if (!resolvedId) return

    saveMutation.mutate(
      rows.map((r) => ({
        notificationType: r.notificationType,
        emailEnabled: r.emailEnabled,
        inAppEnabled: r.inAppEnabled,
        active: r.active,
      })),
    )
    setHasChanges(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Spinner className="text-[#6C5DD3]" />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-8 pb-6 sm:pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-[600] text-[#111827]">
            Notification Settings
          </h3>
          <p className="text-[12px] text-[#6B7280] mt-1">
            Configure email and in-app notifications for time study events
            {departmentName ? ` in ${departmentName}` : ""}.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || !hasChanges}
          className="h-[38px] gap-2 rounded-[8px] bg-[#6C5DD3] text-white hover:bg-[#5B4EC2] disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <Spinner className="h-4 w-4 text-white" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Notifications
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-[10px] border border-[#E5E7EB] overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_100px] bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <div className="px-4 py-3 text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">
            Notification Type
          </div>
          <div className="px-4 py-3 text-center text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">
            <div className="flex items-center justify-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Email
            </div>
          </div>
          <div className="px-4 py-3 text-center text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">
            <div className="flex items-center justify-center gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              In-App
            </div>
          </div>
          <div className="px-4 py-3 text-center text-[12px] font-[600] text-[#6B7280] uppercase tracking-wider">
            Active
          </div>
        </div>

        {/* Table rows */}
        {rows.map((row, idx) => (
          <div
            key={row.notificationType}
            className={`
              flex flex-col sm:grid sm:grid-cols-[1fr_100px_100px_100px] items-start sm:items-center
              px-4 py-3 sm:py-2.5 gap-2 sm:gap-0
              ${idx < rows.length - 1 ? "border-b border-[#E5E7EB]" : ""}
              ${!row.active ? "opacity-50" : ""}
              transition-opacity duration-200
            `}
          >
            {/* Notification type label */}
            <div className="text-[13px] font-[500] text-[#374151] pr-2">
              {NOTIFICATION_TYPE_LABELS[row.notificationType]}
            </div>

            {/* Mobile: show labels inline | Desktop: just toggles */}
            <div className="flex items-center gap-2 sm:justify-center w-full sm:w-auto">
              <span className="sm:hidden text-[11px] text-[#9CA3AF] w-[50px]">Email</span>
              <Switch
                checked={row.emailEnabled}
                onCheckedChange={(val) =>
                  updateRow(row.notificationType, "emailEnabled", val)
                }
                disabled={!row.active}
                className="data-[state=checked]:bg-[#6C5DD3]"
              />
            </div>

            <div className="flex items-center gap-2 sm:justify-center w-full sm:w-auto">
              <span className="sm:hidden text-[11px] text-[#9CA3AF] w-[50px]">In-App</span>
              <Switch
                checked={row.inAppEnabled}
                onCheckedChange={(val) =>
                  updateRow(row.notificationType, "inAppEnabled", val)
                }
                disabled={!row.active}
                className="data-[state=checked]:bg-[#6C5DD3]"
              />
            </div>

            <div className="flex items-center gap-2 sm:justify-center w-full sm:w-auto">
              <span className="sm:hidden text-[11px] text-[#9CA3AF] w-[50px]">Active</span>
              <Switch
                checked={row.active}
                onCheckedChange={(val) =>
                  updateRow(row.notificationType, "active", val)
                }
                className="data-[state=checked]:bg-[#10B981]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Info text */}
      <div className="text-[11px] text-[#9CA3AF] space-y-1">
        <p>
          <strong>Email:</strong> Sends an email notification to the user's registered email address.
        </p>
        <p>
          <strong>In-App:</strong> Shows a bell notification in the user's portal.
        </p>
        <p>
          <strong>Active:</strong> Master toggle — disabling this turns off both email and in-app for that notification type.
        </p>
      </div>
    </div>
  )
}
