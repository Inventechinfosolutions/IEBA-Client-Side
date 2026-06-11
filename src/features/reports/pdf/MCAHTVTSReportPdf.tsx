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
  formatMcahTvtsEmployeeName,
  formatMcahTvtsHours,
  formatMcahTvtsPercent,
  formatPrintedOnLabel,
  resolveFooterVariant,
  type McahTvtsEmployee,
  type MCAHTVTSReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 300

const W = {
  week: 72,
  cat1: 56,
  cat2: 56,
  cat3: 56,
  total: 60,
} as const

const CATEGORY_TEXT = {
  cat1:
    "CATEGORY 1: Preventive & Primary Care Services for Children (PPCSC)Activities aimed at reducing the incidence of health problems or disease prevalence in the community, or the personal risk factors for such diseases or conditions and the provision of comprehensive personal health services that include health maintenance and preventive services, initial assessment of health problems, treatment of uncomplicated and diagnosed chronic health problems, and the overall management of an individual's health care services for a child 1 year old through 21 years old.",
  cat2:
    "CATEGORY 2: Children with Special Health Care Needs (CSHCN) Children with Special Health Care Needs are defined as infants and children from birth through 21st year who have or are at increased risk for a chronic physical, developmental, behavioral, or emotional condition and who also require health and related services of a type or amount beyond that required by children generally. This definition is broad and inclusive, and it emphasizes the characteristics held in common by children with a wide range of diagnoses which may include conditions such as, depression, attention deficit disorder, behavioral problems, asthma, diabetes, migraines or frequent headaches, head injury or traumatic brain injury, arthritis, joint problems, allergies, heart problems, autism, and intellectual disability.",
  cat3:
    "CATEGORY 3: Other Other should be used to report all Title V funded Local MCAH activities not reportable under Category 1 (PPCSC) or Category 2 (CYSHCN) that meet the MCAH scope of work objectives.",
} as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 24,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  content: {
    flexGrow: 1,
  },
  worksheetTitle: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginTop: 8,
    marginBottom: 12,
  },
  layoutRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  leftColumn: {
    width: "38%",
  },
  rightColumn: {
    width: "62%",
  },
  metaBlock: {
    paddingLeft: 24,
    marginBottom: 12,
  },
  metaLine: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    marginBottom: 6,
  },
  certText: {
    fontSize: 8,
    marginBottom: 12,
    lineHeight: 1.35,
  },
  hrLine: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    marginBottom: 12,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  signatureLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  table: {
    width: TABLE_WIDTH,
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  headerCell: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "rgb(219, 219, 219)",
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
  monthHeader: {
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textAlign: "left",
  },
  monthSubHeader: {
    padding: 4,
    fontSize: 6,
    textAlign: "center",
  },
  monthRowLabel: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textAlign: "left",
  },
  categoryText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function WeekTable({ employee }: { employee: McahTvtsEmployee }) {
  return (
    <View style={styles.table}>
      {employee.weeks.map((week, index) => (
        <View key={`week-block-${index}`}>
          <View style={styles.row}>
            <Text style={[styles.headerCell, { width: W.week }]}>Week {index + 1}</Text>
            <Text style={[styles.headerCell, { width: W.cat1 }]}>Category 1</Text>
            <Text style={[styles.headerCell, { width: W.cat2 }]}>Category 2</Text>
            <Text style={[styles.headerCell, { width: W.cat3 }]}>Category 3</Text>
            <Text style={[styles.headerCell, { width: W.total }]}>Total</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.bodyCell, { width: W.week }]}>{week.label || "0"}</Text>
            <Text style={[styles.rightCell, { width: W.cat1 }]}>{formatMcahTvtsHours(week.cat1)}</Text>
            <Text style={[styles.rightCell, { width: W.cat2 }]}>{formatMcahTvtsHours(week.cat2)}</Text>
            <Text style={[styles.rightCell, { width: W.cat3 }]}>{formatMcahTvtsHours(week.cat3)}</Text>
            <Text style={[styles.rightCell, { width: W.total }]}>{formatMcahTvtsHours(week.total)}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function MonthlySummaryTable({ employee }: { employee: McahTvtsEmployee }) {
  return (
    <View style={{ width: TABLE_WIDTH, marginTop: 4 }}>
      <View style={styles.row}>
        <Text style={[styles.monthHeader, { width: W.week }]}>Monthly</Text>
        <Text style={[styles.monthSubHeader, { width: W.cat1 }]}>CATEGORY 1</Text>
        <Text style={[styles.monthSubHeader, { width: W.cat2 }]}>CATEGORY 2</Text>
        <Text style={[styles.monthSubHeader, { width: W.cat3 }]}>CATEGORY 3</Text>
        <Text style={[styles.monthSubHeader, { width: W.total }]}>Total</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.monthRowLabel, { width: W.week }]}>TOTAL</Text>
        <Text style={[styles.rightCell, { width: W.cat1 }]}>
          {formatMcahTvtsHours(employee.category1Totals)}
        </Text>
        <Text style={[styles.rightCell, { width: W.cat2 }]}>
          {formatMcahTvtsHours(employee.category2Totals)}
        </Text>
        <Text style={[styles.rightCell, { width: W.cat3 }]}>
          {formatMcahTvtsHours(employee.category3Totals)}
        </Text>
        <Text style={[styles.rightCell, { width: W.total }]}>
          {formatMcahTvtsHours(employee.totalTotals)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.monthRowLabel, { width: W.week }]}>PERCENT</Text>
        <Text style={[styles.rightCell, { width: W.cat1 }]}>
          {formatMcahTvtsPercent(employee.category1Contribution)}
        </Text>
        <Text style={[styles.rightCell, { width: W.cat2 }]}>
          {formatMcahTvtsPercent(employee.category2Contribution)}
        </Text>
        <Text style={[styles.rightCell, { width: W.cat3 }]}>
          {formatMcahTvtsPercent(employee.category3Contribution)}
        </Text>
        <Text style={[styles.rightCell, { width: W.total }]}>
          {formatMcahTvtsPercent(employee.totalContribution)}
        </Text>
      </View>
    </View>
  )
}

function EmployeeLeftPanel({
  employee,
  countyName,
}: {
  employee: McahTvtsEmployee
  countyName: string
}) {
  return (
    <View style={styles.leftColumn}>
      <View style={styles.metaBlock}>
        <Text style={styles.metaLine}>TVTS MONTH: {employee.month}</Text>
        <Text style={[styles.metaLine, { paddingLeft: 24, paddingVertical: 6 }]}>
          Name: {formatMcahTvtsEmployeeName(employee.employeename)}
        </Text>
        <Text style={[styles.metaLine, { paddingLeft: 8 }]}>
          Budget Line: {employee.budgetLine}
        </Text>
        <Text style={[styles.metaLine, { paddingLeft: 16 }]}>
          Job Title: {employee.jobClassificationName}
        </Text>
        <Text style={[styles.metaLine, { paddingLeft: 16 }]}>
          Location: {employee.department}
        </Text>
        <Text style={[styles.metaLine, { paddingLeft: 20 }]}>Agency: {countyName}</Text>
      </View>

      <Text style={styles.certText}>
        I hereby certify that this is a true and accurate report of my time and that the categories
        were performed as shown.
      </Text>
      <View style={styles.hrLine} />
      <View style={styles.signatureRow}>
        <Text style={styles.signatureLabel}>Employee Signature:</Text>
        <Text style={styles.signatureLabel}>Date:</Text>
      </View>

      <Text style={styles.certText}>
        I hereby certify that the employee&apos;s time records have been examined and that, to the
        best of my knowledge, this time record is valid and correct and the categories were performed
        as shown.
      </Text>
      <View style={styles.hrLine} />
      <View style={styles.signatureRow}>
        <Text style={styles.signatureLabel}>Supervisor&apos;s Signature:</Text>
        <Text style={styles.signatureLabel}>Date:</Text>
      </View>
    </View>
  )
}

function EmployeeSection({
  employee,
  countyName,
}: {
  employee: McahTvtsEmployee
  countyName: string
}) {
  return (
    <View wrap={false}>
      <Text style={styles.worksheetTitle}>
        MONTHLY TITLE V TIME STUDY (TVTS) WORKSHEET MATERNAL, CHILD AND ADOLESCENT HEALTH (MCAH)
        DIVISION
      </Text>

      <View style={styles.layoutRow}>
        <EmployeeLeftPanel employee={employee} countyName={countyName} />
        <View style={styles.rightColumn}>
          <WeekTable employee={employee} />
          <MonthlySummaryTable employee={employee} />
        </View>
      </View>

      <Text style={[styles.categoryText, { marginTop: 12 }]}>{CATEGORY_TEXT.cat1}</Text>
      <Text style={styles.categoryText}>{CATEGORY_TEXT.cat2}</Text>
      <Text style={styles.categoryText}>{CATEGORY_TEXT.cat3}</Text>
    </View>
  )
}

function MCAHTVTSReportPage({
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

function MCAHTVTSReportDocument({
  employees,
  printedOn,
  meta,
  footerVariant,
}: MCAHTVTSReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <MCAHTVTSReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </MCAHTVTSReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <MCAHTVTSReportPage
          key={`${employee.employeename}-${employee.month}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          <EmployeeSection employee={employee} countyName={meta.countyName} />
        </MCAHTVTSReportPage>
      ))}
    </Document>
  )
}

export async function generateMCAHTVTSReportPdf(props: MCAHTVTSReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "MCAH-TVTS" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <MCAHTVTSReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
