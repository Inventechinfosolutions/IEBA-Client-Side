import { ChevronDown, ChevronLeft } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

import type { SettingsSection } from "@/features/settings/types"
import { CountyForm } from "@/features/settings/components/Country/CountyForm"
import { AutoGenerateCodeForm } from "@/features/settings/components/AutoGenerateCode/AutoGenerateCodeForm"
import { PayrollForm } from "@/features/settings/components/Payroll/PayrollForm"
import { FiscalYearForm } from "@/features/settings/components/FiscalYear/FiscalYearForm"
import { ReportsForm } from "@/features/settings/components/Reports/ReportsForm"
import { GeneralForm } from "@/features/settings/components/General/GeneralForm"
import { LoginForm } from "@/features/settings/components/Login/LoginForm"

const sections: SettingsSection[] = [
  "County",
  "Auto Generate Code",
  "Payroll",
  "Fiscal Year",
  "Reports",
  "General",
  "Login",
]

export function SettingsAccordion({ isSaving }: { isSaving: boolean }) {
  return (
    <div className="rounded-[8px] bg-white">
      <Accordion
        type="single"
        collapsible
      >
        {sections.map((section) => (
          <AccordionItem
            key={section}
            value={section}
            className="border-b-0 not-last:border-b-0"
          >
            <AccordionTrigger
              className={cn(
                "rounded-none px-4 py-4 hover:no-underline",
                "**:data-[slot=accordion-trigger-icon]:hidden"
              )}
            >
              <div className="flex w-full items-center gap-3">
                <span className="min-w-[160px] text-left text-[14px] font-bold text-[var(--primary)]">
                  {section}
                </span>
                <span className="h-[2.5px] flex-1 bg-[#d8d9dc]" />
                <span className="inline-flex size-7 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-white text-[var(--primary)]">
                  <ChevronLeft
                    strokeWidth={3}
                    className="size-5 group-aria-expanded/accordion-trigger:hidden"
                  />
                  <ChevronDown
                    strokeWidth={3}
                    className="size-5 hidden group-aria-expanded/accordion-trigger:block"
                  />
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-2 pt-2">
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

