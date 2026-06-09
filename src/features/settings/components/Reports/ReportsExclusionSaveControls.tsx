// import { Controller, type Control } from "react-hook-form"

// import { Button } from "@/components/ui/button"
// import { Switch } from "@/components/ui/switch"
// import { Spinner } from "@/components/ui/spinner"
// import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
// import type { ReportsSaveScope, SettingsFormValues } from "@/features/settings/types"

// const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"

// export function ReportsExclusionSaveControls({
//   control,
//   modeField,
//   isSaving,
//   saveDisabled,
//   saveScope,
//   onExclusionModeChange,
// }: {
//   control: Control<SettingsFormValues>
//   modeField: "reports.masterCodeExclusionMode" | "reports.activityExclusionMode"
//   isSaving: boolean
//   saveDisabled: boolean
//   saveScope: ReportsSaveScope
//   onExclusionModeChange: (checked: boolean) => void
// }) {
//   return (
//     <div className="flex flex-col">
//       <label className={labelClassName}>Exclusion/Inclusion</label>
//       <div className="mt-[10px] flex items-center gap-3">
//         <Controller
//           name={modeField}
//           control={control}
//           render={({ field }) => (
//             <Switch
//               checked={field.value === "include"}
//               onCheckedChange={onExclusionModeChange}
//               className="data-checked:bg-[var(--primary)]"
//             />
//           )}
//         />
//         <Button
//           type="submit"
//           data-settings-section={SettingsFormSaveSection.Reports}
//           data-reports-save-scope={saveScope}
//           disabled={saveDisabled}
//           className="h-[38px] min-w-[88px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-4 text-[14px] font-medium text-white hover:bg-[var(--primary)] disabled:opacity-50"
//         >
//           {isSaving ? <Spinner className="text-white" /> : "Save"}
//         </Button>
//       </div>
//     </div>
//   )
// }
