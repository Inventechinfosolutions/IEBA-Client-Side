import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import { REPORT_PDF_DEFAULT_LOGOS } from "./reportPdfAssets"

import {
  ReportPdfFooter,
  ReportPdfHeader,
  ReportPdfPageNumbers,
  resolvePagePadding,
} from "./ReportPdfChrome"
import {
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatReportTime,
  getP111GrandTotal,
  resolveFooterVariant,
  type P111DateGroup,
  type P111GroupedEmployee,
  type P111Record,
  type P111ReportPdfProps,
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

/** 8 columns — ~7% each for time cols; remainder split across name/program/activity/ffp/support */
const W = {
  employee: 54,
  startTime: 38,
  stopTime: 38,
  totalTime: 38,
  program: 109,
  activity: 152,
  ffp: 22,
  support: 93,
} as const

const COLUMNS = [
  { key: "employee", width: W.employee, label: "Employee Name" },
  { key: "startTime", width: W.startTime, label: "Start Time" },
  { key: "stopTime", width: W.stopTime, label: "Stop Time" },
  { key: "totalTime", width: W.totalTime, label: "Total Time" },
  { key: "program", width: W.program, label: "Program code and name" },
  { key: "activity", width: W.activity, label: "Activity code and name" },
  { key: "ffp", width: W.ffp, label: "FFP" },
  { key: "support", width: W.support, label: "Supporting Docs" },
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
  headerText: { fontSize: 7, textAlign: "center", lineHeight: 1.25, fontFamily: "Helvetica-Bold" },
  bodyCell: {
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  leftText: { fontSize: 6, lineHeight: 1.2 },
  centerText: { fontSize: 6, textAlign: "center", lineHeight: 1.2 },
  rightText: { fontSize: 6, textAlign: "right", lineHeight: 1.2 },
  boldText: { fontSize: 6, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
  employeeNameCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
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
  printedRow: {
    width: TABLE_WIDTH,
    paddingTop: 4,
  },
  printedText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  emptyMessage: { fontSize: 9, padding: 12 },
})

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

function EmployeeFooter({ printedOn }: { printedOn: string }) {
  return (
    <View style={styles.employeeFooter} wrap={false}>
      <View style={styles.signatureRow}>
        {SIGNATURE_LABELS.map((label) => (
          <Text key={label} style={styles.signatureSlot}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.printedRow}>
        <Text style={styles.printedText}>Printed on {printedOn}</Text>
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

function DateSection({ dateGroup }: { dateGroup: P111DateGroup }) {
  return (
    <View style={styles.dateSection}>
      <View style={styles.row}>
        <EmptyCell width={W.employee} />
        <View style={[styles.dateHeaderCell, { width: W.startTime }]}>
          <Text style={styles.boldText}>{dateGroup.date}</Text>
        </View>
        <EmptyCell width={W.stopTime} />
        <EmptyCell width={W.totalTime} />
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
        <EmptyCell width={W.employee} />
        <EmptyCell width={W.startTime} />
        <EmptyCell width={W.stopTime} />
        <View style={[styles.dateTotalBox, { width: W.totalTime }]}>
          <Text style={[styles.rightText, styles.boldText]}>
            {formatReportTime(dateGroup.totalActivityTime)}
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

function RecordRow({ record }: { record: P111Record }) {
  return (
    <View style={styles.row}>
      <EmptyCell width={W.employee} />
      <Cell width={W.startTime} align="right">
        {record.starttime}
      </Cell>
      <Cell width={W.stopTime}>{record.endtime}</Cell>
      <Cell width={W.totalTime} align="right">
        {formatReportTime(record.activitytime)}
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

function EmployeeTable({ employee }: { employee: P111GroupedEmployee }) {
  const grandTotal = getP111GrandTotal(employee)

  return (
    <View style={styles.table}>
      <ColumnHeaderRow />
      <View style={styles.row}>
        <View style={[styles.employeeNameCell, { width: W.employee }]}>
          <Text style={styles.boldText} wrap>
            {employee.employeename}
          </Text>
        </View>
        <EmptyCell width={W.startTime} />
        <EmptyCell width={W.stopTime} />
        <EmptyCell width={W.totalTime} />
        <EmptyCell width={W.program} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.ffp} />
        <EmptyCell width={W.support} />
      </View>

      {employee.dates.map((dateGroup) => (
        <DateSection key={dateGroup.date} dateGroup={dateGroup} />
      ))}

      <View style={styles.spacer} />

      <View style={styles.row}>
        <EmptyCell width={W.employee} />
        <EmptyCell width={W.startTime} />
        <EmptyCell width={W.stopTime} />
        <View style={[styles.grandTotalBox, { width: W.totalTime }]}>
          <Text style={[styles.rightText, styles.boldText]}>{formatReportTime(grandTotal)}</Text>
        </View>
        <EmptyCell width={W.program} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.ffp} />
        <EmptyCell width={W.support} />
      </View>
    </View>
  )
}

function P111ReportPage({
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
  const pagePadding = {
    ...resolvePagePadding(footerVariant),
    paddingBottom: 52,
  }

  return (
    <Page size="LETTER" style={[styles.page, pagePadding]} wrap>
      <ReportPdfHeader
        countyName={meta.countyName}
        reportTitle={meta.reportTitle}
        countyLogoSrc={meta.countyLogoSrc}
        rightLogoSrc={meta.rightLogoSrc}
      />
      <ReportPdfFooter variant={footerVariant} printedOn={printedOn} />
      <ReportPdfPageNumbers />
      <View style={styles.content}>{children}</View>
    </Page>
  )
}

function P111ReportDocument({
  employees,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: P111ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
  printedOn: string
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <P111ReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <PeriodDates startDate={startDate} endDate={endDate} />
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </P111ReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <P111ReportPage
          key={`${employee.employeename}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          {index === 0 ? <PeriodDates startDate={startDate} endDate={endDate} /> : null}
          <EmployeeTable employee={employee} />
          <EmployeeFooter printedOn={printedOn} />
        </P111ReportPage>
      ))}
    </Document>
  )
}

export async function generateP111ReportPdf(props: P111ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "P111" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <P111ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
