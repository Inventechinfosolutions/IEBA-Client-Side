import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"

import { PayrollFrequency } from "../types"
import type {
  GetPayrollRowsParams,
  PayrollDetailsFormValues,
  PayrollFilterOptionsResponse,
} from "../types"

export function buildPayrollDetailsDefaultValues(
  _options: PayrollFilterOptionsResponse,
  payrollType: PayrollDetailsFormValues["payrollType"] = PayrollFrequency.BI_WEEKLY,
): PayrollDetailsFormValues {
  return {
    payrollType,
    fiscalYearId: "",
    periodType: "month",
    monthOrQuarterId: "m-all",
    departmentId: "",
    employeeIdsSerialized: "",
  }
}

export function mapPayrollDetailsFormToQueryParams(
  values: PayrollDetailsFormValues,
  options: PayrollFilterOptionsResponse,
): GetPayrollRowsParams {
  const employeeIds = [...parseMultiSelectStoredValues(values.employeeIdsSerialized)].sort()

  const fiscalYearLabel = options.fiscalYears.find((f) => f.value === values.fiscalYearId)?.label ?? ""
  const selectedDept = options.departments.find((d) => String(d.value) === String(values.departmentId))
  const departmentCode = (selectedDept?.metadata?.code as string) ?? ""
  
  return {
    payrollType: values.payrollType,
    fiscalYearId: values.fiscalYearId,
    fiscalYearLabel,
    periodType: values.periodType,
    monthOrQuarterId: values.monthOrQuarterId,
    departmentId: values.departmentId,
    departmentCode: departmentCode || "all",
    employeeIds,
  }
}
