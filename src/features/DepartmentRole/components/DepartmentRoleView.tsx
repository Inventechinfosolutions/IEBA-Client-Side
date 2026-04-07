import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { DepartmentRoleViewProps } from "../types"
import { cn } from "@/lib/utils"

const rowCheckboxClass =
  "size-4 shrink-0 border-[rgb(108,93,211)] data-[state=checked]:border-[rgb(108,93,211)] data-[state=checked]:bg-[rgb(108,93,211)]"

const permissionsScrollClass =
  "max-h-[min(52vh,460px)] overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:rgb(200,200,200)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c8c8c8]"

export function DepartmentRoleView({
  open,
  onOpenChange,
  role,
  isLoading = false,
}: DepartmentRoleViewProps) {
  const departmentName = role?.departmentName ?? ""
  const roleName = role?.roleName ?? ""
  const active = role?.active ?? true
  const permissionGroups = role?.permissionGroups ?? []
  const assignedPermissions = role?.assignedPermissions ?? []

  const hasGroupedPermissions = permissionGroups.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[1000px] max-w-[95vw] min-h-0 flex-col overflow-hidden rounded-lg border bg-white py-5 px-[50px] sm:rounded-lg data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-top-[48%]"
        overlayClassName="bg-black/40"
      >
        <DialogHeader className="relative flex shrink-0 flex-row items-center gap-4">
          <div className="flex-1" aria-hidden />
          <DialogTitle className="absolute left-1/2 -translate-x-1/2 text-xl text-black">
            Role
          </DialogTitle>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Checkbox
              id="view-active"
              checked={active}
              disabled
              className={cn(
                "size-4 border-[rgb(108,93,211)] data-[state=checked]:border-[rgb(108,93,211)] data-[state=checked]:bg-[rgb(108,93,211)]"
              )}
            />
            <Label
              htmlFor="view-active"
              className="cursor-default text-sm font-normal text-black"
            >
              Active
            </Label>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col pt-4">
          <div className="grid w-full grid-cols-2 gap-6 pb-4">
            <div className="min-w-0 space-y-2">
              <Label className="text-black">Department</Label>
              {isLoading ? (
                <Skeleton className="h-[46px] w-full rounded-md" />
              ) : (
                <div
                  className={cn(
                    "flex h-[46px] w-full items-center rounded-md border border-[#e5e5e5] bg-black/[0.04] px-[18px] text-sm text-black"
                  )}
                >
                  {departmentName || "—"}
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <Label className="text-black">Role Name</Label>
              {isLoading ? (
                <Skeleton className="h-[46px] w-full rounded-md" />
              ) : (
                <div
                  className={cn(
                    "flex h-[46px] w-full items-center rounded-md border border-[#e5e5e5] bg-[#F5F5F5] px-[18px] text-sm text-black"
                  )}
                >
                  {roleName || "—"}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full min-h-0 flex-1 flex-col pt-2">
            <div className="flex min-h-[320px] w-full flex-1 flex-col overflow-hidden rounded-lg border border-[#e5e5e5] bg-white">
              <div className="flex h-10 shrink-0 items-center rounded-t-[7px] bg-[rgb(108,93,211)] px-3 text-sm font-medium text-white">
                <span>Assigned permissions</span>
              </div>
              <div className={cn("min-h-0 flex-1 bg-white", permissionsScrollClass)}>
                {isLoading ? (
                  <div className="space-y-3 p-3">
                    <Skeleton className="h-9 w-full rounded-md bg-[#ebebeb]" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-[92%]" />
                  </div>
                ) : hasGroupedPermissions ? (
                  <div className="pb-1">
                    {permissionGroups.map((group, groupIndex) => {
                      const n = group.permissions.length
                      const moduleChecked = n > 0
                      return (
                        <div
                          key={`${group.moduleId}-${group.moduleName}`}
                          className={cn(
                            groupIndex > 0 && "border-t border-[#e5e5e5]"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-10 items-center justify-between bg-[#EBEBEB] px-3 text-sm text-black"
                            )}
                          >
                            <span>{group.moduleName}</span>
                            <Checkbox
                              checked={moduleChecked}
                              disabled
                              aria-label={`${group.moduleName} — all assigned`}
                              className={rowCheckboxClass}
                            />
                          </div>
                          <div className="relative bg-white">
                            <div
                              className="pointer-events-none absolute bottom-0 left-[22px] top-0 w-px bg-[#d4d4d4]"
                              aria-hidden
                            />
                            <ul className="relative m-0 list-none p-0">
                              {group.permissions.map((perm, i) => (
                                <li
                                  key={perm.permissionId}
                                  className={cn(
                                    "relative flex min-h-[42px] items-center justify-between gap-3 pr-3",
                                    i < group.permissions.length - 1 &&
                                      "border-b border-[#f0f0f0]"
                                  )}
                                >
                                  <div className="relative flex min-w-0 flex-1 items-center py-2.5 pl-9">
                                    <span
                                      className="absolute left-[22px] top-1/2 h-px w-3 -translate-y-1/2 bg-[#d4d4d4]"
                                      aria-hidden
                                    />
                                    <span className="text-sm leading-snug text-black">
                                      {perm.name}
                                    </span>
                                  </div>
                                  <Checkbox
                                    checked
                                    disabled
                                    aria-label={perm.name}
                                    className={rowCheckboxClass}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : assignedPermissions.length > 0 ? (
                  <ul className="space-y-2 p-3">
                    {assignedPermissions.map((name) => (
                      <li
                        key={name}
                        className="flex items-center justify-between gap-2 rounded-md border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-black"
                      >
                        <span>{name}</span>
                        <Checkbox checked disabled className={rowCheckboxClass} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No permissions assigned.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end pt-6">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[50px] min-w-[140px] rounded-lg bg-[#DADADA] px-5 py-2.5 text-black hover:bg-[#d1d1d1]"
            >
              Exit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
