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

const TABLE_WIDTH = 544

const W = {
  program: 62,
  pct: 38,
  salary: 38,
  benefits: 38,
  time: 102,
} as const

const BOTTOM_W = {
  program: 150,
  percentage: 118,
  salary: 138,
  benefits: 138,
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
  bodyCell: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontSize: 6.5,
    textAlign: "left",
  },
  rightCell: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontSize: 6.5,
    textAlign: "right",
  },
  centerCell: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontSize: 6.5,
    textAlign: "center",
  },
  totalRow: {
    backgroundColor: "#f0f0f0",
    fontFamily: "Helvetica-Bold",
  },
  bottomSection: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  bottomLeft: {
    flexGrow: 1,
    maxWidth: BOTTOM_W.program + BOTTOM_W.percentage + BOTTOM_W.salary + BOTTOM_W.benefits,
  },
  bottomTable: {
    width: BOTTOM_W.program + BOTTOM_W.percentage + BOTTOM_W.salary + BOTTOM_W.benefits,
  },
  programCodesBox: {
    width: 170,
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
          <Text style={[styles.bodyCell, { width: W.program, fontFamily: "Helvetica-Bold" }]}>
            {program.program}
          </Text>
          <Text style={[styles.rightCell, { width: W.pct }]}>
            {formatQtrMonthPercentOne(program.totalEnhancedPercentageOfProgram)}
          </Text>
          <Text style={[styles.rightCell, { width: W.pct }]}>
            {formatQtrMonthPercentOne(program.totalnonEnhancedPercentageOfProgram)}
          </Text>
          <Text style={[styles.rightCell, { width: W.pct }]}>
            {formatQtrMonthPercentOne(program.totalnonClaimablePercentageOfProgram)}
          </Text>
          <Text style={[styles.rightCell, { width: W.pct }]}>
            {formatQtrMonthPercentOne(program.totalPercentageOfProgram)}
          </Text>
          <Text style={[styles.rightCell, { width: W.salary }]}>{formatQtrMonthMoney(program.salaryEnhanced)}</Text>
          <Text style={[styles.rightCell, { width: W.salary }]}>
            {formatQtrMonthMoney(program.salaryNonEnhanced)}
          </Text>
          <Text style={[styles.rightCell, { width: W.salary }]}>
            {formatQtrMonthMoney(program.salaryNonClaimable)}
          </Text>
          <Text style={[styles.rightCell, { width: W.benefits }]}>
            {formatQtrMonthMoney(program.benefitsEnhanced)}
          </Text>
          <Text style={[styles.rightCell, { width: W.benefits }]}>
            {formatQtrMonthMoney(program.benefitsNonEnhanced)}
          </Text>
          <Text style={[styles.rightCell, { width: W.benefits }]}>
            {formatQtrMonthMoney(program.benefitsNonClaimable)}
          </Text>
          <Text style={[styles.rightCell, { width: W.time }]}>
            {formatQtrMonthPercentTwo(program.percentageOfTimeWorked)}
          </Text>
        </View>
      ))}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={[styles.bodyCell, { width: W.program, fontFamily: "Helvetica-Bold" }]}>Total</Text>
        <Text style={[styles.rightCell, { width: W.pct }]} />
        <Text style={[styles.rightCell, { width: W.pct }]} />
        <Text style={[styles.rightCell, { width: W.pct }]} />
        <Text style={[styles.rightCell, { width: W.pct }]} />
        <Text style={[styles.rightCell, { width: W.salary }]}>
          {formatQtrMonthMoney(employee.totalSalaryEnhanced)}
        </Text>
        <Text style={[styles.rightCell, { width: W.salary }]}>
          {formatQtrMonthMoney(employee.totalSalaryNonEnhanced)}
        </Text>
        <Text style={[styles.rightCell, { width: W.salary }]}>
          {formatQtrMonthMoney(employee.totalSalaryNonClaimable)}
        </Text>
        <Text style={[styles.rightCell, { width: W.benefits }]}>
          {formatQtrMonthMoney(employee.totalBenefitsEnhanced)}
        </Text>
        <Text style={[styles.rightCell, { width: W.benefits }]}>
          {formatQtrMonthMoney(employee.totalBenefitsNonEnhanced)}
        </Text>
        <Text style={[styles.rightCell, { width: W.benefits }]}>
          {formatQtrMonthMoney(employee.totalBenefitsNonClaimable)}
        </Text>
        <Text style={[styles.rightCell, { width: W.time }]}>
          {formatQtrMonthPercentTwo(employee.totalPercentageOfTimeWorked)}
        </Text>
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
    <View style={styles.bottomSection}>
      <View style={styles.bottomLeft}>
        <View style={styles.bottomTable}>
          <View style={styles.row}>
            <Text
              style={[
                styles.headerCell,
                {
                  width:
                    BOTTOM_W.program + BOTTOM_W.percentage + BOTTOM_W.salary + BOTTOM_W.benefits,
                },
              ]}
            >
              Total time spent in each program: (For use by agencies without daily record of program
              time for entire invoice period)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { width: BOTTOM_W.program }]}>Program</Text>
            <Text style={[styles.headerCell, { width: BOTTOM_W.percentage }]}>
              Percentage of time worked in Program
            </Text>
            <Text style={[styles.headerCell, { width: BOTTOM_W.salary }]}>Salary</Text>
            <Text style={[styles.headerCell, { width: BOTTOM_W.benefits }]}>Benefits</Text>
          </View>
          {employee.programs.map((program, index) => {
            const row = getQtrMonthBottomRowValues(program, employee)
            return (
              <View key={`bottom-${program.programcode}-${index}`} style={styles.row}>
                <Text style={[styles.bodyCell, { width: BOTTOM_W.program, fontFamily: "Helvetica-Bold" }]}>
                  {program.program}
                </Text>
                <Text style={[styles.rightCell, { width: BOTTOM_W.percentage }]}>
                  {formatQtrMonthPercentTwo(row.percentage)}
                </Text>
                <Text style={[styles.rightCell, { width: BOTTOM_W.salary }]}>
                  {formatQtrMonthMoney(row.salary)}
                </Text>
                <Text style={[styles.rightCell, { width: BOTTOM_W.benefits }]}>
                  {formatQtrMonthMoney(row.benefits)}
                </Text>
              </View>
            )
          })}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={[styles.bodyCell, { width: BOTTOM_W.program, fontFamily: "Helvetica-Bold" }]}>
              Total
            </Text>
            <Text style={[styles.rightCell, { width: BOTTOM_W.percentage }]}>
              {formatQtrMonthPercentOne(totalPercentage)}
            </Text>
            <Text style={[styles.rightCell, { width: BOTTOM_W.salary }]}>
              {formatQtrMonthMoney(totalSalary)}
            </Text>
            <Text style={[styles.rightCell, { width: BOTTOM_W.benefits }]}>
              {formatQtrMonthMoney(totalBenefits)}
            </Text>
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
}: {
  employee: QtrMonthEmployee
  timeStudyPeriod: string
}) {
  return (
    <View>
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
          <EmployeeSection employee={employee} timeStudyPeriod={timeStudyPeriod} />
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
