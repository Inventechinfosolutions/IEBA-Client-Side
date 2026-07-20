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
  getP110SSGrandTotal,
  resolveFooterVariant,
  type P110SSDateGroup,
  type P110SSGroupedEmployee,
  type P110SSRecord,
  type P110SSReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544
const ROW_MIN_HEIGHT = 18

const W = {
  totalTime: 57,
  program: 143,
  activity: 200,
  support: 144,
} as const

const SIGNATURE_LABELS = [
  "Employee Signature",
  "Date",
  "Supervisor Signature",
  "Date",
] as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  content: { flexGrow: 1 },
  dates: { marginBottom: 12 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  dateLabel: { width: 90, fontFamily: "Helvetica-Bold", fontSize: 7 },
  dateValue: { fontFamily: "Helvetica-Bold", fontSize: 7 },
  table: { width: TABLE_WIDTH, marginBottom: 12 },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    minHeight: ROW_MIN_HEIGHT,
    alignItems: "stretch",
  },
  headerBox: {
    backgroundColor: "rgb(219, 219, 219)",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 3,
    justifyContent: "center",
    minHeight: ROW_MIN_HEIGHT,
  },
  headerText: { fontSize: 7, textAlign: "center", lineHeight: 1.3 },
  bodyCell: {
    paddingVertical: 6,
    paddingHorizontal: 3,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  cellText: { fontSize: 7, lineHeight: 1.35 },
  centerText: { fontSize: 7, textAlign: "center", lineHeight: 1.35 },
  boldText: { fontSize: 7, fontFamily: "Helvetica-Bold", lineHeight: 1.35 },
  employeeNameRow: {
    paddingVertical: 8,
    paddingHorizontal: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    minHeight: ROW_MIN_HEIGHT,
  },
  dateHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  dateTotalBox: {
    backgroundColor: "darkgray",
    paddingVertical: 6,
    paddingHorizontal: 3,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  grandTotalBox: {
    backgroundColor: "darkgray",
    paddingVertical: 6,
    paddingHorizontal: 3,
    minHeight: ROW_MIN_HEIGHT,
    justifyContent: "center",
  },
  dateSection: { marginTop: 4 },
  spacer: { height: 14, width: TABLE_WIDTH },
  employeeFooter: {
    marginTop: 32,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: TABLE_WIDTH,
    paddingTop: 6,
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
  bold,
}: {
  width: number
  children?: ReactNode
  align?: "left" | "center"
  bold?: boolean
}) {
  const textStyle =
    align === "center" ? styles.centerText : bold ? styles.boldText : styles.cellText

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
  return <View style={{ width, minHeight: ROW_MIN_HEIGHT, paddingVertical: 6 }} />
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
    <View style={styles.row}>
      <View style={[styles.headerBox, { width: W.totalTime }]}>
        <Text style={styles.headerText}>Total Time</Text>
      </View>
      <View style={[styles.headerBox, { width: W.program }]}>
        <Text style={styles.headerText}>Program Code & Description</Text>
      </View>
      <View style={[styles.headerBox, { width: W.activity }]}>
        <Text style={styles.headerText}>Activity Code & Description</Text>
      </View>
      <View style={[styles.headerBox, { width: W.support }]}>
        <Text style={styles.headerText}>Support Information</Text>
      </View>
    </View>
  )
}

function DateSection({ dateGroup }: { dateGroup: P110SSDateGroup }) {
  return (
    <View style={styles.dateSection}>
      <View style={styles.row}>
        <View style={[styles.dateHeaderCell, { width: W.totalTime }]}>
          <Text style={styles.boldText}>{dateGroup.date}</Text>
        </View>
        <View style={[styles.dateHeaderCell, { width: W.program }]} />
        <EmptyCell width={W.activity} />
        <View style={[styles.dateHeaderCell, { width: W.support }]}>
          <Text style={styles.centerText}>Employee notes:</Text>
        </View>
      </View>

      {dateGroup.records.map((record, index) => (
        <RecordRow key={`${dateGroup.date}-${record.program}-${index}`} record={record} />
      ))}

      <View style={styles.row}>
        <View style={[styles.dateTotalBox, { width: W.totalTime }]}>
          <Text style={styles.centerText}>{formatReportTime(dateGroup.totalTime)}</Text>
        </View>
        <EmptyCell width={W.program} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.support} />
      </View>
    </View>
  )
}

function RecordRow({ record }: { record: P110SSRecord }) {
  return (
    <View style={styles.row}>
      <Cell width={W.totalTime} align="center">
        {formatReportTime(record.activitytime)}
      </Cell>
      <Cell width={W.program} align="center">
        {record.program}
      </Cell>
      <Cell width={W.activity} align="center">
        {record.subactivity}
      </Cell>
      <Cell width={W.support} align="center">
        {record.description}
      </Cell>
    </View>
  )
}

function EmployeeTable({ employee }: { employee: P110SSGroupedEmployee }) {
  const grandTotal = getP110SSGrandTotal(employee)

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
        <View style={[styles.grandTotalBox, { width: W.totalTime }]}>
          <Text style={[styles.centerText, styles.boldText]}>{formatReportTime(grandTotal)}</Text>
        </View>
        <EmptyCell width={W.program} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.support} />
      </View>
    </View>
  )
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
        <Text
          style={styles.printedText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  )
}

function P110SSReportPage({
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

function P110SSReportDocument({
  employees,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: P110SSReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
  printedOn: string
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <P110SSReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <PeriodDates startDate={startDate} endDate={endDate} />
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </P110SSReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <P110SSReportPage
          key={`${employee.employeeId || employee.employeename}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          {index === 0 ? <PeriodDates startDate={startDate} endDate={endDate} /> : null}
          <EmployeeTable employee={employee} />
          <EmployeeFooter printedOn={printedOn} />
        </P110SSReportPage>
      ))}
    </Document>
  )
}

export async function generateP110SSReportPdf(props: P110SSReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "P110-SS" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <P110SSReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
