import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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
        showClose={false}
        className="fixed inset-0 z-50 overflow-y-auto grid place-items-center bg-transparent border-none shadow-none p-0 left-0 top-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen"
        overlayClassName="bg-black/40"
      >
        <div className="relative my-8 w-[1000px] max-w-[95vw] bg-white rounded-lg border py-5 px-[50px] shadow-lg flex flex-col">
          <DialogClose className="absolute right-6 top-6 cursor-pointer rounded-sm opacity-70 hover:opacity-100">
            <X className="size-4 text-black" />
          </DialogClose>

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

          <div className="relative flex min-h-0 flex-1 flex-col pt-4">
            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
                <Spinner className="text-[#6C5DD3]" />
              </div>
            )}
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

            <div className="flex w-full min-h-0 flex-col items-center pt-2">
              <div className="flex max-h-[520px] w-full max-w-[380px] flex-col overflow-hidden rounded-lg border border-[#e5e5e5] bg-white">
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
                                "flex h-10 items-center justify-between bg-[#F3F4F6] px-3 text-[14px] font-medium text-[#111827]"
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
                            <div className="relative bg-white pb-2 px-1">
                              <ul className="relative m-0 list-none p-0">
                                {group.permissions.map((perm) => (
                                  <li
                                    key={perm.permissionId}
                                    className="relative flex items-center justify-between py-0.5 pl-12 pr-2 hover:bg-[#F9FAFB]/50 rounded-md"
                                  >
                                    {/* Tree lines */}
                                    <div className="absolute left-[26px] top-0 h-full w-[1.5px] bg-[#E5E7EB]" />
                                    <div className="absolute left-[26px] top-1/2 h-[1.5px] w-4 bg-[#E5E7EB]" />

                                    <span className="text-[13.5px] text-[#4B5563] leading-normal">
                                      {perm.name}
                                    </span>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
