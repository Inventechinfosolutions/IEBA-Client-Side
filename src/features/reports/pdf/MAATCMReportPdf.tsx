import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import { REPORT_PDF_DEFAULT_LOGOS } from "./reportPdfAssets"

import {
  ReportPdfFooter,
  ReportPdfHeader,
  resolvePagePadding,
} from "./ReportPdfChrome"
import {
  buildMaatcmActivityNameByCode,
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatReportTime,
  getMaatcmDayTotal,
  getMaatcmDayValue,
  getMaatcmGrandTotal,
  hoursByCodeForMaatcmEmployee,
  isMaatcmSummaryEmployee,
  maatcmPivotPeriodDisplay,
  normMaatcmEmployeeTypes,
  resolveFooterVariant,
  resolveReportTitle,
  sortMaatcmCodesAsc,
  type MaatcmEmployee,
  type MAATCMReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const AQUA = "#7FFFD4"
const TABLE_WIDTH = 1150

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 6,
  },
  content: {
    flexGrow: 1,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    width: TABLE_WIDTH,
  },
  detailsColumn: {
    width: 250,
  },
  detailsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    marginBottom: 4,
  },
  aquaBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 6,
  },
  aquaBox: {
    backgroundColor: AQUA,
    borderWidth: 1,
    borderColor: "#000000",
    width: 72,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  aquaBoxText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
  },
  aquaBoxLabel: {
    fontSize: 6.5,
  },
  monthYearCol: {
    alignItems: "flex-end",
  },
  monthYearBox: {
    borderWidth: 1,
    borderColor: "#000000",
    width: 72,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontSize: 6.5,
    textAlign: "center",
  },
  infoTable: {
    width: TABLE_WIDTH,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#000000",
  },
  infoRow: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  infoHeader: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
  },
  infoCell: {
    flex: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontSize: 6.5,
  },
  gridRow: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  gridHeader: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "rgb(219, 219, 219)",
    padding: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textAlign: "center",
  },
  gridCell: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 2,
    fontSize: 5.5,
    textAlign: "center",
  },
  gridCellRight: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 2,
    fontSize: 5.5,
    textAlign: "right",
  },
  gridCellLeft: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 2,
    fontSize: 5.5,
    textAlign: "left",
  },
  aquaSpacer: {
    backgroundColor: AQUA,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
  },
  totalsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textAlign: "center",
    padding: 4,
  },
  pivotHeader: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: AQUA,
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textAlign: "center",
  },
  pivotCodeHead: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: AQUA,
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textAlign: "center",
  },
  pivotCodeName: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#e8fff8",
    padding: 3,
    fontSize: 5,
    textAlign: "center",
  },
  pivotCell: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 3,
    fontSize: 5.5,
    textAlign: "center",
  },
  pivotEmpCell: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 3,
    fontSize: 5.5,
    textAlign: "left",
  },
  pivotEmpSub: {
    fontSize: 5,
    color: "#333333",
    marginTop: 2,
  },
  signatureRow: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#000000",
  },
  signatureCell: {
    width: TABLE_WIDTH / 2,
    borderRightWidth: 1,
    borderColor: "#000000",
    padding: 12,
    fontSize: 5.5,
  },
  signatureLineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    width: 120,
    marginTop: 8,
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function MaatcmSignatureBlock() {
  return (
    <View style={styles.signatureRow} wrap={false}>
      <View style={styles.signatureCell}>
        <Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Employee:</Text> I certify that this a true and
          accurate report of my time and the activities were performed as shown.
        </Text>
        <View style={styles.signatureLineRow}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Employee&apos;s Signature(BLUE INK ONLY):</Text>
          <View style={styles.signatureLine} />
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Date:</Text>
          <View style={styles.signatureLine} />
        </View>
      </View>
      <View style={[styles.signatureCell, { borderRightWidth: 0 }]}>
        <Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Supervisor:</Text> I certify that the employee&apos;s
          time records have been examined and that,to the best of my knowledge and belief,this time record is
          true and correct and the activities were performed as shown.
        </Text>
        <View style={styles.signatureLineRow}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Supervisor&apos;s Signature(BLUE INK ONLY):</Text>
          <View style={styles.signatureLine} />
          <Text style={{ fontFamily: "Helvetica-Bold" }}>Date:</Text>
          <View style={styles.signatureLine} />
        </View>
      </View>
    </View>
  )
}

function MaatcmDetailsHeader({
  activityCodeTypes,
  spmptotal,
  nonspmptotal,
  month,
  year,
}: {
  activityCodeTypes: string[]
  spmptotal: number
  nonspmptotal: number
  month: string | number
  year: string | number
}) {
  const typesNorm = activityCodeTypes.map((type) => type.toUpperCase())
  const showMAA = typesNorm.includes("MAA")
  const showTCM = typesNorm.includes("TCM")

  return (
    <View style={styles.detailsRow}>
      {showMAA ? (
        <View style={styles.detailsColumn}>
          <Text style={styles.detailsLabel}>MAA</Text>
          <View style={styles.aquaBoxRow}>
            <View style={styles.aquaBox}>
              <Text style={styles.aquaBoxText}>{formatReportTime(spmptotal)}</Text>
            </View>
            <Text style={styles.aquaBoxLabel}>SPMP</Text>
          </View>
          <View style={styles.aquaBoxRow}>
            <View style={styles.aquaBox}>
              <Text style={styles.aquaBoxText}>{formatReportTime(nonspmptotal)}</Text>
            </View>
            <Text style={styles.aquaBoxLabel}>Non-SPMP</Text>
          </View>
          <View style={styles.aquaBoxRow}>
            <View style={styles.aquaBox} />
            <Text style={styles.aquaBoxLabel}>CBO</Text>
          </View>
        </View>
      ) : (
        <View style={styles.detailsColumn} />
      )}

      {showTCM ? (
        <View style={styles.detailsColumn}>
          <Text style={styles.detailsLabel}>TCM</Text>
          <View style={styles.aquaBoxRow}>
            <View style={styles.aquaBox} />
            <Text style={styles.aquaBoxLabel}>Supervisor</Text>
          </View>
          <View style={styles.aquaBoxRow}>
            <View style={styles.aquaBox} />
            <Text style={styles.aquaBoxLabel}>Case Manager</Text>
          </View>
          <View style={styles.aquaBoxRow}>
            <View style={styles.aquaBox} />
            <Text style={styles.aquaBoxLabel}>Support Person to Case Mgr</Text>
          </View>
        </View>
      ) : (
        <View style={styles.detailsColumn} />
      )}

      <View style={styles.monthYearCol}>
        <View style={{ flexDirection: "row" }}>
          <Text style={[styles.monthYearBox, { borderBottomWidth: 0 }]}>Month</Text>
          <Text style={[styles.monthYearBox, { borderLeftWidth: 0, borderBottomWidth: 0 }]} />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.monthYearBox}>{String(month)}</Text>
          <Text style={[styles.monthYearBox, { borderLeftWidth: 0 }]} />
        </View>
        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <Text style={[styles.monthYearBox, { borderBottomWidth: 0 }]}>Year</Text>
          <Text style={[styles.monthYearBox, { borderLeftWidth: 0, borderBottomWidth: 0 }]} />
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={styles.monthYearBox}>{String(year)}</Text>
          <Text style={[styles.monthYearBox, { borderLeftWidth: 0 }]} />
        </View>
      </View>
    </View>
  )
}

function MaatcmEmployeeInfoTable({ employee }: { employee: MaatcmEmployee }) {
  return (
    <View style={styles.infoTable}>
      <View style={styles.infoRow}>
        <Text style={styles.infoHeader}>Employee</Text>
        <Text style={styles.infoHeader}>Job classification</Text>
        <Text style={styles.infoHeader}>Employee Number</Text>
        <Text style={styles.infoHeader}>Claiming Unit</Text>
        <Text style={[styles.infoHeader, { borderRightWidth: 0 }]}>Claiming Unit Location</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoCell}>{employee.employeename}</Text>
        <Text style={styles.infoCell}>{employee.jobclassification}</Text>
        <Text style={styles.infoCell}>{employee.employeenumber}</Text>
        <Text style={styles.infoCell}>{employee.claimingunit}</Text>
        <Text style={[styles.infoCell, { borderRightWidth: 0 }]}>{employee.claimingunitlocation}</Text>
      </View>
    </View>
  )
}

function MaatcmMonthlyGrid({ employee }: { employee: MaatcmEmployee }) {
  const days = employee.noofdaysinmonth
  const codeWidth = 28
  const nameWidth = 110
  const dayWidth = Math.max(22, Math.floor((TABLE_WIDTH - codeWidth - nameWidth - 56) / days))
  const totalWidth = 28
  const percentWidth = 28

  return (
    <View style={{ width: TABLE_WIDTH }}>
      <View style={styles.gridRow}>
        <Text style={[styles.gridHeader, { width: codeWidth }]}>Code</Text>
        <Text style={[styles.gridHeader, { width: nameWidth }]}>Day of the Month</Text>
        {Array.from({ length: days }).map((_, index) => (
          <Text key={`day-h-${index}`} style={[styles.gridHeader, { width: dayWidth }]}>
            {index + 1}
          </Text>
        ))}
        <Text style={[styles.gridHeader, { width: totalWidth }]}>Total</Text>
        <Text style={[styles.gridHeader, { width: percentWidth }]}>%</Text>
      </View>

      <View style={styles.gridRow}>
        <Text style={[styles.aquaSpacer, { width: codeWidth }]} />
        <Text style={[styles.aquaSpacer, { width: nameWidth }]} />
        {Array.from({ length: days }).map((_, index) => (
          <Text key={`aqua-${index}`} style={[styles.aquaSpacer, { width: dayWidth }]} />
        ))}
        <Text style={[styles.aquaSpacer, { width: totalWidth }]} />
        <Text style={[styles.aquaSpacer, { width: percentWidth }]} />
      </View>

      {employee.activities.map((activity, index) => (
        <View key={`${activity.code}-${index}`} style={styles.gridRow}>
          <Text style={[styles.gridCell, { width: codeWidth }]}>{activity.code}</Text>
          <Text style={[styles.gridCellLeft, { width: nameWidth }]}>{activity.activityname}</Text>
          {Array.from({ length: days }).map((_, dayIndex) => (
            <Text key={`${activity.code}-d-${dayIndex}`} style={[styles.gridCell, { width: dayWidth }]}>
              {getMaatcmDayValue(activity, dayIndex + 1)}
            </Text>
          ))}
          <Text style={[styles.gridCell, { width: totalWidth }]}>{formatReportTime(activity.total)}</Text>
          <Text style={[styles.gridCell, { width: percentWidth }]}>{activity.totalper}%</Text>
        </View>
      ))}

      <View style={styles.gridRow}>
        <Text style={[styles.totalsLabel, { width: codeWidth + nameWidth }]}>Total Hours:</Text>
        {Array.from({ length: days }).map((_, dayIndex) => (
          <Text key={`total-d-${dayIndex}`} style={[styles.gridCell, { width: dayWidth }]}>
            {getMaatcmDayTotal(employee, dayIndex + 1)}
          </Text>
        ))}
        <Text style={[styles.gridCell, { width: totalWidth, fontFamily: "Helvetica-Bold" }]}>
          {formatReportTime(getMaatcmGrandTotal(employee))}
        </Text>
        <Text style={[styles.gridCell, { width: percentWidth }]}>100%</Text>
      </View>
    </View>
  )
}

function MaatcmMonthlyEmployeeSection({ employee }: { employee: MaatcmEmployee }) {
  return (
    <View wrap={false}>
      <MaatcmDetailsHeader
        activityCodeTypes={normMaatcmEmployeeTypes(employee)}
        spmptotal={employee.spmptotal}
        nonspmptotal={employee.nonspmptotal}
        month={employee.month}
        year={employee.year}
      />
      <MaatcmEmployeeInfoTable employee={employee} />
      <MaatcmMonthlyGrid employee={employee} />
      <MaatcmSignatureBlock />
    </View>
  )
}

function MaatcmPivotSummary({
  employees,
  activityCodeTypes,
  dateFrom,
  dateTo,
}: {
  employees: MaatcmEmployee[]
  activityCodeTypes: string[]
  dateFrom?: string
  dateTo?: string
}) {
  const list = employees.filter(isMaatcmSummaryEmployee)
  const period = maatcmPivotPeriodDisplay(list.length ? list : employees, dateFrom, dateTo)
  const spmpTotal = list.reduce((sum, employee) => sum + employee.spmptotal, 0)
  const nonSpmpTotal = list.reduce((sum, employee) => sum + employee.nonspmptotal, 0)

  if (!list.length) {
    return (
      <View>
        <MaatcmDetailsHeader
          activityCodeTypes={activityCodeTypes}
          spmptotal={spmpTotal}
          nonspmptotal={nonSpmpTotal}
          month={period.month}
          year={period.year}
        />
        <Text style={styles.emptyMessage}>No employees with MAA time for this period.</Text>
      </View>
    )
  }

  const codeSet = new Set<string>()
  list.forEach((employee) => {
    Object.keys(hoursByCodeForMaatcmEmployee(employee)).forEach((code) => codeSet.add(code))
  })
  const codes = sortMaatcmCodesAsc([...codeSet])
  const activityNameByCode = buildMaatcmActivityNameByCode(list)

  const fixedWidth = 90 + 78 + 78 + 78
  const totalWidth = 42
  const codeWidth =
    codes.length > 0 ? Math.max(36, Math.floor((TABLE_WIDTH - fixedWidth - totalWidth) / codes.length)) : 48

  return (
    <View>
      <MaatcmDetailsHeader
        activityCodeTypes={activityCodeTypes}
        spmptotal={spmpTotal}
        nonspmptotal={nonSpmpTotal}
        month={period.month}
        year={period.year}
      />

      <View style={{ width: TABLE_WIDTH, marginTop: 8 }}>
        <View style={styles.gridRow}>
          <Text style={[styles.pivotHeader, { width: 90 }]}>Employee</Text>
          <Text style={[styles.pivotHeader, { width: 78 }]}>Job classification</Text>
          <Text style={[styles.pivotHeader, { width: 78 }]}>Claiming unit</Text>
          <Text style={[styles.pivotHeader, { width: 78 }]}>Claiming unit location</Text>
          {codes.map((code) => (
            <Text key={`code-h-${code}`} style={[styles.pivotCodeHead, { width: codeWidth }]}>
              {code}
            </Text>
          ))}
          <Text style={[styles.gridHeader, { width: totalWidth }]}>Total</Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={[styles.pivotHeader, { width: 90 }]} />
          <Text style={[styles.pivotHeader, { width: 78 }]} />
          <Text style={[styles.pivotHeader, { width: 78 }]} />
          <Text style={[styles.pivotHeader, { width: 78 }]} />
          {codes.map((code) => (
            <Text key={`code-n-${code}`} style={[styles.pivotCodeName, { width: codeWidth }]}>
              {activityNameByCode[code] || ""}
            </Text>
          ))}
          <Text style={[styles.gridHeader, { width: totalWidth }]} />
        </View>

        {list.map((employee, index) => {
          const byCode = hoursByCodeForMaatcmEmployee(employee)
          const rowSum = Object.values(byCode).reduce((sum, value) => sum + value, 0)
          return (
            <View key={`${employee.employeenumber}-${index}`} style={styles.gridRow}>
              <View style={[styles.pivotEmpCell, { width: 90 }]}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{employee.employeename}</Text>
                {employee.employeenumber ? (
                  <Text style={styles.pivotEmpSub}>{employee.employeenumber}</Text>
                ) : null}
              </View>
              <Text style={[styles.pivotCell, { width: 78 }]}>{employee.jobclassification}</Text>
              <Text style={[styles.pivotCell, { width: 78 }]}>{employee.claimingunit}</Text>
              <Text style={[styles.pivotCell, { width: 78 }]}>{employee.claimingunitlocation}</Text>
              {codes.map((code) => (
                <Text key={`${employee.employeenumber}-${code}`} style={[styles.pivotCell, { width: codeWidth }]}>
                  {formatReportTime(byCode[code] ?? 0)}
                </Text>
              ))}
              <Text style={[styles.pivotCell, { width: totalWidth, fontFamily: "Helvetica-Bold" }]}>
                {formatReportTime(rowSum)}
              </Text>
            </View>
          )
        })}

        <View style={styles.gridRow}>
          <Text style={[styles.pivotHeader, { width: fixedWidth, textAlign: "left" }]}>Totals</Text>
          {codes.map((code) => {
            const colSum = list.reduce((sum, employee) => {
              const hours = hoursByCodeForMaatcmEmployee(employee)
              return sum + (hours[code] ?? 0)
            }, 0)
            return (
              <Text key={`total-${code}`} style={[styles.pivotCell, { width: codeWidth, fontFamily: "Helvetica-Bold" }]}>
                {formatReportTime(colSum)}
              </Text>
            )
          })}
          <Text style={[styles.pivotCell, { width: totalWidth, fontFamily: "Helvetica-Bold" }]}>
            {formatReportTime(
              list.reduce((sum, employee) => {
                const hours = hoursByCodeForMaatcmEmployee(employee)
                return sum + Object.values(hours).reduce((inner, value) => inner + value, 0)
              }, 0),
            )}
          </Text>
        </View>
      </View>

      <MaatcmSignatureBlock />
    </View>
  )
}

function MAATCMReportPage({
  meta,
  footerVariant,
  printedOn,
  children,
}: {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
  printedOn?: string
  children: ReactNode
}) {
  const pagePadding = resolvePagePadding(footerVariant)

  return (
    <Page size="A3" orientation="landscape" style={[styles.page, pagePadding]} wrap>
      <ReportPdfHeader
        countyName={meta.countyName}
        reportTitle={meta.reportTitle}
        countyLogoSrc={meta.countyLogoSrc}
        rightLogoSrc={meta.rightLogoSrc}
      />
      <ReportPdfFooter variant={footerVariant} printedOn={printedOn} />
      <View style={styles.content}>{children}</View>
    </Page>
  )
}

function MAATCMReportDocument({
  employees,
  isMonthly,
  dateFrom,
  dateTo,
  activityCodeTypes,
  printedOn,
  meta,
  footerVariant,
}: MAATCMReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const resolvedTypes =
    activityCodeTypes?.length
      ? activityCodeTypes
      : employees[0]?.activityCodeTypes?.length
        ? employees[0].activityCodeTypes
        : ["MAA"]

  if (!isMonthly) {
    return (
      <Document>
        <MAATCMReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <MaatcmPivotSummary
            employees={employees}
            activityCodeTypes={resolvedTypes}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </MAATCMReportPage>
      </Document>
    )
  }

  if (employees.length === 0) {
    return (
      <Document>
        <MAATCMReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </MAATCMReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <MAATCMReportPage
          key={`${employee.employeenumber}-${employee.employeename}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          <MaatcmMonthlyEmployeeSection employee={employee} />
        </MAATCMReportPage>
      ))}
    </Document>
  )
}

export async function generateMAATCMReportPdf(props: MAATCMReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const activityCodeTypes =
    props.activityCodeTypes ??
    props.employees[0]?.activityCodeTypes ??
    ["MAA"]

  const meta = await buildResolvedPdfMeta(
    {
      ...props.meta,
      reportCode: props.meta?.reportCode ?? "MAATCM",
      reportTitle:
        props.meta?.reportTitle ??
        resolveReportTitle("MAATCM", { activityCodeTypes }),
    },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <MAATCMReportDocument
      {...props}
      activityCodeTypes={activityCodeTypes}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
