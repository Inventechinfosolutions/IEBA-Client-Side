import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import { REPORT_PDF_DEFAULT_LOGOS } from "./reportPdfAssets"

import {
  ReportPdfFooter,
  ReportPdfHeader,
  resolvePagePadding,
} from "./ReportPdfChrome"
import {
  buildResolvedPdfMeta,
  calculateP101Percentage,
  ensurePdfBlob,
  formatP101AllPeriodLabel,
  formatPrintedOnLabel,
  formatReportTime,
  getP101AllTotalsForEmployee,
  getP101EmployeeGrandTotals,
  groupP101DataByEmployee,
  resolveFooterVariant,
  type P101AllCategoryTotals,
  type P101GroupedActivity,
  type P101GroupedEmployee,
  type P101ReportPdfProps,
  type ReportDataRecord,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544

const W = {
  employee: 82,
  activity: 218,
  ffp: 49,
  activityTime: 49,
  travelTime: 49,
  totalTime: 49,
  pct: 48,
} as const

const SIGNATURE_SLOTS = [
  { label: "Employee Signature", lineWidth: 122 },
  { label: "Date", lineWidth: 42 },
  { label: "Supervisor Signature", lineWidth: 130 },
  { label: "Date", lineWidth: 42 },
] as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 6,
  },
  content: { flexGrow: 1 },
  dates: { marginBottom: 8 },
  dateRow: { flexDirection: "row", marginBottom: 2, gap: 16 },
  dateLabel: { minWidth: 90, fontFamily: "Helvetica-Bold", fontSize: 7 },
  dateValue: { fontFamily: "Helvetica-Bold", fontSize: 7 },
  table: { width: TABLE_WIDTH },
  row: { flexDirection: "row", width: TABLE_WIDTH },
  cellText: { fontSize: 6 },
  headerBox: {
    backgroundColor: "rgb(219, 219, 219)",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  headerText: { fontSize: 6, textAlign: "center" },
  bodyBox: { paddingVertical: 2, paddingHorizontal: 2, justifyContent: "center" },
  boldText: { fontSize: 6, fontFamily: "Helvetica-Bold" },
  activityHeader: { fontSize: 6, fontFamily: "Helvetica-Bold", paddingVertical: 2, paddingHorizontal: 2 },
  centerText: { fontSize: 6, textAlign: "center" },
  rightText: { fontSize: 6, textAlign: "right" },
  subtotalBox: {
    backgroundColor: "lightgray",
    paddingVertical: 2,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  grandTotalBox: {
    backgroundColor: "darkgray",
    paddingVertical: 2,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    width: TABLE_WIDTH,
  },
  signatureField: { alignItems: "center" },
  signatureLine: { borderTopWidth: 1, borderTopColor: "#000000" },
  signatureLabel: { marginTop: 4, fontSize: 10, color: "#333333" },
})

function CellBox({
  width,
  children,
  bold,
  align = "left",
}: {
  width: number
  children?: ReactNode
  bold?: boolean
  align?: "left" | "center" | "right"
}) {
  const textStyle =
    align === "center"
      ? styles.centerText
      : align === "right"
        ? styles.rightText
        : bold
          ? styles.boldText
          : styles.cellText

  return (
    <View style={[styles.bodyBox, { width }]}>
      {children != null && children !== "" ? (
        <Text style={bold && align === "left" ? styles.boldText : textStyle}>{children}</Text>
      ) : null}
    </View>
  )
}

function EmptyCell({ width }: { width: number }) {
  return <View style={{ width, paddingVertical: 2 }} />
}

function TableHeaderRow() {
  return (
    <View style={styles.row} wrap={false}>
      <View style={[styles.headerBox, { width: W.employee }]}>
        <Text style={styles.headerText}>Employee Name</Text>
      </View>
      <View style={[styles.headerBox, { width: W.activity }]}>
        <Text style={styles.headerText}>Activity Code and Description</Text>
      </View>
      <View style={[styles.headerBox, { width: W.ffp }]}>
        <Text style={styles.headerText}>FFP</Text>
      </View>
      <View style={[styles.headerBox, { width: W.activityTime }]}>
        <Text style={styles.headerText}>Activity Time</Text>
      </View>
      <View style={[styles.headerBox, { width: W.travelTime }]}>
        <Text style={styles.headerText}>Travel Time</Text>
      </View>
      <View style={[styles.headerBox, { width: W.totalTime }]}>
        <Text style={styles.headerText}>Total Time</Text>
      </View>
      <View style={[styles.headerBox, { width: W.pct }]} />
    </View>
  )
}

function PeriodDates({ startDate, endDate }: { startDate: string; endDate: string }) {
  return (
    <View style={styles.dates}>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Period Starting:</Text>
        <Text style={styles.dateValue}>{startDate}</Text>
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Period Ending:</Text>
        <Text style={styles.dateValue}>{endDate}</Text>
      </View>
    </View>
  )
}

function recordTotalTime(record: ReportDataRecord): number {
  return toNumber(record.activitytime) + toNumber(record.traveltime)
}

function toNumber(value: string | number): number {
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

function ActivityRows({
  activity,
  grandTotalTime,
}: {
  activity: P101GroupedActivity
  grandTotalTime: number
}) {
  return (
    // Keep each activity block atomic so React-PDF does not split/duplicate
    // codes across page breaks (the Sue Abernethy two-page total bug).
    <View wrap={false}>
      {activity.records.map((record, recordIndex) => (
        <View key={`${activity.activity}-${record.program}-${record.mastercode}-${recordIndex}`}>
          {recordIndex === 0 ? (
            <View style={styles.row}>
              <EmptyCell width={W.employee} />
              <View style={[styles.activityHeader, { width: W.activity }]}>
                <Text>{activity.activity}</Text>
              </View>
              <EmptyCell width={W.ffp} />
              <EmptyCell width={W.activityTime} />
              <EmptyCell width={W.travelTime} />
              <EmptyCell width={W.totalTime} />
              <EmptyCell width={W.pct} />
            </View>
          ) : null}
          <View style={styles.row}>
            <EmptyCell width={W.employee} />
            <CellBox width={W.activity}>{record.program}</CellBox>
            <CellBox width={W.ffp} align="center">
              {record.mastercode}
            </CellBox>
            <CellBox width={W.activityTime} align="right">
              {formatReportTime(record.activitytime)}
            </CellBox>
            <CellBox width={W.travelTime} align="right">
              {formatReportTime(record.traveltime)}
            </CellBox>
            <CellBox width={W.totalTime} align="right">
              {formatReportTime(recordTotalTime(record))}
            </CellBox>
            <CellBox width={W.pct} align="right">
              {calculateP101Percentage(recordTotalTime(record), grandTotalTime)}
            </CellBox>
          </View>
          {recordIndex === activity.records.length - 1 ? (
            <View style={styles.row}>
              <EmptyCell width={W.employee} />
              <EmptyCell width={W.activity} />
              <EmptyCell width={W.ffp} />
              <View style={[styles.subtotalBox, { width: W.activityTime }]}>
                <Text style={styles.rightText}>
                  {formatReportTime(activity.totalActivityTimeForActivity)}
                </Text>
              </View>
              <View style={[styles.subtotalBox, { width: W.travelTime }]}>
                <Text style={styles.rightText}>{formatReportTime(activity.totalTravelTime)}</Text>
              </View>
              <View style={[styles.subtotalBox, { width: W.totalTime }]}>
                <Text style={styles.rightText}>{formatReportTime(activity.totalTime)}</Text>
              </View>
              <View style={[styles.subtotalBox, { width: W.pct }]}>
                <Text style={styles.rightText}>
                  {calculateP101Percentage(activity.totalTime, grandTotalTime)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

function CategoryTotalRow({
  label,
  totalHours,
  isFirst,
}: {
  label: string
  totalHours: number
  isFirst?: boolean
}) {
  return (
    <View style={[styles.row, isFirst ? { marginTop: 16 } : {}]} wrap={false}>
      <View style={[styles.grandTotalBox, { width: W.employee + W.activity + W.ffp }]}>
        <Text style={[styles.rightText, styles.boldText]}>{label}</Text>
      </View>
      <View style={[styles.grandTotalBox, { width: W.activityTime }]}>
        <Text style={[styles.rightText, styles.boldText]} />
      </View>
      <View style={[styles.grandTotalBox, { width: W.travelTime }]}>
        <Text style={[styles.rightText, styles.boldText]} />
      </View>
      <View style={[styles.grandTotalBox, { width: W.totalTime }]}>
        <Text style={[styles.rightText, styles.boldText]}>{formatReportTime(totalHours)}</Text>
      </View>
      <View style={[styles.grandTotalBox, { width: W.pct }]}>
        <Text style={[styles.rightText, styles.boldText]} />
      </View>
    </View>
  )
}

function EmployeeTable({
  employee,
  categoryTotals,
  periodLabel,
  useCategoryTotals,
}: {
  employee: P101GroupedEmployee
  categoryTotals?: P101AllCategoryTotals
  periodLabel?: string
  useCategoryTotals?: boolean
}) {
  const grandTotals = getP101EmployeeGrandTotals(employee)

  return (
    <View style={styles.table}>
      <TableHeaderRow />

      <View style={styles.row} wrap={false}>
        <CellBox width={W.employee} bold>
          {employee.employeename}
        </CellBox>
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.ffp} />
        <EmptyCell width={W.activityTime} />
        <EmptyCell width={W.travelTime} />
        <EmptyCell width={W.totalTime} />
        <EmptyCell width={W.pct} />
      </View>

      {employee.activities.map((activity) => (
        <ActivityRows
          key={activity.activity}
          activity={activity}
          grandTotalTime={grandTotals.totalTime}
        />
      ))}

      {useCategoryTotals && categoryTotals ? (
        <>
          <CategoryTotalRow label="Total FFP time" totalHours={categoryTotals.ffpTotal} isFirst />
          <CategoryTotalRow label="Total MAA time" totalHours={categoryTotals.maaTotal} />
          <CategoryTotalRow
            label={`Total for ${periodLabel ?? "Period"}`}
            totalHours={categoryTotals.periodTotal}
          />
        </>
      ) : (
        <View style={[styles.row, { marginTop: 16 }]} wrap={false}>
          <View style={[styles.grandTotalBox, { width: W.employee + W.activity + W.ffp }]}>
            <Text style={[styles.rightText, styles.boldText]}>Grand Totals:</Text>
          </View>
          <View style={[styles.grandTotalBox, { width: W.activityTime }]}>
            <Text style={[styles.rightText, styles.boldText]}>
              {formatReportTime(grandTotals.activityTime)}
            </Text>
          </View>
          <View style={[styles.grandTotalBox, { width: W.travelTime }]}>
            <Text style={[styles.rightText, styles.boldText]}>
              {formatReportTime(grandTotals.travelTime)}
            </Text>
          </View>
          <View style={[styles.grandTotalBox, { width: W.totalTime }]}>
            <Text style={[styles.rightText, styles.boldText]}>
              {formatReportTime(grandTotals.totalTime)}
            </Text>
          </View>
          <View style={[styles.grandTotalBox, { width: W.pct }]}>
            <Text style={[styles.rightText, styles.boldText]}>
              {calculateP101Percentage(grandTotals.totalTime, grandTotals.totalTime)}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

function P101EmployeeSignature() {
  return (
    <View style={styles.signatureRow} wrap={false}>
      {SIGNATURE_SLOTS.map((slot, index) => (
        <View key={`${slot.label}-${index}`} style={styles.signatureField}>
          <View style={[styles.signatureLine, { width: slot.lineWidth }]} />
          <Text style={styles.signatureLabel}>{slot.label}</Text>
        </View>
      ))}
    </View>
  )
}

function P101ReportPage({
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
    <Page size="LETTER" style={[styles.page, pagePadding]} wrap>
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

function P101ReportDocument({
  records,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
  categoryTotalsByEmployee,
}: P101ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const groupedEmployees = groupP101DataByEmployee(records)
  const useCategoryTotals =
    meta.reportCode === "P101-ALL" || meta.reportCode === "P101ALL"
  const periodLabel = formatP101AllPeriodLabel(startDate, endDate)
  const showInlineSignature = footerVariant !== "signaturePerPage"

  if (groupedEmployees.length === 0) {
    return (
      <Document>
        <P101ReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <PeriodDates startDate={startDate} endDate={endDate} />
          <Text style={styles.cellText}>No data available for the selected period.</Text>
        </P101ReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {groupedEmployees.map((employee, index) => (
        <P101ReportPage
          key={`${employee.employeename}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          {index === 0 ? <PeriodDates startDate={startDate} endDate={endDate} /> : null}
          <EmployeeTable
            employee={employee}
            useCategoryTotals={useCategoryTotals}
            categoryTotals={getP101AllTotalsForEmployee(
              categoryTotalsByEmployee,
              employee.employeename,
            )}
            periodLabel={periodLabel}
          />
          {showInlineSignature ? <P101EmployeeSignature /> : null}
        </P101ReportPage>
      ))}
    </Document>
  )
}

export async function generateP101ReportPdf(props: P101ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "P101" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <P101ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
