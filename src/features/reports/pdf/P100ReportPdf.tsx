import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import { REPORT_PDF_DEFAULT_LOGOS } from "./reportPdfAssets"

import {
  ReportPdfEmployeeSignature,
  ReportPdfFooter,
  ReportPdfHeader,
  resolvePagePadding,
} from "./ReportPdfChrome"
import {
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatReportTime,
  getEmployeeGrandTotals,
  groupReportDataByEmployee,
  resolveFooterVariant,
  type GroupedEmployee,
  type P100ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544

const W = {
  employee: 96,
  activity: 192,
  ffp: 64,
  activityTime: 64,
  travelTime: 64,
  totalTime: 64,
} as const

const PAID_TIME_WIDTH = W.activity + W.ffp + W.activityTime + W.travelTime + W.totalTime

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7.2,
  },
  content: { flexGrow: 1 },
  dates: { marginBottom: 8 },
  dateRow: { flexDirection: "row", marginBottom: 2 },
  dateLabel: { width: 72, fontWeight: "bold", fontSize: 7.2 },
  dateValue: { fontWeight: "bold", fontSize: 7.2 },
  table: { width: TABLE_WIDTH },
  row: { flexDirection: "row", width: TABLE_WIDTH },
  cellText: { fontSize: 7.2 },
  headerBox: {
    backgroundColor: "rgb(219, 219, 219)",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 5,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  headerText: { fontSize: 7.2, fontWeight: "normal" },
  bodyBox: { paddingVertical: 2, paddingHorizontal: 2, justifyContent: "center" },
  boldText: { fontSize: 7.2, fontWeight: "bold" },
  centerText: { fontSize: 7.2, textAlign: "center" },
  rightText: { fontSize: 7.2, textAlign: "right" },
  programBox: { paddingTop: 8, paddingBottom: 2, paddingHorizontal: 2 },
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
    <View style={styles.row}>
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

function EmployeeTable({ employee }: { employee: GroupedEmployee }) {
  const grandTotals = getEmployeeGrandTotals(employee)

  return (
    <View style={styles.table}>
      <TableHeaderRow />

      <View style={styles.row}>
        <CellBox width={W.employee} bold>
          {employee.empname}
        </CellBox>
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.ffp} />
        <EmptyCell width={W.activityTime} />
        <EmptyCell width={W.travelTime} />
        <EmptyCell width={W.totalTime} />
      </View>

      <View style={styles.row}>
        <EmptyCell width={W.employee} />
        <CellBox width={PAID_TIME_WIDTH} bold>
          Paid Time
        </CellBox>
      </View>

      {employee.programs.map((program) => (
        <View key={`${employee.empname}-${program.program}`}>
          <View style={styles.row}>
            <EmptyCell width={W.employee} />
            <View style={[styles.programBox, { width: W.activity }]}>
              <Text style={styles.cellText}>{program.program}</Text>
            </View>
            <EmptyCell width={W.ffp} />
            <EmptyCell width={W.activityTime} />
            <EmptyCell width={W.travelTime} />
            <EmptyCell width={W.totalTime} />
          </View>

          {program.records.map((record, recordIndex) => (
            <View key={`${program.program}-${record.activity}-${recordIndex}`} style={styles.row}>
              <EmptyCell width={W.employee} />
              <CellBox width={W.activity}>{record.activity}</CellBox>
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
                {formatReportTime(Number(record.activitytime) + Number(record.traveltime))}
              </CellBox>
            </View>
          ))}

          <View style={styles.row}>
            <EmptyCell width={W.employee} />
            <EmptyCell width={W.activity} />
            <EmptyCell width={W.ffp} />
            <View style={[styles.subtotalBox, { width: W.activityTime }]}>
              <Text style={styles.rightText}>
                {formatReportTime(program.totalActivityTimeForProg)}
              </Text>
            </View>
            <View style={[styles.subtotalBox, { width: W.travelTime }]}>
              <Text style={styles.rightText}>{formatReportTime(program.totalTravelTime)}</Text>
            </View>
            <View style={[styles.subtotalBox, { width: W.totalTime }]}>
              <Text style={styles.rightText}>{formatReportTime(program.totalTime)}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={[styles.row, { marginTop: 16 }]}>
        <EmptyCell width={W.employee} />
        <CellBox width={W.activity} bold>
          Grand Totals:
        </CellBox>
        <EmptyCell width={W.ffp} />
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
      </View>
    </View>
  )
}

function P100ReportPage({
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
  const titleColor = meta.reportCode === "AC741" ? "#1a5276" : undefined

  return (
    <Page size="LETTER" style={[styles.page, pagePadding]} wrap>
      <ReportPdfHeader
        countyName={meta.countyName}
        reportTitle={meta.reportTitle}
        countyLogoSrc={meta.countyLogoSrc}
        rightLogoSrc={meta.rightLogoSrc}
        titleColor={titleColor}
      />
      <ReportPdfFooter variant={footerVariant} printedOn={printedOn} />
      <View style={styles.content}>{children}</View>
    </Page>
  )
}

function P100ReportDocument({
  records,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: P100ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const groupedEmployees = groupReportDataByEmployee(records)

  if (groupedEmployees.length === 0) {
    return (
      <Document>
        <P100ReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <PeriodDates startDate={startDate} endDate={endDate} />
          <Text style={styles.cellText}>No data available for the selected period.</Text>
        </P100ReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {groupedEmployees.map((employee, index) => (
        <P100ReportPage
          key={`${employee.empname}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          {index === 0 ? <PeriodDates startDate={startDate} endDate={endDate} /> : null}
          <EmployeeTable employee={employee} />
          {footerVariant === "signature" ? (
            <ReportPdfEmployeeSignature printedOn={printedOn} />
          ) : null}
        </P100ReportPage>
      ))}
    </Document>
  )
}

export async function generateP100ReportPdf(props: P100ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(props.meta, REPORT_PDF_DEFAULT_LOGOS)
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <P100ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
