import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"

import type {
  GetPayrollRowsParams,
  PayrollDetailsFormValues,
  PayrollFilterOptionsResponse,
} from "../types"

export function buildPayrollDetailsDefaultValues(
  options: PayrollFilterOptionsResponse,
): PayrollDetailsFormValues {
  const march = options.monthOptions.find((m) => m.value === "m-03")
  return {
    payrollType: "bi_weekly",
    fiscalYearId: options.fiscalYears[0]?.value ?? "",
    periodType: "month",
    monthOrQuarterId: march?.value ?? options.monthOptions[0]?.value ?? "",
    departmentId: "all",
    employeeIdsSerialized: "",
  }
}

export function mapPayrollDetailsFormToQueryParams(values: PayrollDetailsFormValues): GetPayrollRowsParams {
  const employeeIds = [...parseMultiSelectStoredValues(values.employeeIdsSerialized)].sort()
  return {
    payrollType: values.payrollType,
    fiscalYearId: values.fiscalYearId,
    periodType: values.periodType,
    monthOrQuarterId: values.monthOrQuarterId,
    departmentId: values.departmentId,
    employeeIds,
  }
}
