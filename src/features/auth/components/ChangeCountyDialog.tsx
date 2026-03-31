import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, Search, CircleCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { setToken } from "@/lib/api"

import iebaLogo from "@/assets/ieba-logo.png"
import { useGlobalNamespaces } from "../queries/getGlobalNamespaces"
import { useChangeCounty } from "../mutations/useChangeCounty"

type ChangeCountyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangeCountyDialog({
  open,
  onOpenChange,
}: ChangeCountyDialogProps) {
  const { user, establishDashboardSession } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedNameSpace, setSelectedNameSpace] = useState<string | undefined>(
    () => user?.namespace
  )
  const [countyError, setCountyError] = useState(false)
  const [countyDropdownOpen, setCountyDropdownOpen] = useState(false)
  const [countySearch, setCountySearch] = useState("")

  const namespacesQuery = useGlobalNamespaces(open)
  const changeCountyMutation = useChangeCounty()

  const rows = namespacesQuery.data ?? []

  const selectedCountyLabel = useMemo(() => {
    const match = rows.find((row) => row.nameSpace === selectedNameSpace)
    return match?.countyName
  }, [rows, selectedNameSpace])

  const filteredCountyOptions = useMemo(
    () =>
      rows.filter((row) =>
        row.countyName.toLowerCase().includes(countySearch.toLowerCase())
      ),
    [rows, countySearch]
  )

  function handleCancel() {
    onOpenChange(false)
  }

  function handleOk() {
    if (changeCountyMutation.isPending) return
    if (!user) {
      toast.error("You must be signed in to change county.")
      return
    }
    if (!selectedNameSpace) {
      setCountyError(true)
      return
    }

    const loginId = user.email.trim()

    changeCountyMutation.mutate(
      {
        loginId,
        nameSpace: selectedNameSpace,
      },
      {
        onSuccess: (result) => {
          setToken(result.accessToken)
          const countyName =
            selectedCountyLabel ??
            result.countyName ??
            user.countyName ??
            ""

          establishDashboardSession({
            ...user,
            namespace: result.namespace ?? selectedNameSpace,
            countyName,
          })

          onOpenChange(false)

          toast.success("County changed successfully", {
            icon: (
              <CircleCheckIcon className="size-4 shrink-0 text-green-600 dark:text-green-400" />
            ),
          })

          // Fast "refresh": clear cached data so screens refetch using the new token/tenant.
          queryClient.clear()
          navigate("/", { replace: true })
        },
        onError: (error) => {
          toast.error(error.message || "Failed to change county")
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/40"
        className="top-[31%] z-[60] w-[min(520px,92vw)] max-w-[92vw] border-0 bg-white p-0 shadow-lg sm:rounded-[6px] [&>button]:hidden"
      >
        <DialogHeader className="px-8 pt-10 sm:px-9">
          <DialogTitle>
            <div className="mb-3 flex w-full items-center justify-center gap-4">
              <img
                src={iebaLogo}
                alt="logo"
                className="h-[42px] w-[42px] object-contain"
              />
              <h3 className="text-[25px] font-normal leading-[1.05] text-[#000000E0]">
                SuperAdmin IEBA
              </h3>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="px-8 pb-10 pt-1 sm:px-9">
          <div className="mb-3 w-full">
            <h6 className="block text-left text-[16px] font-normal leading-tight text-[#000000E0]">
              Pick a county to proceed
            </h6>
          </div>
          <div className="flex w-full justify-center">
            <div className="relative w-full">
              {countyDropdownOpen ? (
                <div
                  className={`relative flex h-[54px] w-full items-center rounded-[14px] border bg-white ${
                    countyError
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-[#6C5DD3] ring-1 ring-[#6C5DD3]"
                  }`}
                >
                  <Input
                    value={countySearch}
                    onChange={(e) => setCountySearch(e.target.value)}
                    placeholder="Search county"
                    autoFocus
                    className="h-full border-0 bg-transparent pl-4 pr-11 text-[16px] shadow-none focus-visible:ring-0"
                  />
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00000040]" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCountyDropdownOpen(true)
                    setCountySearch("")
                  }}
                  className={`flex h-[54px] w-full items-center justify-between rounded-[14px] border bg-white px-4 text-left ${
                    countyError
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-[#d9d9d9]"
                  }`}
                >
                  <span
                    className={`text-[16px] ${
                      selectedNameSpace ? "text-[#000000D9]" : "text-[#00000073]"
                    }`}
                  >
                    {selectedCountyLabel ?? "Select county"}
                  </span>
                  <ChevronDown className="h-5 w-5 text-[#00000073]" />
                </button>
              )}

              {countyDropdownOpen && (
                <div className="absolute left-0 top-[66px] z-50 w-full overflow-hidden rounded-[14px] border border-[#d9d9d9] bg-white shadow-md">
                  <div className="max-h-[220px] overflow-y-auto py-1">
                    {namespacesQuery.isLoading && (
                      <div className="px-5 py-2 text-[15px] text-[#00000073]">
                        Loading counties…
                      </div>
                    )}
                    {namespacesQuery.isError && (
                      <div className="space-y-2 px-5 py-2">
                        <p
                          className="text-[15px] text-red-500"
                          role="alert"
                        >
                          {namespacesQuery.error instanceof Error
                            ? namespacesQuery.error.message
                            : "Failed to load counties"}
                        </p>
                        <button
                          type="button"
                          onClick={() => void namespacesQuery.refetch()}
                          className="text-sm text-[#6C5DD3] underline underline-offset-2"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {namespacesQuery.isSuccess &&
                      filteredCountyOptions.map((row) => (
                        <button
                          key={row.nameSpace}
                          type="button"
                          onClick={() => {
                            setSelectedNameSpace(row.nameSpace)
                            setCountyError(false)
                            setCountyDropdownOpen(false)
                            setCountySearch("")
                          }}
                          className={`block w-full px-5 py-1.5 text-left text-[16px] ${
                            selectedNameSpace === row.nameSpace
                              ? "bg-[#e6f4ff] font-semibold text-[#000000D9]"
                              : "text-[#000000D9] hover:bg-[#f5f5f5]"
                          }`}
                        >
                          {row.countyName}
                        </button>
                      ))}
                    {namespacesQuery.isSuccess &&
                      filteredCountyOptions.length === 0 && (
                        <div className="px-5 py-2 text-[15px] text-[#00000073]">
                          No county found
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {countyError && (
            <p
              className="mt-1.5 text-center text-xs text-red-500"
              role="alert"
            >
              Please select a county
            </p>
          )}
        </div>
        <div className="flex w-full items-center justify-center gap-3 px-8 pb-10 sm:px-9">
          <Button
            type="button"
            onClick={handleOk}
            disabled={changeCountyMutation.isPending}
            className="h-[35px] min-w-[62px] rounded-[6px] border-0 bg-[#6C5DD3] px-4 text-[15px] font-normal text-white hover:bg-[#5f52bd] disabled:opacity-60"
          >
            {changeCountyMutation.isPending ? "Saving…" : "OK"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-[35px] min-w-[86px] rounded-[6px] border border-[#d9d9d9] bg-white px-4 text-[15px] font-normal text-[#000000E0] hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

