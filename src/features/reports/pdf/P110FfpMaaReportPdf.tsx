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
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatReportTime,
  getP110CodeTypeGrandTotals,
  getP110FfpColumnValue,
  resolveFooterVariant,
  type P110CodeTypeTotal,
  type P110DateGroup,
  type P110GroupedEmployee,
  type P110Record,
  type P110ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544
const ROW_MIN_HEIGHT = 14
const TABLE_HEADER_TOP = 78
const EMPLOYEE_NAME_HEIGHT = 20
const TABLE_HEADER_HEIGHT = 24
/** Clears county header + employee name (page 1) + column header in fixed chrome */
const CONTENT_TOP = TABLE_HEADER_TOP + EMPLOYEE_NAME_HEIGHT + TABLE_HEADER_HEIGHT + 8

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
  tableHeaderFixed: {
    position: "absolute",
    top: TABLE_HEADER_TOP,
    left: 20,
    width: TABLE_WIDTH,
  },
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

function EmployeeTableChrome({ employeeName }: { employeeName: string }) {
  return (
    <View style={styles.tableHeaderFixed} fixed>
      <Text style={styles.employeeNameRow}>{employeeName}</Text>
      <ColumnHeaderRow />
    </View>
  )
}

function CodeTypeTotalRow({ codeTotal }: { codeTotal: P110CodeTypeTotal }) {
  return (
    <View style={styles.row} wrap={false}>
      <View style={[styles.dateTotalBox, { width: W.actTime }]}>
        <Text style={styles.rightText}>{formatReportTime(codeTotal.totalActivityTime)}</Text>
      </View>
      <View style={[styles.dateTotalBox, { width: W.tvlTime }]}>
        <Text style={styles.rightText}>{formatReportTime(codeTotal.totalTravelTime)}</Text>
      </View>
      <View style={[styles.dateTotalBox, { width: W.totalTime }]}>
        <Text style={styles.rightText}>{formatReportTime(codeTotal.totalTime)}</Text>
      </View>
      <View style={[styles.dateTotalBox, { width: W.program }]}>
        <Text style={[styles.leftText, styles.boldText]}>{codeTotal.label}</Text>
      </View>
      <EmptyCell width={W.activity} />
      <EmptyCell width={W.ffp} />
      <EmptyCell width={W.support} />
    </View>
  )
}

function RecordRow({ record }: { record: P110Record }) {
  return (
    <View style={styles.row} wrap={false}>
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
        {getP110FfpColumnValue(record)}
      </Cell>
      <Cell width={W.support}>{record.description}</Cell>
    </View>
  )
}

function DateSection({ dateGroup }: { dateGroup: P110DateGroup }) {
  // Allow busy days to paginate. wrap={false} on the whole day causes
  // @react-pdf to stack rows on top of each other when the block is taller
  // than one page. Keep only rows / grey totals atomic.
  return (
    <View style={styles.dateSection}>
      <View style={styles.row} wrap={false}>
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

      <View wrap={false}>
        {dateGroup.codeTypeTotals.map((codeTotal) => (
          <CodeTypeTotalRow key={`${dateGroup.date}-${codeTotal.label}`} codeTotal={codeTotal} />
        ))}
      </View>
    </View>
  )
}

function EmployeeTable({ employee }: { employee: P110GroupedEmployee }) {
  const codeTypeGrandTotals = getP110CodeTypeGrandTotals(employee)

  return (
    <View style={styles.table}>
      {employee.dates.map((dateGroup) => (
        <DateSection key={dateGroup.date} dateGroup={dateGroup} />
      ))}

      <View style={styles.spacer} />

      <View wrap={false}>
        {codeTypeGrandTotals.map((codeTotal) => (
          <View key={`grand-${codeTotal.label}`} style={styles.row} wrap={false}>
            <View style={[styles.grandTotalBox, { width: W.actTime }]}>
              <Text style={[styles.rightText, styles.boldText]}>
                {formatReportTime(codeTotal.totalActivityTime)}
              </Text>
            </View>
            <View style={[styles.grandTotalBox, { width: W.tvlTime }]}>
              <Text style={[styles.rightText, styles.boldText]}>
                {formatReportTime(codeTotal.totalTravelTime)}
              </Text>
            </View>
            <View style={[styles.grandTotalBox, { width: W.totalTime }]}>
              <Text style={[styles.rightText, styles.boldText]}>
                {formatReportTime(codeTotal.totalTime)}
              </Text>
            </View>
            <View style={[styles.grandTotalBox, { width: W.program }]}>
              <Text style={[styles.leftText, styles.boldText]}>{codeTotal.label}</Text>
            </View>
            <EmptyCell width={W.activity} />
            <EmptyCell width={W.ffp} />
            <EmptyCell width={W.support} />
          </View>
        ))}
      </View>
    </View>
  )
}

function P110FfpMaaReportPage({
  meta,
  footerVariant,
  printedOn,
  employeeName,
  children,
}: {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
  printedOn?: string
  employeeName?: string
  children: ReactNode
}) {
  const pagePadding = {
    ...resolvePagePadding(footerVariant),
    paddingTop: employeeName ? CONTENT_TOP : resolvePagePadding(footerVariant).paddingTop,
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
      {employeeName ? <EmployeeTableChrome employeeName={employeeName} /> : null}
      <View style={styles.content}>{children}</View>
    </Page>
  )
}

function P110FfpMaaReportDocument({
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
        <P110FfpMaaReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <PeriodDates startDate={startDate} endDate={endDate} />
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </P110FfpMaaReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <P110FfpMaaReportPage
          key={`${employee.employeeId || employee.employeename}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
          employeeName={employee.employeename}
        >
          {index === 0 ? <PeriodDates startDate={startDate} endDate={endDate} /> : null}
          <EmployeeTable employee={employee} />
          <EmployeeFooter />
        </P110FfpMaaReportPage>
      ))}
    </Document>
  )
}

/** P110-FFP_MAA — Time Study Daily with FFP/MAA code-type day and grand totals. */
export async function generateP110FfpMaaReportPdf(props: P110ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "P110-FFP_MAA" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <P110FfpMaaReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
