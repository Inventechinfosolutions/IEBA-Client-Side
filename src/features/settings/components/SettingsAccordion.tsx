import { ChevronDown, ChevronLeft } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

import { SETTINGS_ACCORDION_SECTIONS } from "@/features/settings/types"
import { CountyForm } from "@/features/settings/components/Country/CountyForm"
import { AutoGenerateCodeForm } from "@/features/settings/components/AutoGenerateCode/AutoGenerateCodeForm"
import { PayrollForm } from "@/features/settings/payroll"
import { FiscalYearForm } from "@/features/settings/components/FiscalYear/FiscalYearForm"
import { ReportsForm } from "@/features/settings/components/Reports/ReportsForm"
import { GeneralForm } from "@/features/settings/components/General/GeneralForm"
import { LoginForm } from "@/features/settings/components/Login/LoginForm"

export function SettingsAccordion({
  isSaving,
  openSection,
  onOpenSectionChange,
}: {
  isSaving: boolean
  openSection: string | undefined
  onOpenSectionChange: (next: string | undefined) => void
}) {
  return (
    <div className="rounded-[8px] bg-white">
      <Accordion
        type="single"
        collapsible
        value={openSection}
        onValueChange={(next) => onOpenSectionChange(next || undefined)}
      >
        {SETTINGS_ACCORDION_SECTIONS.map((section) => (
          <AccordionItem
            key={section}
            value={section}
            className="border-0"
          >
            <AccordionTrigger
              className={cn(
                "cursor-pointer rounded-none border-0 px-0.5 py-4 hover:no-underline",
                "**:data-[slot=accordion-trigger-icon]:hidden"
              )}
            >
              <div className="flex w-full items-center gap-3">
                <span className="min-w-[160px] text-left text-[12px] font-bold text-[var(--primary)]">
                  {section}
                </span>
                <span className="h-0 flex-1 border-t-2 border-[#d8d9dc]" />
                <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-white text-[var(--primary)]">
                  <ChevronLeft
                    strokeWidth={3}
                    className="size-4 group-aria-expanded/accordion-trigger:hidden"
                  />
                  <ChevronDown
                    strokeWidth={3}
                    className="size-4 hidden group-aria-expanded/accordion-trigger:block"
                  />
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0.5pb-2 pt-2">
              {section === "County" ? (
                <CountyForm isSaving={isSaving} />
              ) : section === "Auto Generate Code" ? (
                <AutoGenerateCodeForm />
              ) : section === "Payroll" ? (
                <PayrollForm />
              ) : section === "Fiscal Year" ? (
                <FiscalYearForm />
              ) : section === "Reports" ? (
                <ReportsForm />
              ) : section === "General" ? (
                <GeneralForm />
              ) : (
                <LoginForm />
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

