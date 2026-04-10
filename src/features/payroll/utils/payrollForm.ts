import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"

import { PayrollFrequency } from "../types"
import type {
  GetPayrollRowsParams,
  PayrollDetailsFormValues,
  PayrollFilterOptionsResponse,
} from "../types"

export function buildPayrollDetailsDefaultValues(
  _options: PayrollFilterOptionsResponse,
): PayrollDetailsFormValues {
  return {
    payrollType: PayrollFrequency.BI_WEEKLY,
    fiscalYearId: "",
    periodType: "month",
    monthOrQuarterId: "",
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
  const departmentCode = (options.departments.find((d) => d.value === values.departmentId)?.metadata?.code as string) ?? ""

  return {
    payrollType: values.payrollType,
    fiscalYearId: values.fiscalYearId,
    fiscalYearLabel,
    periodType: values.periodType,
    monthOrQuarterId: values.monthOrQuarterId,
    departmentId: values.departmentId,
    departmentCode,
    employeeIds,
  }
}
