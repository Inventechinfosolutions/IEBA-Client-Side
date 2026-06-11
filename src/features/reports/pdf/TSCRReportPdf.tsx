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
  chunkTscrProgramPairs,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatTscrBenefitsPercent,
  formatTscrBudgetValue,
  formatTscrMoneyTotal,
  formatTscrPositiveNumber,
  formatTscrPositivePercent,
  formatTscrPositivePercentSum,
  formatTscrPositiveSum,
  resolveFooterVariant,
  type TscrProgramRecord,
  type TscrEmployee,
  type TSCRReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const CONTENT_WIDTH = 544
const CARD_WIDTH = 266
const CARD_GAP = 12

const W = {
  label: 98,
  total: 42,
  nonMatch: 42,
  nonEnh: 42,
  enh: 42,
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
  employeeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    maxWidth: CONTENT_WIDTH,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  totalBox: {
    borderWidth: 1,
    borderColor: "#000000",
    borderTopWidth: 1,
    paddingRight: 16,
    paddingTop: 2,
    paddingBottom: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  gridRow: {
    flexDirection: "row",
    gap: CARD_GAP,
    marginBottom: 10,
    width: CONTENT_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "rgb(245, 245, 245)",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
  },
  cardRow: {
    flexDirection: "row",
    width: CARD_WIDTH - 8,
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  cardHeaderRow: {
    flexDirection: "row",
    width: CARD_WIDTH - 8,
    marginBottom: 2,
  },
  programName: {
    width: W.label,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    paddingRight: 4,
    borderRightWidth: 1,
    borderRightColor: "#000000",
  },
  headerMetric: {
    width: W.total,
    fontSize: 7,
    textAlign: "center",
  },
  labelCell: {
    width: W.label,
    fontSize: 7,
    justifyContent: "center",
    paddingVertical: 2,
  },
  labelCellBold: {
    width: W.label,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    justifyContent: "center",
    paddingVertical: 2,
  },
  valueCell: {
    width: W.total,
    fontSize: 7,
    textAlign: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  grayHeaderCell: {
    width: W.total,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    backgroundColor: "rgb(219, 219, 219)",
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#000000",
  },
  grayHeaderLabel: {
    width: W.label,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "rgb(219, 219, 219)",
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#000000",
  },
  tsBox: {
    width: W.nonMatch + W.nonEnh,
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tsPercentBox: {
    width: W.enh,
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  budgetBox: {
    width: W.nonMatch + W.nonEnh,
    fontSize: 6,
    textAlign: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  budgetPercentBox: {
    width: W.enh,
    fontSize: 6,
    textAlign: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function MetricHeader() {
  return (
    <>
      <Text style={[styles.headerMetric, { width: W.total }]}>TOT HRS</Text>
      <Text style={[styles.headerMetric, { width: W.nonMatch }]}>Non Match</Text>
      <Text style={[styles.headerMetric, { width: W.nonEnh }]}>Non Enh</Text>
      <Text style={[styles.headerMetric, { width: W.enh }]}>Enh</Text>
    </>
  )
}

function DataRow({
  label,
  values,
  boldLabel = false,
}: {
  label: string
  values: [string, string, string, string]
  boldLabel?: boolean
}) {
  const labelStyle = boldLabel ? styles.labelCellBold : styles.labelCell
  return (
    <View style={styles.cardRow}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={[styles.valueCell, { width: W.total }]}>{values[0]}</Text>
      <Text style={[styles.valueCell, { width: W.nonMatch }]}>{values[1]}</Text>
      <Text style={[styles.valueCell, { width: W.nonEnh }]}>{values[2]}</Text>
      <Text style={[styles.valueCell, { width: W.enh }]}>{values[3]}</Text>
    </View>
  )
}

function ProgramCard({ record }: { record: TscrProgramRecord }) {
  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.programName}>{record.program_name}</Text>
        <MetricHeader />
      </View>

      <DataRow
        label="Total Hours="
        values={[
          formatTscrPositiveSum(record.prog_nonm_hrs, record.prog_none_hrs, record.prog_enh_hrs),
          formatTscrPositiveNumber(record.prog_nonm_hrs),
          formatTscrPositiveNumber(record.prog_none_hrs),
          formatTscrPositiveNumber(record.prog_enh_hrs),
        ]}
      />
      <DataRow
        label="% of Prog Hours="
        values={[
          formatTscrPositivePercentSum(record.nonm_perc, record.none_perc, record.enh_perc),
          formatTscrPositivePercent(record.nonm_perc),
          formatTscrPositivePercent(record.none_perc),
          formatTscrPositivePercent(record.enh_perc),
        ]}
      />
      <DataRow
        label="DISCOUNTED HRS="
        boldLabel
        values={[
          formatTscrPositiveSum(record.dis_nonm_hrs, record.dis_none_hrs, record.dis_enh_hrs),
          formatTscrPositiveNumber(record.dis_nonm_hrs),
          formatTscrPositiveNumber(record.dis_none_hrs),
          formatTscrPositiveNumber(record.dis_enh_hrs),
        ]}
      />
      <DataRow
        label="% of Prog Hours="
        boldLabel
        values={[
          formatTscrPositivePercentSum(record.dis_nonm_perc, record.dis_none_perc, record.dis_enh_perc),
          formatTscrPositivePercent(record.dis_nonm_perc),
          formatTscrPositivePercent(record.dis_none_perc),
          formatTscrPositivePercent(record.dis_enh_perc),
        ]}
      />

      <View style={styles.cardRow}>
        <Text style={styles.grayHeaderLabel}>Discount S&B&apos;s</Text>
        <Text style={styles.grayHeaderCell}>Total</Text>
        <Text style={[styles.grayHeaderCell, { width: W.nonMatch }]}>Non Match</Text>
        <Text style={[styles.grayHeaderCell, { width: W.nonEnh }]}>Non Enh</Text>
        <Text style={[styles.grayHeaderCell, { width: W.enh }]}>Enh</Text>
      </View>

      <DataRow
        label="SALARY"
        values={[
          formatTscrPositiveNumber(record.salary_total),
          formatTscrPositiveNumber(record.salary_nonm),
          formatTscrPositiveNumber(record.salary_none),
          formatTscrPositiveNumber(record.salary_enh),
        ]}
      />
      <DataRow
        label="BENEFITS"
        values={[
          formatTscrPositiveNumber(record.benefits_total),
          formatTscrPositiveNumber(record.benefits_nonm),
          formatTscrPositiveNumber(record.benefits_none),
          formatTscrPositiveNumber(record.benefits_enh),
        ]}
      />
      <DataRow
        label="TOTAL S&B's"
        values={[
          formatTscrMoneyTotal(record.salary_total, record.benefits_total),
          formatTscrMoneyTotal(record.salary_nonm, record.benefits_nonm),
          formatTscrMoneyTotal(record.salary_none, record.benefits_none),
          formatTscrMoneyTotal(record.salary_enh, record.benefits_enh),
        ]}
      />

      <View style={styles.cardRow}>
        <Text style={styles.labelCell}>% of Ben:</Text>
        <Text style={[styles.valueCell, { width: W.total }]}>
          {formatTscrBenefitsPercent(record.salary_total, record.benefits_total)}
        </Text>
        <Text style={[styles.labelCell, { width: W.nonMatch, fontSize: 6 }]}>TS hrs & % time:</Text>
        <Text style={styles.tsBox}>{record.proghrs !== null && record.proghrs !== undefined ? String(record.proghrs) : ""}</Text>
        <Text style={styles.tsPercentBox}>
          {record.time_perc !== null && record.time_perc !== undefined ? `${record.time_perc}%` : ""}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.labelCell}>MC Factor:</Text>
        <Text style={[styles.valueCell, { width: W.total }]}>{`${record.medical_pct}%`}</Text>
        <Text style={[styles.labelCell, { width: W.nonMatch, fontSize: 6 }]}>Budgeted hrs and % time:</Text>
        <Text style={styles.budgetBox}>{formatTscrBudgetValue(record.budget_hrs)}</Text>
        <Text style={styles.budgetPercentBox}>{formatTscrBudgetValue(record.budget_perc)}</Text>
      </View>
    </View>
  )
}

function EmployeeSection({
  employee,
  startDate,
  endDate,
}: {
  employee: TscrEmployee
  startDate: string
  endDate: string
}) {
  const pairs = chunkTscrProgramPairs(employee.tsrecords)

  return (
    <View>
      <View style={styles.employeeHeader}>
        <Text style={styles.bold}>{employee.full_name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={styles.bold}>Total. Hrs Time Studied:</Text>
          <Text style={styles.totalBox}>{employee.totalts}</Text>
        </View>
        <Text style={styles.bold}>
          {startDate} - {endDate}
        </Text>
      </View>

      {pairs.map(([left, right], index) => (
        <View key={`pair-${index}`} style={styles.gridRow}>
          <ProgramCard record={left} />
          {right ? <ProgramCard record={right} /> : <View style={{ width: CARD_WIDTH }} />}
        </View>
      ))}
    </View>
  )
}

function TSCRReportPage({
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

function TSCRReportDocument({
  employees,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: TSCRReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <TSCRReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </TSCRReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <TSCRReportPage
          key={`${employee.full_name}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          <EmployeeSection employee={employee} startDate={startDate} endDate={endDate} />
        </TSCRReportPage>
      ))}
    </Document>
  )
}

export async function generateTSCRReportPdf(props: TSCRReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "TSCR" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <TSCRReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
