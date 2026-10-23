import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import { REPORT_PDF_DEFAULT_LOGOS } from "./reportPdfAssets"
import { ReportPdfFooter, ReportPdfHeader, resolvePagePadding } from "./ReportPdfChrome"
import {
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatReportTime,
  getMaatcmDayTotal,
  getMaatcmDayValue,
  getMaatcmGrandTotal,
  getMaatcmWeekdayLabel,
  resolveFooterVariant,
  resolveReportTitle,
  type ClpppEmployee,
  type CLPPPReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const AQUA = "#7FFFD4"
const GREY = "rgb(219, 219, 219)"
const TABLE_WIDTH = 1150
const MONTH_YEAR_WIDTH = 130

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const INFO_COLUMNS: Array<{ label: string; width: number; value: (e: ClpppEmployee) => string }> = [
  { label: "Last Name", width: 130, value: (e) => e.lastname },
  { label: "First Name", width: 130, value: (e) => e.firstname },
  { label: "MI", width: 40, value: (e) => e.middleinitial },
  { label: "Civil Service Certification", width: 220, value: (e) => e.jobclassification },
  { label: "Program", width: 190, value: (e) => e.program },
  { label: "Claiming Unit", width: 170, value: (e) => e.claimingunit },
  {
    label: "Claiming Unit Location",
    width: TABLE_WIDTH - MONTH_YEAR_WIDTH - 880,
    value: (e) => e.claimingunitlocation,
  },
]

function getGridLayout(days: number) {
  const codeWidth = 30
  const totalWidth = 34
  const percentWidth = 38
  const nameWidthBase = 260
  const dayBudget = TABLE_WIDTH - codeWidth - totalWidth - percentWidth - nameWidthBase
  const dayWidth = Math.floor(dayBudget / days)
  const nameWidth = nameWidthBase + (dayBudget - dayWidth * days)
  return { codeWidth, nameWidth, dayWidth, totalWidth, percentWidth }
}

const cellBorder = { borderWidth: 1, borderColor: "#000000" } as const

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, fontFamily: "Helvetica", fontSize: 6 },
  content: { flexGrow: 1 },
  subtitle: { fontFamily: "Helvetica-Bold", fontSize: 9, textAlign: "center", marginBottom: 8 },
  row: { flexDirection: "row", width: TABLE_WIDTH },
  infoHeader: { ...cellBorder, backgroundColor: GREY, padding: 4, fontFamily: "Helvetica-Bold", fontSize: 6.5 },
  infoCell: { ...cellBorder, padding: 4, fontSize: 6.5, minHeight: 16 },
  gridHeader: {
    ...cellBorder,
    backgroundColor: GREY,
    padding: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textAlign: "center",
  },
  gridHeaderDay: {
    ...cellBorder,
    backgroundColor: AQUA,
    padding: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 5.5,
    textAlign: "center",
  },
  weekday: { ...cellBorder, backgroundColor: AQUA, paddingVertical: 2, fontFamily: "Helvetica-Bold", fontSize: 5, textAlign: "center" },
  plain: { ...cellBorder, padding: 4 },
  cell: { ...cellBorder, padding: 2, fontSize: 5.5, textAlign: "center" },
  cellLeft: { ...cellBorder, padding: 2, fontSize: 5.5, textAlign: "left" },
  totalsLabel: { ...cellBorder, fontFamily: "Helvetica-Bold", fontSize: 6.5, textAlign: "right", padding: 4 },
  signatureRow: { flexDirection: "row", width: TABLE_WIDTH, marginTop: 16, ...cellBorder },
  signatureCell: { width: TABLE_WIDTH / 2, paddingVertical: 8, paddingHorizontal: 6, fontSize: 6 },
  signatureDivider: { borderRightWidth: 1, borderRightColor: "#000000" },
  signatureLineRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 16, gap: 4 },
  signatureLabel: { fontFamily: "Helvetica-Bold", fontSize: 6 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: "#000000", width: 110, marginBottom: 2 },
  emptyMessage: { fontSize: 9, padding: 12 },
})

function EmployeeInfo({ employee }: { employee: ClpppEmployee }) {
  const month = Number(employee.month)
  const monthLabel = month >= 1 && month <= 12 ? MONTH_NAMES[month - 1] : String(employee.month)
  const half = MONTH_YEAR_WIDTH / 2
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={styles.row}>
        {INFO_COLUMNS.map((c) => (
          <Text key={c.label} style={[styles.infoHeader, { width: c.width }]}>
            {c.label}
          </Text>
        ))}
        <Text style={[styles.infoHeader, { width: half }]}>Month</Text>
        <Text style={[styles.infoHeader, { width: half }]}>Year</Text>
      </View>
      <View style={styles.row}>
        {INFO_COLUMNS.map((c) => (
          <Text key={c.label} style={[styles.infoCell, { width: c.width }]}>
            {c.value(employee)}
          </Text>
        ))}
        <Text style={[styles.infoCell, { width: half }]}>{monthLabel}</Text>
        <Text style={[styles.infoCell, { width: half }]}>{String(employee.year)}</Text>
      </View>
    </View>
  )
}

function ActivityGrid({ employee }: { employee: ClpppEmployee }) {
  const days = employee.noofdaysinmonth
  const { codeWidth, nameWidth, dayWidth, totalWidth, percentWidth } = getGridLayout(days)
  const dayIndexes = Array.from({ length: days }, (_, i) => i + 1)

  return (
    <View style={{ width: TABLE_WIDTH }}>
      <View style={styles.row}>
        <Text style={[styles.gridHeader, { width: codeWidth }]}>Code</Text>
        <Text style={[styles.gridHeader, { width: nameWidth }]}>Type of Activity</Text>
        {dayIndexes.map((d) => (
          <Text key={`h-${d}`} style={[styles.gridHeaderDay, { width: dayWidth }]}>
            {d}
          </Text>
        ))}
        <Text style={[styles.gridHeader, { width: totalWidth }]}>Total</Text>
        <Text style={[styles.gridHeader, { width: percentWidth }]}>% of Time</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.plain, { width: codeWidth + nameWidth }]} />
        {dayIndexes.map((d) => (
          <Text key={`w-${d}`} style={[styles.weekday, { width: dayWidth }]}>
            {getMaatcmWeekdayLabel(employee, d)}
          </Text>
        ))}
        <Text style={[styles.plain, { width: totalWidth + percentWidth }]} />
      </View>

      {employee.activities.map((activity) => (
        <View key={activity.code} style={styles.row} wrap={false}>
          <Text style={[styles.cell, { width: codeWidth, fontFamily: "Helvetica-Bold" }]}>{activity.code}</Text>
          <Text style={[styles.cellLeft, { width: nameWidth }]}>{activity.activityname}</Text>
          {dayIndexes.map((d) => (
            <Text key={`${activity.code}-${d}`} style={[styles.cell, { width: dayWidth }]}>
              {getMaatcmDayValue(activity, d)}
            </Text>
          ))}
          <Text style={[styles.cell, { width: totalWidth }]}>{formatReportTime(activity.total)}</Text>
          <Text style={[styles.cell, { width: percentWidth }]}>{`${activity.totalper}%`}</Text>
        </View>
      ))}

      <View style={styles.row}>
        <Text style={[styles.totalsLabel, { width: codeWidth + nameWidth }]}>Total</Text>
        {dayIndexes.map((d) => (
          <Text key={`t-${d}`} style={[styles.cell, { width: dayWidth }]}>
            {getMaatcmDayTotal(employee, d)}
          </Text>
        ))}
        <Text style={[styles.cell, { width: totalWidth, fontFamily: "Helvetica-Bold" }]}>
          {formatReportTime(getMaatcmGrandTotal(employee))}
        </Text>
        <Text style={[styles.cell, { width: percentWidth, fontFamily: "Helvetica-Bold" }]}>100%</Text>
      </View>
    </View>
  )
}

function SignatureBlock() {
  return (
    <View style={styles.signatureRow} wrap={false}>
      <View style={[styles.signatureCell, styles.signatureDivider]}>
        <Text>
          <Text style={styles.signatureLabel}>Employee:</Text> I certify that this is a true and accurate report of my
          time and the activities were performed as shown.
        </Text>
        <View style={styles.signatureLineRow}>
          <Text style={styles.signatureLabel}>Employee Signature:</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Telephone Number:</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Date:</Text>
          <View style={[styles.signatureLine, { width: 70 }]} />
        </View>
      </View>
      <View style={styles.signatureCell}>
        <Text>
          <Text style={styles.signatureLabel}>Supervisor:</Text> I certify that the employee&apos;s time records have
          been examined and that, to the best of my knowledge and belief, this time record is true and correct and the
          activities were performed as shown.
        </Text>
        <View style={styles.signatureLineRow}>
          <Text style={styles.signatureLabel}>Supervisor Signature:</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Date:</Text>
          <View style={[styles.signatureLine, { width: 70 }]} />
        </View>
      </View>
    </View>
  )
}

function ClpppPage({
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
  return (
    <Page size="A3" orientation="landscape" style={[styles.page, resolvePagePadding(footerVariant)]} wrap>
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

export async function generateCLPPPReportPdf(props: CLPPPReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    {
      ...props.meta,
      reportCode: props.meta?.reportCode ?? "CLPPP",
      reportTitle: props.meta?.reportTitle ?? resolveReportTitle("CLPPP"),
    },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const doc = (
    <Document>
      {props.employees.length === 0 ? (
        <ClpppPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </ClpppPage>
      ) : (
        props.employees.map((employee, index) => (
          <ClpppPage
            key={`${employee.employeenumber}-${index}`}
            meta={meta}
            footerVariant={footerVariant}
            printedOn={printedOn}
          >
            <View wrap={false}>
              <Text style={styles.subtitle}>
                Worker Log Time Survey for Employees Performing Medi-Cal Administrative Activities (MAA)
              </Text>
              <EmployeeInfo employee={employee} />
              <ActivityGrid employee={employee} />
              <SignatureBlock />
            </View>
          </ClpppPage>
        ))
      )}
    </Document>
  )

  const blob = await pdf(doc).toBlob()
  return ensurePdfBlob(blob)
}
