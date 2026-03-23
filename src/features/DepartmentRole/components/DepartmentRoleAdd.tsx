import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronRightIcon, ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addRoleFormSchema } from "../schemas"
import type { AddRoleFormSchema } from "../schemas"
import type { DepartmentRoleAddProps } from "../types"
import { cn } from "@/lib/utils"

const DEPARTMENTS = ["Social Services"] as const
const ALL_PERMISSIONS_LIST = ["General Admin", "Time Study", "Personal"] as const

export function DepartmentRoleAdd({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: DepartmentRoleAddProps) {
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(
    new Set()
  )
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(
    new Set()
  )

  const form = useForm<AddRoleFormSchema>({
    resolver: zodResolver(addRoleFormSchema),
    defaultValues: {
      department: DEPARTMENTS[0] ?? "",
      roleName: "",
      active: true,
      assignedPermissions: [],
    },
  })

  const assignedPermissions = form.watch("assignedPermissions")
  const availablePermissions = ALL_PERMISSIONS_LIST.filter(
    (p) => !assignedPermissions.includes(p)
  )

  const toggleAvailable = (id: string) => {
    setSelectedAvailable((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAssigned = (id: string) => {
    setSelectedAssigned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllAvailable = (checked: boolean) => {
    if (checked) setSelectedAvailable(new Set(availablePermissions))
    else setSelectedAvailable(new Set())
  }

  const selectAllAssigned = (checked: boolean) => {
    if (checked) setSelectedAssigned(new Set(assignedPermissions))
    else setSelectedAssigned(new Set())
  }

  const transferToAssigned = () => {
    const toAssign = Array.from(selectedAvailable)
    form.setValue("assignedPermissions", [...assignedPermissions, ...toAssign])
    setSelectedAvailable(new Set())
  }

  const transferToAvailable = () => {
    const toRemove = Array.from(selectedAssigned)
    form.setValue(
      "assignedPermissions",
      assignedPermissions.filter((p) => !toRemove.includes(p))
    )
    setSelectedAssigned(new Set())
  }

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      department: values.department,
      roleName: values.roleName,
      active: values.active,
      assignedPermissions: values.assignedPermissions,
    })
    form.reset({
      department: DEPARTMENTS[0] ?? "",
      roleName: "",
      active: true,
      assignedPermissions: [],
    })
    setSelectedAvailable(new Set())
    setSelectedAssigned(new Set())
    onOpenChange(false)
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset({
        department: DEPARTMENTS[0] ?? "",
        roleName: "",
        active: true,
        assignedPermissions: [],
      })
      setSelectedAvailable(new Set())
      setSelectedAssigned(new Set())
    }
    onOpenChange(next)
  }

  const panelHeaderClass =
    "flex h-10 items-center justify-between rounded-t-lg bg-[rgb(108,93,211)] px-3 text-sm font-medium text-white"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[1000px] max-w-[95vw] min-h-0 flex-col overflow-y-auto overflow-x-hidden p-[2%_5%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-top-[48%]"
        overlayClassName="bg-black/40"
      >
        <DialogHeader className="relative flex shrink-0 flex-row items-center gap-4">
          <div className="flex-1" aria-hidden />
          <DialogTitle className="absolute left-1/2 -translate-x-1/2 text-xl text-black">
            Add Role
          </DialogTitle>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Checkbox
              id="active"
              checked={form.watch("active")}
              onCheckedChange={(checked) =>
                form.setValue("active", checked === true)
              }
              className="border-[rgb(108,93,211)] data-[state=checked]:border-[rgb(108,93,211)] data-[state=checked]:bg-[rgb(108,93,211)]"
            />
            <Label
              htmlFor="active"
              className="cursor-pointer text-sm font-normal text-black"
            >
              Active
            </Label>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4 py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="department" className="text-black">
                Department
              </Label>
              <Select
                value={form.watch("department")}
                onValueChange={(v) => form.setValue("department", v)}
              >
                <SelectTrigger
                  id="department"
                  className={cn(
                    "h-[60px] w-full rounded-md border border-[#e5e5e5] bg-black/[0.04] px-[18px] text-black",
                    form.formState.errors.department && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.department && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.department.message}
                </p>
              )}
            </div>
            <div className="w-[62px] shrink-0" aria-hidden />
            <div className="min-w-0 space-y-2">
              <Label htmlFor="roleName" className="text-black">
                Role Name
              </Label>
              <Input
                id="roleName"
                placeholder="Role Name"
                className={cn(
                  "h-[60px] w-full rounded-md border border-[#e5e5e5] bg-white px-2 py-2 text-black placeholder:text-muted-foreground",
                  form.formState.errors.roleName && "border-destructive"
                )}
                {...form.register("roleName")}
              />
              {form.formState.errors.roleName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.roleName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
            <div className="min-w-[324px] rounded-lg border border-[#e5e5e5]">
              <div className={panelHeaderClass}>
                <span>All permissions</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-normal opacity-90">All</span>
                  <Checkbox
                    checked={
                      availablePermissions.length > 0 &&
                      selectedAvailable.size === availablePermissions.length
                    }
                    onCheckedChange={(checked) =>
                      selectAllAvailable(checked === true)
                    }
                    className="size-4 border-white data-[state=checked]:border-white data-[state=checked]:bg-white"
                  />
                  <span className="text-xs font-normal opacity-90">
                    {availablePermissions.length}
                  </span>
                </div>
              </div>
              <div className="min-h-[500px] p-1">
                  {availablePermissions.map((name) => (
                    <div
                      key={name}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
                      onClick={() => toggleAvailable(name)}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm">{name}</span>
                      </div>
                      <Checkbox
                        checked={selectedAvailable.has(name)}
                        onCheckedChange={() => toggleAvailable(name)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-[rgb(108,93,211)] data-[state=checked]:border-[rgb(108,93,211)] data-[state=checked]:bg-[rgb(108,93,211)]"
                      />
                    </div>
                  ))}
                  {availablePermissions.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No permissions available
                    </p>
                  )}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              <Button
                type="button"
                size="icon"
                className="h-[62px] w-[62px] shrink-0 rounded-lg bg-[rgb(108,93,211)] hover:bg-[rgb(108,93,211)]/90"
                onClick={transferToAssigned}
                disabled={selectedAvailable.size === 0}
                aria-label="Assign selected"
              >
                <ChevronRightIcon className="size-5" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-[62px] w-[62px] shrink-0 rounded-lg bg-[rgb(108,93,211)] hover:bg-[rgb(108,93,211)]/90"
                onClick={transferToAvailable}
                disabled={selectedAssigned.size === 0}
                aria-label="Unassign selected"
              >
                <ChevronLeftIcon className="size-5" />
              </Button>
            </div>

            <div className="min-w-[324px] rounded-lg border border-[#e5e5e5]">
              <div className={panelHeaderClass}>
                <span>Assigned permissions</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-normal opacity-90">All</span>
                  <Checkbox
                    checked={
                      assignedPermissions.length > 0 &&
                      selectedAssigned.size === assignedPermissions.length
                    }
                    onCheckedChange={(checked) =>
                      selectAllAssigned(checked === true)
                    }
                    className="size-4 border-white data-[state=checked]:border-white data-[state=checked]:bg-white"
                  />
                  <span className="text-xs font-normal opacity-90">
                    {assignedPermissions.length}
                  </span>
                </div>
              </div>
              <div className="min-h-[500px] p-1">
                  {assignedPermissions.map((name) => (
                    <div
                      key={name}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
                      onClick={() => toggleAssigned(name)}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm">{name}</span>
                      </div>
                      <Checkbox
                        checked={selectedAssigned.has(name)}
                        onCheckedChange={() => toggleAssigned(name)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-[rgb(108,93,211)] data-[state=checked]:border-[rgb(108,93,211)] data-[state=checked]:bg-[rgb(108,93,211)]"
                      />
                    </div>
                  ))}
                  {assignedPermissions.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No permissions assigned
                    </p>
                  )}
                </div>
            </div>
          </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-[50px] min-w-[98px] border-[#DADADA] bg-[#DADADA] px-5 py-2.5 text-black hover:bg-[#d1d1d1]"
              onClick={() => handleOpenChange(false)}
            >
              Exit
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[50px] min-w-[98px] bg-[rgb(108,93,211)] px-5 py-2.5 text-white hover:bg-[rgb(108,93,211)]/90"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
