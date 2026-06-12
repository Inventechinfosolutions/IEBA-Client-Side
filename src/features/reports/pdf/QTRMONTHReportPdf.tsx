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
  formatQtrMonthEmployeeName,
  formatQtrMonthMoney,
  formatQtrMonthPercentOne,
  formatQtrMonthPercentTwo,
  getQtrMonthBottomRowValues,
  resolveFooterVariant,
  type QtrMonthEmployee,
  type QTRMONTHReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 752
const PROGRAM_CODES_WIDTH = 168
const BOTTOM_TABLE_WIDTH = TABLE_WIDTH - PROGRAM_CODES_WIDTH - 12

const W = {
  program: 88,
  pct: 52,
  salary: 53,
  benefits: 53,
  time: 138,
} as const

const BOTTOM_W = {
  program: 158,
  percentage: 124,
  salary: 145,
  benefits: 145,
} as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  content: {
    flexGrow: 1,
  },
  reportHeaderLine: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    marginBottom: 4,
  },
  intro: {
    marginTop: 10,
    marginBottom: 12,
    fontSize: 7.5,
  },
  introIndented: {
    marginLeft: 20,
    marginTop: 2,
    fontSize: 7.5,
  },
  table: {
    width: TABLE_WIDTH,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  headerCell: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#d3d3d3",
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textAlign: "center",
    justifyContent: "center",
  },
  headerGroup: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#d3d3d3",
  },
  headerGroupTitle: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textAlign: "center",
  },
  tableCell: {
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 3,
    minHeight: 14,
    justifyContent: "center",
  },
  bodyCellText: {
    fontSize: 6.5,
    textAlign: "left",
  },
  rightCellText: {
    fontSize: 6.5,
    textAlign: "right",
  },
  centerCellText: {
    fontSize: 6.5,
    textAlign: "center",
  },
  totalRow: {
    backgroundColor: "#f0f0f0",
    fontFamily: "Helvetica-Bold",
  },
  bottomSection: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    marginTop: 8,
  },
  bottomLeft: {
    width: BOTTOM_TABLE_WIDTH,
    marginRight: 12,
  },
  bottomTable: {
    width: BOTTOM_TABLE_WIDTH,
  },
  programCodesBox: {
    width: PROGRAM_CODES_WIDTH,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 8,
  },
  programCodesTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textAlign: "center",
    marginBottom: 8,
  },
  programCodeItem: {
    fontSize: 7,
    marginBottom: 4,
  },
  programCodeTotal: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function TableCell({
  width,
  children,
  align = "left",
  bold,
  shaded,
}: {
  width: number
  children?: ReactNode
  align?: "left" | "center" | "right"
  bold?: boolean
  shaded?: boolean
}) {
  const textStyle =
    align === "right"
      ? styles.rightCellText
      : align === "center"
        ? styles.centerCellText
        : styles.bodyCellText

  return (
    <View
      style={[
        styles.tableCell,
        { width },
        shaded ? styles.totalRow : null,
      ]}
    >
      {children != null && children !== "" ? (
        <Text style={bold ? [textStyle, { fontFamily: "Helvetica-Bold" }] : textStyle}>{children}</Text>
      ) : null}
    </View>
  )
}

function MainTableHeader() {
  const pctWidth = W.pct * 4
  const salaryWidth = W.salary * 3
  const benefitsWidth = W.benefits * 3

  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.headerCell, { width: W.program, minHeight: 42, justifyContent: "center" }]}>
          <Text>Program</Text>
        </View>
        <View style={[styles.headerGroup, { width: pctWidth }]}>
          <Text style={styles.headerGroupTitle}>Percentage</Text>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { width: W.pct, borderTopWidth: 0, borderLeftWidth: 0 }]}>Enhanced</Text>
            <Text style={[styles.headerCell, { width: W.pct, borderTopWidth: 0 }]}>Non-Enhanced</Text>
            <Text style={[styles.headerCell, { width: W.pct, borderTopWidth: 0 }]}>Not Claimable</Text>
            <Text style={[styles.headerCell, { width: W.pct, borderTopWidth: 0, borderRightWidth: 0 }]}>Total</Text>
          </View>
        </View>
        <View style={[styles.headerGroup, { width: salaryWidth }]}>
          <Text style={styles.headerGroupTitle}>Salary</Text>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { width: W.salary, borderTopWidth: 0, borderLeftWidth: 0 }]}>Enhanced</Text>
            <Text style={[styles.headerCell, { width: W.salary, borderTopWidth: 0 }]}>Non-Enhanced</Text>
            <Text style={[styles.headerCell, { width: W.salary, borderTopWidth: 0, borderRightWidth: 0 }]}>
              Non-Claimable
            </Text>
          </View>
        </View>
        <View style={[styles.headerGroup, { width: benefitsWidth }]}>
          <Text style={styles.headerGroupTitle}>Benefits</Text>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { width: W.benefits, borderTopWidth: 0, borderLeftWidth: 0 }]}>Enhanced</Text>
            <Text style={[styles.headerCell, { width: W.benefits, borderTopWidth: 0 }]}>Non-Enhanced</Text>
            <Text style={[styles.headerCell, { width: W.benefits, borderTopWidth: 0, borderRightWidth: 0 }]}>
              Non-Claimable
            </Text>
          </View>
        </View>
        <View style={[styles.headerCell, { width: W.time, minHeight: 42, justifyContent: "center" }]}>
          <Text>Percentage of time worked in program</Text>
        </View>
      </View>
    </View>
  )
}

function MainTable({ employee }: { employee: QtrMonthEmployee }) {
  return (
    <View style={styles.table}>
      <MainTableHeader />
      {employee.programs.map((program, index) => (
        <View key={`${program.programcode}-${index}`} style={styles.row}>
          <TableCell width={W.program} bold>
            {program.program}
          </TableCell>
          <TableCell width={W.pct} align="right">
            {formatQtrMonthPercentOne(program.totalEnhancedPercentageOfProgram)}
          </TableCell>
          <TableCell width={W.pct} align="right">
            {formatQtrMonthPercentOne(program.totalnonEnhancedPercentageOfProgram)}
          </TableCell>
          <TableCell width={W.pct} align="right">
            {formatQtrMonthPercentOne(program.totalnonClaimablePercentageOfProgram)}
          </TableCell>
          <TableCell width={W.pct} align="right">
            {formatQtrMonthPercentOne(program.totalPercentageOfProgram)}
          </TableCell>
          <TableCell width={W.salary} align="right">
            {formatQtrMonthMoney(program.salaryEnhanced)}
          </TableCell>
          <TableCell width={W.salary} align="right">
            {formatQtrMonthMoney(program.salaryNonEnhanced)}
          </TableCell>
          <TableCell width={W.salary} align="right">
            {formatQtrMonthMoney(program.salaryNonClaimable)}
          </TableCell>
          <TableCell width={W.benefits} align="right">
            {formatQtrMonthMoney(program.benefitsEnhanced)}
          </TableCell>
          <TableCell width={W.benefits} align="right">
            {formatQtrMonthMoney(program.benefitsNonEnhanced)}
          </TableCell>
          <TableCell width={W.benefits} align="right">
            {formatQtrMonthMoney(program.benefitsNonClaimable)}
          </TableCell>
          <TableCell width={W.time} align="right">
            {formatQtrMonthPercentTwo(program.percentageOfTimeWorked)}
          </TableCell>
        </View>
      ))}
      <View style={styles.row}>
        <TableCell width={W.program} bold shaded>
          Total
        </TableCell>
        <TableCell width={W.pct} align="right" shaded />
        <TableCell width={W.pct} align="right" shaded />
        <TableCell width={W.pct} align="right" shaded />
        <TableCell width={W.pct} align="right" shaded />
        <TableCell width={W.salary} align="right" shaded>
          {formatQtrMonthMoney(employee.totalSalaryEnhanced)}
        </TableCell>
        <TableCell width={W.salary} align="right" shaded>
          {formatQtrMonthMoney(employee.totalSalaryNonEnhanced)}
        </TableCell>
        <TableCell width={W.salary} align="right" shaded>
          {formatQtrMonthMoney(employee.totalSalaryNonClaimable)}
        </TableCell>
        <TableCell width={W.benefits} align="right" shaded>
          {formatQtrMonthMoney(employee.totalBenefitsEnhanced)}
        </TableCell>
        <TableCell width={W.benefits} align="right" shaded>
          {formatQtrMonthMoney(employee.totalBenefitsNonEnhanced)}
        </TableCell>
        <TableCell width={W.benefits} align="right" shaded>
          {formatQtrMonthMoney(employee.totalBenefitsNonClaimable)}
        </TableCell>
        <TableCell width={W.time} align="right" shaded>
          {formatQtrMonthPercentTwo(employee.totalPercentageOfTimeWorked)}
        </TableCell>
      </View>
    </View>
  )
}

function BottomSection({ employee }: { employee: QtrMonthEmployee }) {
  let totalPercentage = 0
  let totalSalary = 0
  let totalBenefits = 0
  let totalHours = 0

  employee.programs.forEach((program) => {
    const row = getQtrMonthBottomRowValues(program, employee)
    totalPercentage += row.percentage
    totalSalary += row.salary
    totalBenefits += row.benefits
    totalHours += program.totalProgramHrs
  })

  return (
    <View style={styles.bottomSection} wrap={false}>
      <View style={styles.bottomLeft}>
        <View style={styles.bottomTable}>
          <View style={styles.row}>
            <View
              style={[
                styles.headerCell,
                { width: BOTTOM_TABLE_WIDTH, minHeight: 24, justifyContent: "center" },
              ]}
            >
              <Text style={{ fontSize: 6.5, textAlign: "center", fontFamily: "Helvetica-Bold" }}>
                Total time spent in each program: (For use by agencies without daily record of
                program time for entire invoice period)
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.headerCell, { width: BOTTOM_W.program }]}>
              <Text style={{ fontSize: 6.5, textAlign: "center", fontFamily: "Helvetica-Bold" }}>
                Program
              </Text>
            </View>
            <View style={[styles.headerCell, { width: BOTTOM_W.percentage }]}>
              <Text style={{ fontSize: 6.5, textAlign: "center", fontFamily: "Helvetica-Bold" }}>
                Percentage of time worked in Program
              </Text>
            </View>
            <View style={[styles.headerCell, { width: BOTTOM_W.salary }]}>
              <Text style={{ fontSize: 6.5, textAlign: "center", fontFamily: "Helvetica-Bold" }}>
                Salary
              </Text>
            </View>
            <View style={[styles.headerCell, { width: BOTTOM_W.benefits }]}>
              <Text style={{ fontSize: 6.5, textAlign: "center", fontFamily: "Helvetica-Bold" }}>
                Benefits
              </Text>
            </View>
          </View>
          {employee.programs.map((program, index) => {
            const row = getQtrMonthBottomRowValues(program, employee)
            return (
              <View key={`bottom-${program.programcode}-${index}`} style={styles.row}>
                <TableCell width={BOTTOM_W.program} bold>
                  {program.program}
                </TableCell>
                <TableCell width={BOTTOM_W.percentage} align="right">
                  {formatQtrMonthPercentTwo(row.percentage)}
                </TableCell>
                <TableCell width={BOTTOM_W.salary} align="right">
                  {formatQtrMonthMoney(row.salary)}
                </TableCell>
                <TableCell width={BOTTOM_W.benefits} align="right">
                  {formatQtrMonthMoney(row.benefits)}
                </TableCell>
              </View>
            )
          })}
          <View style={styles.row}>
            <TableCell width={BOTTOM_W.program} bold shaded>
              Total
            </TableCell>
            <TableCell width={BOTTOM_W.percentage} align="right" shaded>
              {formatQtrMonthPercentOne(totalPercentage)}
            </TableCell>
            <TableCell width={BOTTOM_W.salary} align="right" shaded>
              {formatQtrMonthMoney(totalSalary)}
            </TableCell>
            <TableCell width={BOTTOM_W.benefits} align="right" shaded>
              {formatQtrMonthMoney(totalBenefits)}
            </TableCell>
          </View>
        </View>
      </View>

      <View style={styles.programCodesBox}>
        <Text style={styles.programCodesTitle}>Program Codes & Hours</Text>
        {employee.programs.map((program, index) => (
          <Text key={`code-${program.programcode}-${index}`} style={styles.programCodeItem}>
            {program.programcode}: {program.totalProgramHrs.toFixed(2)} hours
          </Text>
        ))}
        <Text style={styles.programCodeTotal}>Total Hours: {totalHours.toFixed(2)}</Text>
      </View>
    </View>
  )
}

function EmployeeSection({
  employee,
  timeStudyPeriod,
  countyName,
}: {
  employee: QtrMonthEmployee
  timeStudyPeriod: string
  countyName: string
}) {
  return (
    <View>
      {countyName ? (
        <Text style={styles.reportHeaderLine}>County: {countyName}</Text>
      ) : null}
      <Text style={styles.reportHeaderLine}>Time Study Period: {timeStudyPeriod}</Text>
      <Text style={styles.reportHeaderLine}>
        Name of Employee: {formatQtrMonthEmployeeName(employee.employeeName)}
      </Text>
      {employee.classification ? (
        <Text style={styles.reportHeaderLine}>Classification: {employee.classification}</Text>
      ) : null}

      <View style={styles.intro}>
        <Text>The following percentages have been generated for each program:</Text>
        <Text style={styles.introIndented}>
          (For use by agencies with daily record of program time for the entire invoice period)
        </Text>
      </View>

      <MainTable employee={employee} />
      <BottomSection employee={employee} />
    </View>
  )
}

function QTRMONTHReportPage({
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
    <Page size="LETTER" orientation="landscape" style={[styles.page, pagePadding]} wrap>
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

function QTRMONTHReportDocument({
  employees,
  timeStudyPeriod,
  printedOn,
  meta,
  footerVariant,
}: QTRMONTHReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <QTRMONTHReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </QTRMONTHReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <QTRMONTHReportPage
          key={`${employee.employeeName}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          <EmployeeSection
            employee={employee}
            timeStudyPeriod={timeStudyPeriod}
            countyName={meta.countyName}
          />
        </QTRMONTHReportPage>
      ))}
    </Document>
  )
}

export async function generateQTRMONTHReportPdf(props: QTRMONTHReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "QTR-MONTH" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <QTRMONTHReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
