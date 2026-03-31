import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { departmentUpsertSchema } from "../schemas"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, CheckCircle2, X, Search, ChevronDown, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useAddDepartment } from "../mutations/addDepartment"
import { useUpdateDepartment } from "../mutations/updateDepartment"
import { MOCK_CONTACTS, DEFAULT_VALUES } from "../queries/getDepartments"
import { useGetDepartmentById } from "../queries/getDepartmentById"
import { useGetMasterCodeOptions } from "../queries/getMasterCodeOptions"
import { departmentKeys } from "../keys"
import { 
    type Department,
    type DepartmentAddPageProps, 
    type DepartmentUpsertValues,
    type ActiveTab,
    type DetailsTab,
    type PendingTabChange,
    type ModifiedContacts,
    type HandleTabChange,
    type HandleDetailsTabChange,
    DETAIL_TABS
} from "../types"

export function DepartmentAddPage({ id, onClose }: DepartmentAddPageProps) {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<ActiveTab>("details")
    const [detailsTab, setDetailsTab] = useState<DetailsTab>(() => (id ? "primary" : "address"))
    const [showSummaryErrors, setShowSummaryErrors] = useState(false)
    const [isDepartmentSaved, setIsDepartmentSaved] = useState(!!id)
    const [departmentId, setDepartmentId] = useState<string | null>(id)
    const [showCreateConfirm, setShowCreateConfirm] = useState(false)
    const [showSaveContactConfirm, setShowSaveContactConfirm] = useState(false)
    const [pendingTabChange, setPendingTabChange] = useState<PendingTabChange | null>(null)
    const [modifiedContacts, setModifiedContacts] = useState<ModifiedContacts>({
        address: false, primary: false, secondary: false, billing: false
    })

    const [isMultiCodesOpen, setIsMultiCodesOpen] = useState(false)
    const [multiCodesSearch, setMultiCodesSearch] = useState("")

    const departmentQuery = useGetDepartmentById(departmentId)
    const existingDept = departmentQuery.data
    const isLoadingDept = departmentQuery.isLoading

    const masterCodesQuery = useGetMasterCodeOptions()
    const masterCodeOptions = masterCodesQuery.data ?? []
    const isLoadingMasterCodes = masterCodesQuery.isLoading || masterCodesQuery.isFetching
    const masterCodesErrorMessage =
        masterCodesQuery.error instanceof Error
            ? masterCodesQuery.error.message
            : masterCodesQuery.isError
              ? "Failed to load master codes"
              : null

    const valuesFromDepartmentQuery = useMemo((): DepartmentUpsertValues | undefined => {
        if (!departmentId || !existingDept) return undefined
        const { id: _deptId, ...rest } = existingDept
        return rest
    }, [departmentId, existingDept])

    const addDeptMutation = useAddDepartment()
    const updateDeptMutation = useUpdateDepartment()

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        getValues,
        trigger,
        setError,
        formState: { errors },
    } = useForm<DepartmentUpsertValues>({
        resolver: zodResolver(departmentUpsertSchema),
        defaultValues: DEFAULT_VALUES,
        values: valuesFromDepartmentQuery,
    })

    // Watch values for controlled components like Checkbox
    const active = watch("active")
    const settings = watch("settings")
    const currentCode = watch("code")
    const currentName = watch("name")

    const handleSave = async (opts?: { toastMode?: "none" | "createOrUpdate" }): Promise<boolean> => {
        if (addDeptMutation.isPending || updateDeptMutation.isPending) return false
        const toastMode = opts?.toastMode ?? "createOrUpdate"

        const values = getValues()
        if (departmentId) {
            try {
                await updateDeptMutation.mutateAsync({ id: departmentId, values })
                if (toastMode === "createOrUpdate") {
                    toast(
                        <div className="flex items-center gap-2 text-[14px]">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Department Updated Successfully
                        </div>
                    )
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update department")
            }
            return true
        }
        try {
            const created = await addDeptMutation.mutateAsync(values)
            if (toastMode === "createOrUpdate") {
                toast(
                    <div className="flex items-center gap-2 text-[14px]">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Department Created Successfully
                    </div>
                )
            }
            const nextId = String(created.id)
            const optimisticDept: Department = {
                id: nextId,
                code: values.code.trim(),
                name: values.name.trim(),
                active: values.active,
                address: values.address,
                primaryContact: values.primaryContact,
                secondaryContact: values.secondaryContact,
                billingContact: values.billingContact,
                settings: values.settings,
            }
            queryClient.setQueryData(departmentKeys.detail(nextId), optimisticDept)
            setDepartmentId(nextId)
            setIsDepartmentSaved(true)
            return true
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to create department"
            toast.error(message)
            if (message.toLowerCase().includes("code already exists")) {
                setError("code", { type: "manual", message })
            }
            return false
        }
    }

    const handleActualSave = async () => {
        setShowCreateConfirm(false)
        const ok = await handleSave()
        if (!ok) return
        setActiveTab("details")
        setDetailsTab("primary")
    }

    const handleExit = () => {
        if (isDepartmentSaved) {
            void handleSave()
        }
        onClose()
    }

    const onSubmit = (_data: DepartmentUpsertValues) => {
        // If we're on the settings tab and submitting the main form
        if (activeTab === "settings") {
            setShowCreateConfirm(true)
        }
    }

    const CONTACT_FIELD_MAP = {
        primary: "primaryContact",
        secondary: "secondaryContact",
        billing: "billingContact"
    } as const

    const onContactSave = async () => {
        if (detailsTab === "address") return
        
        const contactKey = CONTACT_FIELD_MAP[detailsTab]
        const isValid = await trigger([
            `${contactKey}.name` as const,
            `${contactKey}.email` as const,
            `${contactKey}.phone` as const
        ])

        if (!isValid) return

        const titleCaseTab = detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)
        toast(
            <div className="flex items-center gap-2 text-[14px]">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {titleCaseTab} Contact {id ? "Updated" : "Saved"} Successfully
            </div>
        )
        setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, [detailsTab]: false }))
        
        if (detailsTab === "primary") setDetailsTab("secondary")
        else if (detailsTab === "secondary") setDetailsTab("billing")

        // Only persist to backend after the department exists (created) or in edit mode.
        if (departmentId) {
            void handleSave({ toastMode: "none" })
        }
    }

    const onAddressSave = async () => {
        const isValid = await validateDetailsTab()
        if (!isValid) return
        toast(
            <div className="flex items-center gap-2 text-[14px]">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Address {id ? "Updated" : "Saved"} Successfully
            </div>
        )
        setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: false }))
        setIsDepartmentSaved(true)

        // IMPORTANT: Do not call the backend on "Next".
        // We only create/update the department when the user clicks Save on the Settings tab.
        // This prevents premature creates and ensures the payload is sent once (with settings + address).
        setDetailsTab("primary")
        if (!id) setActiveTab("settings")
    }

    const handleConfirmContactSave = () => {
        onContactSave()
        setShowSaveContactConfirm(false)
        if (pendingTabChange) {
            if (pendingTabChange.type === 'active') setActiveTab(pendingTabChange.value as ActiveTab)
            else setDetailsTab(pendingTabChange.value as DetailsTab)
            setPendingTabChange(null)
        }
    }

    const validateDetailsTab = async () => {
        const isValid = await trigger([
            "code", "name", "address.street", "address.city", "address.state", "address.zip"
        ])
        if (!isValid) {
            setShowSummaryErrors(true)
            return false
        }
        setShowSummaryErrors(false)
        return true
    }

    const handleTabChange: HandleTabChange = async (value) => {
        if (detailsTab !== "address" && modifiedContacts[detailsTab]) {
            setPendingTabChange({ type: 'active', value: value as ActiveTab })
            setShowSaveContactConfirm(true)
            return
        }

        if (value === "settings") {
            const isValid = await validateDetailsTab()
            if (!isValid) return
        }
        if (value === "details" && (departmentId != null || isDepartmentSaved)) {
            setDetailsTab("primary")
        }
        setActiveTab(value as ActiveTab)
    }



    const handleDetailsTabChange: HandleDetailsTabChange = (tabId) => {
        if (tabId !== "address" && !isDepartmentSaved) return
        if (detailsTab !== "address" && modifiedContacts[detailsTab] && tabId !== detailsTab) {
            setPendingTabChange({ type: 'details', value: tabId })
            setShowSaveContactConfirm(true)
            return
        }
        setDetailsTab(tabId)
    }

    return (
        <>
            <Dialog open onOpenChange={(open) => { if (!open) handleExit() }}>
            <DialogContent className="max-w-[893px] p-0 max-h-[90vh] overflow-y-auto border-none shadow-2xl rounded-[12px] bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <DialogHeader className="bg-white px-6 py-4 text-center">
                    <DialogTitle className="text-center text-[22px] font-[600] text-[#111827]">
                        {id ? "Edit Department" : "Add Department"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <div className="px-6 py-4">
                            <TabsList className="grid !h-[62px] w-full grid-cols-2 items-stretch gap-0 overflow-hidden rounded-[6px] border border-[#E5E7EB] bg-white p-0">
                                <TabsTrigger
                                    value="details"
                                    className="h-full rounded-[8px] border-0 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=inactive]:text-[#9CA3AF] font-[500] text-[17px] transition-all shadow-none"
                                >
                                    Department Details
                                </TabsTrigger>
                                <TabsTrigger
                                    value="settings"
                                    disabled={!!id || isLoadingDept}
                                    className="h-full rounded-[8px] border-0 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=inactive]:text-[#9CA3AF] font-[500] text-[17px] transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Department Settings
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="details" className="mt-0">
                            <div className="px-8 pb-8 space-y-6">
                                {/* Header Row: Code, Name, Active */}
                                <div className="flex items-start justify-between gap-6 relative">
                                    <div className="w-[180px] space-y-2 mt-15">
                                        <Label htmlFor="code" className="text-[13px] font-[500] text-[#374151]">
                                            *Code
                                        </Label>
                                        <Input
                                            id="code"
                                            placeholder="Code"
                                            {...register("code")}
                                            className="h-[57px] rounded-[8px] border-[#E5E7EB] focus:ring-1 focus:ring-[#6C5DD3]"
                                        />
                                        {errors.code && <p className="text-[12px] text-red-500">{errors.code.message}</p>}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="name" className="text-[13px] font-[500] text-[#374151] mt-15">
                                            *Department
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="Enter Department"
                                            {...register("name")}
                                            className="h-[57px] w-full rounded-[8px] border-[#E5E7EB] focus:ring-1 focus:ring-[#6C5DD3]"
                                        />
                                        {errors.name && <p className="text-[12px] text-red-500">{errors.name.message}</p>}
                                    </div>
                                    <div className="pt-10 flex items-center gap-2">
                                        <Checkbox
                                            id="active"
                                            checked={active}
                                            onCheckedChange={(val) => setValue("active", !!val)}
                                            className="h-[20px] w-[20px] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:border-[#6C5DD3]"
                                        />
                                        <Label htmlFor="active" className="text-[15px] font-[500] text-[#374151]">Active</Label>
                                    </div>
                                </div>

                                {/* Sub-Tabs: Address, Contacts */}
                                <div className="space-y-6 pt-4">
                                    <div className="flex gap-2 p-1 bg-transparent w-full">
                                        {DETAIL_TABS.map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => handleDetailsTabChange(tab.id)}
                                                style={{ width: tab.width }}
                                                className={`h-[60px] rounded-[6px] text-[15px] font-[500] flex items-center justify-center gap-2 transition-all ${detailsTab === tab.id
                                                        ? "bg-[#6C5DD3] text-white shadow-md cursor-default"
                                                        : (tab.id !== "address" && !isDepartmentSaved) ? "bg-[#F3F4F6] text-[#6C5DD3] border border-[#E5E7EB] cursor-not-allowed" : "bg-white text-[#6C5DD3] border border-[#E5E7EB] cursor-pointer"
                                                    }`}
                                                disabled={tab.id !== "address" && !isDepartmentSaved}
                                            >
                                                {tab.label}
                                                {(tab.id !== "address") && (
                                                    <TooltipProvider delayDuration={100}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button type="button" className="flex items-center -ml-1 h-5 w-5 bg-transparent border-0 outline-none hover:bg-transparent">
                                                                    <HelpCircle className="h-5 w-5 opacity-70 cursor-pointer" />
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent 
                                                                side="top"
                                                                className="bg-[#1f2937] text-white rounded-[6px] px-3 py-2 text-[13px] border-0 text-center leading-relaxed font-normal"
                                                            >
                                                                Please make sure user has created<br />before adding {tab.label}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Sub-Tab Content */}
                                    <div className="min-h-[220px] pt-4">
                                        {detailsTab === "address" && (
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*Street</Label>
                                                    <Input
                                                        placeholder="Enter Street"
                                                        {...register("address.street")}
                                                        onChange={(e) => {
                                                            register("address.street").onChange(e);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*City</Label>
                                                    <Input
                                                        placeholder="Enter City"
                                                        {...register("address.city")}
                                                        onChange={(e) => {
                                                            register("address.city").onChange(e);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*State</Label>
                                                    <Input
                                                        placeholder="Enter State"
                                                        {...register("address.state")}
                                                        onChange={(e) => {
                                                            register("address.state").onChange(e);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">*Zip</Label>
                                                    <Input
                                                        placeholder="Enter Zip min 3 digits"
                                                        {...register("address.zip")}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, '');
                                                            setValue("address.zip", val);
                                                            setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, address: true }));
                                                        }}
                                                        className="h-[57px] rounded-[8px] border-[#E5E7EB]"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {(detailsTab === "primary" || detailsTab === "secondary" || detailsTab === "billing") && (
                                            <div key={detailsTab} className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">
                                                        {detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)} Contact Name
                                                    </Label>
                                                    <Select
                                                        value={watch(`${CONTACT_FIELD_MAP[detailsTab]}.name` as const) || undefined}
                                                        onValueChange={(val) => {
                                                            const contact = MOCK_CONTACTS.find(c => c.name === val)
                                                            if (contact) {
                                                                const key = CONTACT_FIELD_MAP[detailsTab]
                                                                setValue(`${key}.name` as const, contact.name, { shouldValidate: true })
                                                                setValue(`${key}.phone` as const, contact.phone)
                                                                setValue(`${key}.email` as const, contact.email)
                                                                setValue(`${key}.location` as const, contact.location)
                                                                setModifiedContacts((prev: ModifiedContacts) => ({ ...prev, [detailsTab]: true }))
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger style={{ height: '57px' }} className="w-full rounded-[8px] border-[#E5E7EB] text-[#111827] focus:ring-1 focus:ring-[#3B82F6] data-[state=open]:border-[#3B82F6]">
                                                            <SelectValue placeholder={`Select Contact Name`} />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[8px] shadow-[0_4px_16px_#00000024] p-1 border-[#E5E7EB] z-50">
                                                            {MOCK_CONTACTS.map(c => (
                                                                <SelectItem 
                                                                    key={c.name} 
                                                                    value={c.name}
                                                                    className="h-[42px] px-3 font-[400] text-[14px] text-[#111827] focus:bg-[#EBF5FF] focus:text-[#111827] cursor-pointer rounded-[6px]"
                                                                >
                                                                    {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">Mobile</Label>
                                                    <Input
                                                        readOnly
                                                        placeholder="Enter Mobile"
                                                        {...register(`${CONTACT_FIELD_MAP[detailsTab]}.phone` as const)}
                                                        className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">Email</Label>
                                                    <Input
                                                        readOnly
                                                        placeholder="Enter Email"
                                                        {...register(`${CONTACT_FIELD_MAP[detailsTab]}.email` as const)}
                                                        className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[14px] font-[500] text-[#374151]">Location</Label>
                                                    <Input
                                                        readOnly
                                                        placeholder="Enter Location"
                                                        {...register(`${CONTACT_FIELD_MAP[detailsTab]}.location` as const)}
                                                        className="h-[57px] rounded-[8px] bg-[#F9FAFB] cursor-not-allowed border-[#E5E7EB] text-[#111827] focus-visible:ring-0 focus-visible:ring-offset-0"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {showSummaryErrors && (
                                    <div className="flex flex-col items-center justify-center gap-[2px] pt-2 text-[14px] font-[500] text-red-500">
                                        {errors.code && <p>Please fill the Code</p>}
                                        {errors.name && <p>Please fill the Department Name</p>}
                                        {(errors.address?.street || errors.address?.city || errors.address?.state) && <p>Please fill the Fields</p>}
                                        {errors.address?.zip && <p>Zip code must be at least 3 digits</p>}
                                    </div>
                                )}

                                <div className="flex justify-end gap-4 pt-8">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (detailsTab === "address") onAddressSave()
                                            else onContactSave()
                                        }}
                                        className="w-[140px] h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        {detailsTab === "address" && !isDepartmentSaved ? "Next" : "Save"}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleExit}
                                        className="w-[140px] h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        Exit
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="mt-0">
                            <div className="px-8 pb-8">
                                <div className="grid grid-cols-1 gap-5 py-8 min-h-[300px]">
                                    {[
                                        { key: "apportioning", label: "Apportioning" },
                                        { key: "costAllocation", label: "Cost Allocation" },
                                        { key: "autoApportioning", label: "Auto Apportioning" },
                                        { key: "allowUserCostpoolDirect", label: "Allow User/Costpool Direct" },
                                        { key: "allowMultiCodes", label: "Allow MultiCodes" },
                                        { key: "removeStartEndTime", label: "Remove Start and End Time" },
                                        { key: "removeSupportingDocument", label: "Remove Supporting Document" },
                                        { key: "removeAutoFillEndTime", label: "Remove Auto Fill End Time" },
                                    ].map((setting) => (
                                        <div key={setting.key} className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <Checkbox
                                                    id={setting.key}
                                                    checked={!!settings[setting.key as keyof typeof settings]}
                                                    onCheckedChange={(val) => {
                                                        const isChecked = !!val
                                                        const fieldPath = `settings.${setting.key}` as const
                                                        setValue(fieldPath as any, isChecked)
                                                        if (setting.key === "apportioning" && isChecked) {
                                                            setValue("settings.autoApportioning", true)
                                                        }
                                                    }}
                                                    className="h-[22px] w-[22px] data-[state=checked]:bg-[#6C5DD3] data-[state=checked]:border-[#6C5DD3]"
                                                />
                                                <Label htmlFor={setting.key} className="text-[16px] font-[400] text-[#374151]">
                                                    {setting.label}
                                                </Label>
                                            </div>

                                            {setting.key === "allowMultiCodes" && settings.allowMultiCodes && (
                                                <div className="ml-9 mt-2">
                                                    <div className="relative w-[300px]">
                                                        <div 
                                                            className="flex min-h-[44px] w-full items-center gap-1 rounded-[10px] border border-[#D1D5DB] bg-white px-3 py-1 cursor-pointer"
                                                            onClick={() => setIsMultiCodesOpen(!isMultiCodesOpen)}
                                                        >
                                                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                                                {(() => {
                                                                    const selected = (settings.multiCodes || "").split(",").filter(Boolean);
                                                                    return selected.length > 0 ? selected.map((code) => (
                                                                        <span
                                                                            key={code}
                                                                            className="inline-flex items-center gap-1 rounded-[6px] bg-[#F3F4F6] px-2 py-1 text-[14px] text-[#111827]"
                                                                        >
                                                                            <span className="truncate">{code}</span>
                                                                            <button
                                                                                type="button"
                                                                                className="text-[#9CA3AF] hover:text-[#6C5DD3]"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    const current = (settings.multiCodes || "").split(",")
                                                                                    const next = current.filter(c => c !== code).join(",")
                                                                                    setValue("settings.multiCodes", next)
                                                                                }}
                                                                            >
                                                                                <X className="size-3.5" />
                                                                            </button>
                                                                        </span>
                                                                    )) : (
                                                                        <span className="text-[#9CA3AF] text-[14px]">Select multi codes</span>
                                                                    )
                                                                })()}
                                                            </div>
                                                            <div className="flex items-center gap-2 border-l border-[#E5E7EB] pl-2">
                                                                <Search className="size-4 text-[#C4C4C4]" />
                                                                <ChevronDown className={`size-4 text-[#9CA3AF] transition-transform ${isMultiCodesOpen ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </div>

                                                        {isMultiCodesOpen && (
                                                            <div className="absolute top-[calc(100%+4px)] z-50 w-full rounded-[14px] border border-[#E5E7EB] bg-white p-2 shadow-[0_8px_24px_#0000001A]">
                                                                <div className="mb-2 px-2 py-1">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]" />
                                                                        <Input 
                                                                            className="h-9 pl-9 text-[14px] focus-visible:ring-0 focus-visible:ring-offset-0 border-[#E5E7EB] rounded-[8px]"
                                                                            placeholder="Search..."
                                                                            value={multiCodesSearch}
                                                                            onChange={(e) => setMultiCodesSearch(e.target.value)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="max-h-[200px] overflow-auto space-y-1">
                                                                    {masterCodesQuery.isError && masterCodesErrorMessage && (
                                                                        <div className="px-3 py-2 text-[13px] text-red-600">
                                                                            {masterCodesErrorMessage}
                                                                        </div>
                                                                    )}
                                                                    {isLoadingMasterCodes && (
                                                                        <div className="px-3 py-2 text-[13px] text-[#6B7280]">
                                                                            Loading...
                                                                        </div>
                                                                    )}
                                                                    {!isLoadingMasterCodes && !masterCodesQuery.isError && masterCodeOptions.length === 0 && (
                                                                        <div className="px-3 py-2 text-[13px] text-[#6B7280]">
                                                                            No master codes found
                                                                        </div>
                                                                    )}
                                                                    {(isLoadingMasterCodes ? [] : masterCodeOptions)
                                                                        .filter(opt => opt.toLowerCase().includes(multiCodesSearch.toLowerCase()))
                                                                        .map((opt) => {
                                                                            const isSelected = (settings.multiCodes || "").split(",").includes(opt)
                                                                            return (
                                                                                <button
                                                                                    key={opt}
                                                                                    type="button"
                                                                                    className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-left text-[14px] hover:bg-[#F3F4F6]"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        const current = settings.multiCodes ? settings.multiCodes.split(",") : []
                                                                                        let next: string[]
                                                                                        if (isSelected) {
                                                                                            next = current.filter(c => c !== opt)
                                                                                        } else {
                                                                                            next = [...current, opt]
                                                                                        }
                                                                                        setValue("settings.multiCodes", next.join(","))
                                                                                    }}
                                                                                >
                                                                                    <span className={isSelected ? "font-[500] text-[#6C5DD3]" : ""}>{opt}</span>
                                                                                    {isSelected && <Check className="size-4 text-[#6C5DD3]" />}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-4 pt-10">
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            const isValid = await trigger([
                                                "code", "name", "address.street", "address.city", "address.state", "address.zip"
                                            ])
                                            if (isValid) {
                                                setShowCreateConfirm(true)
                                            } else {
                                                setActiveTab("details")
                                                setShowSummaryErrors(true)
                                            }
                                        }}
                                        className="w-[140px] h-[50px] bg-[#6C5DD3] hover:bg-[#5B4DC5] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleExit}
                                        className="w-[140px] h-[50px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px] text-[16px] font-[500]"
                                    >
                                        Exit
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </form>
            </DialogContent>
        </Dialog>
        <Dialog open={showCreateConfirm} onOpenChange={setShowCreateConfirm}>
            <DialogContent className="max-w-[440px] p-6 rounded-[12px] bg-white border-0 shadow-lg">
                <DialogTitle className="text-[16px] font-[600] text-[#111827]">
                    Create Department
                </DialogTitle>
                <div className="text-[14px] text-[#374151] mt-2 leading-relaxed">
                    Are you sure do you want to create a department with<br />
                    code: {currentCode}<br />
                    name: {currentName} ?
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <Button
                        type="button"
                        onClick={() => setShowCreateConfirm(false)}
                        className="w-[100px] h-[40px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleActualSave}
                        className="w-[100px] h-[40px] bg-[#6C5DD3] hover:bg-[#5B4DC5] text-white rounded-[8px]"
                    >
                        OK
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={showSaveContactConfirm} onOpenChange={(open) => {
            setShowSaveContactConfirm(open)
            if (!open) setPendingTabChange(null)
        }}>
            <DialogContent className="max-w-[440px] p-6 rounded-[12px] bg-white border-0 shadow-lg">
                <DialogTitle className="sr-only">Confirm Save</DialogTitle>
                <div className="text-center text-[15px] text-[#111827] mt-2 font-[500]">
                    You have modified on {detailsTab.charAt(0).toUpperCase() + detailsTab.slice(1)} Contact do you want to save it?
                </div>
                <div className="flex justify-center gap-4 mt-6">
                    <Button
                        type="button"
                        onClick={() => {
                            setShowSaveContactConfirm(false)
                            setPendingTabChange(null)
                        }}
                        className="w-[100px] h-[40px] bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#374151] rounded-[8px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirmContactSave}
                        className="w-[100px] h-[40px] bg-[#6C5DD3] hover:bg-[#5B4DC5] text-white rounded-[8px]"
                    >
                        OK
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}
