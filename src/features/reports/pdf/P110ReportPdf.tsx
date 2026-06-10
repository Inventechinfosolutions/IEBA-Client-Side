import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import defaultCountyLogo from "@/assets/county-avatar.png"
import pkiLogo from "@/assets/ieba-logo.png"

import {
  ReportPdfFooter,
  ReportPdfHeader,
  resolvePagePadding,
} from "./ReportPdfChrome"
import {
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatReportTime,
  getP110GrandTotals,
  resolveFooterVariant,
  type P110DateGroup,
  type P110GroupedEmployee,
  type P110Record,
  type P110ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544
const ROW_MIN_HEIGHT = 14

const SIGNATURE_LABELS = [
  "Employee Signature",
  "Date",
  "Supervisor Signature",
  "Date",
] as const

/** Column widths scaled to 544pt — time/FFP wide enough for labels; program/activity share remainder */
const W = {
  actTime: 40,
  tvlTime: 44,
  totalTime: 48,
  program: 106,
  activity: 160,
  ffp: 28,
  support: 118,
} as const

const COLUMNS = [
  { key: "actTime", width: W.actTime, label: "Act Time" },
  { key: "tvlTime", width: W.tvlTime, label: "Tvl Time" },
  { key: "totalTime", width: W.totalTime, label: "Total Time" },
  { key: "program", width: W.program, label: "Program Code & Description" },
  { key: "activity", width: W.activity, label: "Activity Code & Description" },
  { key: "ffp", width: W.ffp, label: "FFP" },
  { key: "support", width: W.support, label: "Support Information" },
] as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  content: { flexGrow: 1 },
  dates: { marginBottom: 8 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  dateLabel: { width: 90, fontFamily: "Helvetica-Bold", fontSize: 7 },
  dateValue: { fontFamily: "Helvetica-Bold", fontSize: 7 },
  table: { width: TABLE_WIDTH, marginBottom: 8 },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    minHeight: ROW_MIN_HEIGHT,
    alignItems: "stretch",
  },
  headerRow: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    borderWidth: 1,
    borderColor: "#000000",
    minHeight: ROW_MIN_HEIGHT,
  },
  headerCell: {
    backgroundColor: "rgb(219, 219, 219)",
    borderRightWidth: 1,
    borderRightColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
    minHeight: ROW_MIN_HEIGHT,
  },
  headerCellLast: { borderRightWidth: 0 },
  headerText: { fontSize: 7, textAlign: "center", lineHeight: 1.25 },
  bodyCell: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  cellText: { fontSize: 6, lineHeight: 1.2 },
  leftText: { fontSize: 6, lineHeight: 1.2 },
  centerText: { fontSize: 6, textAlign: "center", lineHeight: 1.2 },
  rightText: { fontSize: 6, textAlign: "right", lineHeight: 1.2 },
  boldText: { fontSize: 6, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
  employeeNameRow: {
    paddingVertical: 5,
    paddingHorizontal: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    minHeight: ROW_MIN_HEIGHT,
  },
  dateHeaderCell: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  dateTotalBox: {
    backgroundColor: "darkgray",
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  grandTotalBox: {
    backgroundColor: "darkgray",
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  dateSection: { marginTop: 2 },
  spacer: { height: 8, width: TABLE_WIDTH },
  employeeFooter: {
    marginTop: 28,
    width: TABLE_WIDTH,
    alignItems: "center",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: TABLE_WIDTH,
    marginBottom: 10,
  },
  signatureSlot: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingHorizontal: 12,
    paddingTop: 4,
    fontSize: 10,
  },
  emptyMessage: { fontSize: 9, padding: 12 },
})

function recordTotalTime(record: P110Record): number {
  return Number(record.activitytime) + Number(record.traveltime)
}

function Cell({
  width,
  children,
  align = "left",
}: {
  width: number
  children?: ReactNode
  align?: "left" | "center" | "right"
}) {
  const textStyle =
    align === "center" ? styles.centerText : align === "right" ? styles.rightText : styles.leftText

  return (
    <View style={[styles.bodyCell, { width }]}>
      {children != null && children !== "" ? (
        <Text style={textStyle} wrap>
          {children}
        </Text>
      ) : null}
    </View>
  )
}

function EmptyCell({ width }: { width: number }) {
  return <View style={{ width, minHeight: ROW_MIN_HEIGHT, paddingVertical: 3 }} />
}

function EmployeeFooter() {
  return (
    <View style={styles.employeeFooter} wrap={false}>
      <View style={styles.signatureRow}>
        {SIGNATURE_LABELS.map((label) => (
          <Text key={label} style={styles.signatureSlot}>
            {label}
          </Text>
        ))}
      </View>
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

function ColumnHeaderRow() {
  return (
    <View style={styles.headerRow}>
      {COLUMNS.map((column, index) => (
        <View
          key={column.key}
          style={[
            styles.headerCell,
            { width: column.width },
            ...(index === COLUMNS.length - 1 ? [styles.headerCellLast] : []),
          ]}
        >
          <Text style={styles.headerText}>{column.label}</Text>
        </View>
      ))}
    </View>
  )
}

function DateSection({ dateGroup }: { dateGroup: P110DateGroup }) {
  return (
    <View style={styles.dateSection}>
      <View style={styles.row}>
        <View style={[styles.dateHeaderCell, { width: W.actTime }]}>
          <Text style={styles.boldText}>{dateGroup.date}</Text>
        </View>
        <View style={[styles.dateHeaderCell, { width: W.tvlTime }]} />
        <View style={[styles.dateHeaderCell, { width: W.totalTime }]} />
        <EmptyCell width={W.program} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.ffp} />
        <View style={[styles.dateHeaderCell, { width: W.support, alignItems: "flex-end" }]}>
          <Text style={[styles.boldText, styles.rightText]}>Employee notes:</Text>
        </View>
      </View>

      {dateGroup.records.map((record, index) => (
        <RecordRow key={`${dateGroup.date}-${record.program}-${index}`} record={record} />
      ))}

      <View style={styles.row}>
        <View style={[styles.dateTotalBox, { width: W.actTime }]}>
          <Text style={styles.rightText}>{formatReportTime(dateGroup.totalActivityTime)}</Text>
        </View>
        <View style={[styles.dateTotalBox, { width: W.tvlTime }]}>
          <Text style={styles.rightText}>{formatReportTime(dateGroup.totalTravelTime)}</Text>
        </View>
        <View style={[styles.dateTotalBox, { width: W.totalTime }]}>
          <Text style={styles.rightText}>{formatReportTime(dateGroup.totalTime)}</Text>
        </View>
        <EmptyCell width={W.program} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.ffp} />
        <EmptyCell width={W.support} />
      </View>
    </View>
  )
}

function RecordRow({ record }: { record: P110Record }) {
  return (
    <View style={styles.row}>
      <Cell width={W.actTime} align="right">
        {formatReportTime(record.activitytime)}
      </Cell>
      <Cell width={W.tvlTime} align="right">
        {formatReportTime(record.traveltime)}
      </Cell>
      <Cell width={W.totalTime} align="right">
        {formatReportTime(recordTotalTime(record))}
      </Cell>
      <Cell width={W.program}>{record.program}</Cell>
      <Cell width={W.activity}>{record.subactivity}</Cell>
      <Cell width={W.ffp} align="center">
        {record.mastercode}
      </Cell>
      <Cell width={W.support}>{record.description}</Cell>
    </View>
  )
}

function EmployeeTable({ employee }: { employee: P110GroupedEmployee }) {
  const grandTotals = getP110GrandTotals(employee)

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <View style={{ width: TABLE_WIDTH }}>
          <Text style={styles.employeeNameRow}>{employee.employeename}</Text>
        </View>
      </View>
      <ColumnHeaderRow />

      {employee.dates.map((dateGroup) => (
        <DateSection key={dateGroup.date} dateGroup={dateGroup} />
      ))}

      <View style={styles.spacer} />

      <View style={styles.row}>
        <View style={[styles.grandTotalBox, { width: W.actTime }]}>
          <Text style={[styles.rightText, styles.boldText]}>
            {formatReportTime(grandTotals.activityTime)}
          </Text>
        </View>
        <View style={[styles.grandTotalBox, { width: W.tvlTime }]}>
          <Text style={[styles.rightText, styles.boldText]}>
            {formatReportTime(grandTotals.travelTime)}
          </Text>
        </View>
        <View style={[styles.grandTotalBox, { width: W.totalTime }]}>
          <Text style={[styles.rightText, styles.boldText]}>
            {formatReportTime(grandTotals.totalTime)}
          </Text>
        </View>
        <EmptyCell width={W.program} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.ffp} />
        <EmptyCell width={W.support} />
      </View>
    </View>
  )
}

function P110ReportPage({
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

function P110ReportDocument({
  employees,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: P110ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
  printedOn: string
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <P110ReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <PeriodDates startDate={startDate} endDate={endDate} />
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </P110ReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <P110ReportPage
          key={`${employee.employeename}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          {index === 0 ? <PeriodDates startDate={startDate} endDate={endDate} /> : null}
          <EmployeeTable employee={employee} />
          <EmployeeFooter />
        </P110ReportPage>
      ))}
    </Document>
  )
}

export async function generateP110ReportPdf(props: P110ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "P110" },
    { countyLogo: defaultCountyLogo, rightLogo: pkiLogo },
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <P110ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
