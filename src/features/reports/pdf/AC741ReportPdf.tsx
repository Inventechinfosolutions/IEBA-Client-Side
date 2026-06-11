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
  getAc741EmployeeTotalHours,
  resolveFooterVariant,
  type Ac741Employee,
  type AC741ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const META_TABLE_WIDTH = 462
const DATA_TABLE_WIDTH = 381

const META_W = {
  batch: 92,
  pc: 92,
  idIndex: 92,
  empNo: 92,
  cls: 94,
} as const

const DATA_W = {
  job: 110,
  el: 60,
  workType: 131,
  hrs: 80,
} as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7.2,
  },
  content: {
    flexGrow: 1,
  },
  employeeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  employeeName: {
    fontSize: 7.2,
  },
  employeeNameLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  periodLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
  },
  periodValue: {
    fontSize: 7.2,
  },
  metaTable: {
    width: META_TABLE_WIDTH,
    marginBottom: 24,
  },
  dataTable: {
    width: DATA_TABLE_WIDTH,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
  },
  headerCell: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "lightgray",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  bodyCell: {
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 6.8,
    textAlign: "center",
  },
  rightCell: {
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 6.8,
    textAlign: "right",
  },
  totalLabelCell: {
    paddingTop: 24,
    paddingRight: 8,
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  totalValueCell: {
    marginTop: 24,
    backgroundColor: "lightgray",
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    borderWidth: 1,
    borderColor: "#000000",
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function EmployeeMetaTable({ employeeno }: { employeeno: string }) {
  return (
    <View style={styles.metaTable}>
      <View style={styles.row}>
        <Text style={[styles.headerCell, { width: META_W.batch }]}>Batch</Text>
        <Text style={[styles.headerCell, { width: META_W.pc }]}>PC</Text>
        <Text style={[styles.headerCell, { width: META_W.idIndex }]}>ID-INDEX</Text>
        <Text style={[styles.headerCell, { width: META_W.empNo }]}>EMP.NO.</Text>
        <Text style={[styles.headerCell, { width: META_W.cls }]}>CLS</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.bodyCell, { width: META_W.batch }]} />
        <Text style={[styles.bodyCell, { width: META_W.pc }]}>1</Text>
        <Text style={[styles.bodyCell, { width: META_W.idIndex }]} />
        <Text style={[styles.bodyCell, { width: META_W.empNo }]}>{employeeno}</Text>
        <Text style={[styles.bodyCell, { width: META_W.cls }]}>73</Text>
      </View>
    </View>
  )
}

function ProgramsTable({ employee }: { employee: Ac741Employee }) {
  const totalHours = getAc741EmployeeTotalHours(employee.programs)

  return (
    <View style={styles.dataTable}>
      <View style={styles.row}>
        <Text style={[styles.headerCell, { width: DATA_W.job }]}>JOB</Text>
        <Text style={[styles.headerCell, { width: DATA_W.el }]}>EL</Text>
        <Text style={[styles.headerCell, { width: DATA_W.workType }]}>WORK TYPE</Text>
        <Text style={[styles.headerCell, { width: DATA_W.hrs }]}>HRS WORKED</Text>
      </View>

      {employee.programs.map((program, index) => (
        <View key={`${program.program}-${program.subactivity}-${index}`} style={styles.row}>
          <Text style={[styles.bodyCell, { width: DATA_W.job }]}>{program.program}</Text>
          <Text style={[styles.bodyCell, { width: DATA_W.el }]} />
          <Text style={[styles.bodyCell, { width: DATA_W.workType }]}>{program.subactivity}</Text>
          <Text style={[styles.rightCell, { width: DATA_W.hrs }]}>
            {formatReportTime(program.activitytime)}
          </Text>
        </View>
      ))}

      <View style={styles.row}>
        <Text style={[styles.totalLabelCell, { width: DATA_W.job + DATA_W.el + DATA_W.workType }]}>
          Total Hours:
        </Text>
        <Text style={[styles.totalValueCell, { width: DATA_W.hrs }]}>
          {formatReportTime(totalHours)}
        </Text>
      </View>
    </View>
  )
}

function AC741ReportPage({
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
        titleColor="#1a5276"
      />
      <ReportPdfFooter variant={footerVariant} printedOn={printedOn} />
      <View style={styles.content}>{children}</View>
    </Page>
  )
}

function EmployeeSection({
  employee,
  startDate,
  endDate,
  showSignature,
  printedOn,
}: {
  employee: Ac741Employee
  startDate: string
  endDate: string
  showSignature: boolean
  printedOn?: string
}) {
  return (
    <>
      <View style={styles.employeeHeader}>
        <Text style={styles.employeeName}>
          <Text style={styles.employeeNameLabel}>Employee Name:</Text> {employee.employeename}
        </Text>
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>Period Starting:</Text>
          <Text style={styles.periodValue}>
            {startDate} - {endDate}
          </Text>
        </View>
      </View>

      <EmployeeMetaTable employeeno={employee.employeeno} />
      <ProgramsTable employee={employee} />

      {showSignature ? <ReportPdfEmployeeSignature printedOn={printedOn} /> : null}
    </>
  )
}

function AC741ReportDocument({
  employees,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: AC741ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <AC741ReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </AC741ReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <AC741ReportPage
          key={`${employee.employeeno}-${employee.employeename}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          <EmployeeSection
            employee={employee}
            startDate={startDate}
            endDate={endDate}
            showSignature={footerVariant === "signature"}
            printedOn={printedOn}
          />
        </AC741ReportPage>
      ))}
    </Document>
  )
}

export async function generateAC741ReportPdf(props: AC741ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "AC741" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <AC741ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
