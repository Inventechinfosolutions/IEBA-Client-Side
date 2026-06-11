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
  getP130GrandTotalHours,
  resolveFooterVariant,
  type P130Employee,
  type P130Program,
  type P130ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544
const TABLE_HEADER_TOP = 78
const TABLE_HEADER_HEIGHT = 22
/** Clears county header + repeating column header on pages 2+ */
const CONTENT_TOP = TABLE_HEADER_TOP + TABLE_HEADER_HEIGHT + 8

/** Normalized from template: 25% / 13% / 50% / 15% / 12% scaled to 544pt */
const W = {
  program: 118,
  employee: 63,
  activity: 237,
  hours: 71,
  percent: 55,
} as const

const COLUMNS = [
  { key: "program", width: W.program, label: "Program", align: "left" as const },
  { key: "employee", width: W.employee, label: "Employee", align: "left" as const },
  { key: "activity", width: W.activity, label: "Activity", align: "left" as const },
  { key: "hours", width: W.hours, label: "Hrs.", align: "center" as const },
  { key: "percent", width: W.percent, label: "%Time", align: "right" as const },
] as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  content: { flexGrow: 1 },
  programCodesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 4,
  },
  programCodesLabel: {
    minWidth: 90,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  programCodesValue: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  pageOneIntro: {
    marginBottom: 4,
  },
  tableHeaderFixed: {
    position: "absolute",
    top: TABLE_HEADER_TOP,
    left: 20,
    width: TABLE_WIDTH,
  },
  dates: { marginBottom: 10 },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  dateLabel: { fontFamily: "Helvetica-Bold", fontSize: 7 },
  dateValue: { fontFamily: "Helvetica-Bold", fontSize: 7 },
  table: { width: TABLE_WIDTH, marginTop: 4 },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    alignItems: "stretch",
  },
  headerRow: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    backgroundColor: "rgb(219, 219, 219)",
    minHeight: 18,
  },
  headerCell: {
    paddingVertical: 5,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  bodyCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  leftText: { fontSize: 7, lineHeight: 1.25 },
  centerText: { fontSize: 7, textAlign: "center", lineHeight: 1.25 },
  rightText: { fontSize: 7, textAlign: "right", lineHeight: 1.25 },
  boldText: { fontSize: 7, fontFamily: "Helvetica-Bold", lineHeight: 1.25 },
  subtotalLabelCell: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  subtotalValueCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  grandTotalLabelCell: {
    backgroundColor: "lightgray",
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  grandTotalHoursCell: {
    backgroundColor: "lightgray",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 3,
    justifyContent: "center",
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
  align?: "left" | "center" | "right"
  bold?: boolean
}) {
  const textStyle = bold
    ? styles.boldText
    : align === "center"
      ? styles.centerText
      : align === "right"
        ? styles.rightText
        : styles.leftText

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
  return <View style={{ width, paddingVertical: 4 }} />
}

function TableHeaderRow() {
  return (
    <View style={styles.headerRow}>
      {COLUMNS.map((column) => (
        <View key={column.key} style={[styles.headerCell, { width: column.width }]}>
          <Text
            style={[
              styles.headerText,
              column.align === "center"
                ? styles.centerText
                : column.align === "right"
                  ? styles.rightText
                  : styles.leftText,
            ]}
          >
            {column.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

function PageOneIntro({ children }: { children: ReactNode }) {
  return (
    <View
      style={styles.pageOneIntro}
      render={({ pageNumber }) => (pageNumber === 1 ? <View>{children}</View> : null)}
    />
  )
}

function RepeatingTableHeader() {
  return (
    <View
      style={styles.tableHeaderFixed}
      fixed
      render={({ pageNumber }) => (pageNumber > 1 ? <TableHeaderRow /> : null)}
    />
  )
}

function EmployeeSection({
  employee,
  isLastEmployee,
  program,
}: {
  employee: P130Employee
  isLastEmployee: boolean
  program: P130Program
}) {
  const activities = employee.activities

  return (
    <>
      {activities.map((activity, index) => (
        <View key={`${employee.employeename}-${activity.subactivity}-${index}`} style={styles.row}>
          <EmptyCell width={W.program} />
          {index === 0 ? (
            <Cell width={W.employee} bold>
              {employee.employeename}
            </Cell>
          ) : (
            <EmptyCell width={W.employee} />
          )}
          <Cell width={W.activity}>{activity.subactivity}</Cell>
          <Cell width={W.hours} align="center">
            {formatReportTime(activity.activitytime)}
          </Cell>
          <EmptyCell width={W.percent} />
        </View>
      ))}

      <View style={styles.row}>
        <EmptyCell width={W.program} />
        <EmptyCell width={W.employee} />
        <EmptyCell width={W.activity} />
        <Cell width={W.hours} align="center" bold>
          {formatReportTime(employee.employeeactivitytotal)}
        </Cell>
        <Cell width={W.percent} align="right">
          {employee.employeeactivitypercentage}
        </Cell>
      </View>

      {isLastEmployee ? (
        <View style={styles.row}>
          <EmptyCell width={W.program} />
          <EmptyCell width={W.employee} />
          <View style={[styles.subtotalLabelCell, { width: W.activity }]}>
            <Text style={[styles.boldText, styles.rightText]} wrap>
              {`Sub total of ${program.programcode}:`}
            </Text>
          </View>
          <View style={[styles.subtotalValueCell, { width: W.hours }]}>
            <Text style={[styles.boldText, styles.centerText]}>{formatReportTime(program.programtotal)}</Text>
          </View>
          <View style={[styles.subtotalValueCell, { width: W.percent }]}>
            <Text style={[styles.boldText, styles.rightText]}>
              {program.programtotalpercentage.toFixed(2)}%
            </Text>
          </View>
        </View>
      ) : null}
    </>
  )
}

function ProgramSection({ program }: { program: P130Program }) {
  return (
    <>
      <View style={styles.row}>
        <Cell width={W.program} bold>
          {program.program}
        </Cell>
        <EmptyCell width={W.employee} />
        <EmptyCell width={W.activity} />
        <EmptyCell width={W.hours} />
        <EmptyCell width={W.percent} />
      </View>

      {program.employees.map((employee, index) => (
        <EmployeeSection
          key={`${program.programcode}-${employee.employeename}-${index}`}
          employee={employee}
          isLastEmployee={index === program.employees.length - 1}
          program={program}
        />
      ))}
    </>
  )
}

function GrandTotalRow({ totalHours }: { totalHours: number }) {
  return (
    <View style={styles.row}>
      <EmptyCell width={W.program} />
      <EmptyCell width={W.employee} />
      <View style={[styles.grandTotalLabelCell, { width: W.activity }]}>
        <Text style={[styles.boldText, styles.rightText]}>Total of All Job Codes:</Text>
      </View>
      <View style={[styles.grandTotalHoursCell, { width: W.hours }]}>
        <Text style={[styles.boldText, styles.rightText]}>{formatReportTime(totalHours)}</Text>
      </View>
      <EmptyCell width={W.percent} />
    </View>
  )
}

function ReportMeta({
  programCodes,
  startDate,
  endDate,
}: {
  programCodes: string
  startDate: string
  endDate: string
}) {
  return (
    <>
      <View style={styles.programCodesRow}>
        <Text style={styles.programCodesLabel}>Program Codes:</Text>
        <Text style={styles.programCodesValue}>{programCodes}</Text>
      </View>
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
    </>
  )
}

function P130ReportDocument({
  programs,
  programCodes,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: P130ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
  printedOn: string
}) {
  const pagePadding = {
    ...resolvePagePadding(footerVariant),
    paddingTop: CONTENT_TOP,
  }
  const grandTotalHours = getP130GrandTotalHours(programs)

  return (
    <Document>
      <Page size="LETTER" style={[styles.page, pagePadding]} wrap>
        <ReportPdfHeader
          countyName={meta.countyName}
          reportTitle={meta.reportTitle}
          countyLogoSrc={meta.countyLogoSrc}
          rightLogoSrc={meta.rightLogoSrc}
        />
        <ReportPdfFooter variant={footerVariant} printedOn={printedOn} />
        <RepeatingTableHeader />
        <View style={styles.content}>
          <PageOneIntro>
            <ReportMeta programCodes={programCodes} startDate={startDate} endDate={endDate} />
          </PageOneIntro>
          <View render={({ pageNumber }) => (pageNumber === 1 ? <TableHeaderRow /> : null)} />

          {programs.length === 0 ? (
            <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
          ) : (
            <View style={styles.table}>
              {programs.map((program, index) => (
                <ProgramSection key={`${program.programcode}-${program.program}-${index}`} program={program} />
              ))}
              <GrandTotalRow totalHours={grandTotalHours} />
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export async function generateP130ReportPdf(props: P130ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "P130" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <P130ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
