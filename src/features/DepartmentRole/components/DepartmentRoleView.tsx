import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { DepartmentRoleViewProps } from "../types"
import { cn } from "@/lib/utils"

export function DepartmentRoleView({
  open,
  onOpenChange,
  role,
}: DepartmentRoleViewProps) {
  const departmentName = role?.departmentName ?? ""
  const roleName = role?.roleName ?? ""
  const active = role?.active ?? true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[1000px] max-w-[95vw] min-h-0 flex-col overflow-y-auto overflow-x-hidden rounded-lg border bg-white py-5 px-[50px] sm:rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-top-[48%]"
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
              className="border-[rgb(108,93,211)] data-[state=checked]:border-[rgb(108,93,211)] data-[state=checked]:bg-[rgb(108,93,211)]"
            />
            <Label
              htmlFor="view-active"
              className="cursor-default text-sm font-normal text-black"
            >
              Active
            </Label>
          </div>
        </DialogHeader>

        <div className="flex min-h-[802px] flex-col pt-4">
          <div className="grid grid-cols-2 gap-6 pb-4">
            <div className="space-y-2">
              <Label className="text-black">Department</Label>
              <div
                className={cn(
                  "flex h-[46px] w-full max-w-[410px] items-center rounded-md border border-[#e5e5e5] bg-black/[0.04] px-[18px] text-sm text-black"
                )}
              >
                {departmentName || "—"}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-black">Role Name</Label>
              <div
                className={cn(
                  "flex h-[60px] w-full max-w-[410px] items-center rounded-md border border-[#e5e5e5] bg-[#F5F5F5] px-2 py-2 text-sm text-black"
                )}
              >
                {roleName || "—"}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <div className="h-[500px] w-[405px] shrink-0 rounded-lg border border-[#e5e5e5]">
              <div className="flex h-10 items-center justify-between rounded-t-lg bg-[rgb(108,93,211)] px-3 text-sm font-medium text-white">
                <span>Assigned permissions</span>
              </div>
              <div className="h-[460px] w-full p-4">
             
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[50px] min-w-[140px] bg-[#DADADA] px-5 py-2.5 text-black hover:bg-[#d1d1d1]"
            >
              Exit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
