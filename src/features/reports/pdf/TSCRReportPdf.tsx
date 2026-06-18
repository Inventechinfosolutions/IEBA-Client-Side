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
  formatTscrEmployeeName,
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
const CARD_WIDTH = CONTENT_WIDTH / 2
/** Header rule ends ~78pt; keep content tight underneath */
const TSCR_CONTENT_TOP = 80

const W = {
  label: 112,
  col: 40,
} as const

const CARD_BG = "rgb(245, 245, 245)"

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  content: {
    flexGrow: 1,
    marginTop: 0,
  },
  employeeBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: CONTENT_WIDTH * 0.95,
    paddingVertical: 0,
    marginBottom: 2,
  },
  employeeNameText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingHorizontal: 2,
    maxWidth: "32%",
    flexShrink: 0,
  },
  totalHrsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  dateRange: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    paddingHorizontal: 2,
    textAlign: "right",
    maxWidth: "32%",
  },
  totalBox: {
    paddingRight: 8,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
    minWidth: 40,
  },
  dataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: CONTENT_WIDTH * 0.99,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: CARD_BG,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.25,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.4,
    borderColor: "#000000",
  },
  cardRow: {
    flexDirection: "row",
    width: CARD_WIDTH,
    alignItems: "stretch",
  },
  programNameCell: {
    width: W.label,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    justifyContent: "center",
  },
  metricHeadCell: {
    width: W.col,
    fontSize: 7,
    textAlign: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  labelCell: {
    width: W.label,
    fontSize: 7,
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: "center",
    textAlign: "left",
  },
  labelCellBold: {
    width: W.label,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: "center",
    textAlign: "left",
  },
  valueCell: {
    width: W.col,
    fontSize: 7,
    textAlign: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  rowTopBorder: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  rowBottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  rowTopBottomBorder: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  discountHeaderLabel: {
    width: W.label,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    paddingVertical: 3,
    paddingHorizontal: 3,
    justifyContent: "center",
    textAlign: "left",
  },
  discountHeaderValue: {
    width: W.col,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },
  tsLabelCell: {
    width: W.col,
    fontSize: 5.5,
    paddingVertical: 2,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  tsValueBox: {
    width: W.col,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
  },
  tsPercentBox: {
    width: W.col,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 4,
    fontSize: 9,
    textAlign: "center",
    justifyContent: "center",
  },
  budgetLabelCell: {
    width: W.col,
    fontSize: 5.5,
    paddingVertical: 2,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  budgetValueBox: {
    width: W.col,
    borderLeftWidth: 1,
    borderColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 4,
    fontSize: 5.5,
    textAlign: "center",
    justifyContent: "center",
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function MetricHeader() {
  return (
    <>
      <Text style={styles.metricHeadCell}>TOT HRS</Text>
      <Text style={styles.metricHeadCell}>Non Match</Text>
      <Text style={styles.metricHeadCell}>Non Enh</Text>
      <Text style={styles.metricHeadCell}>Enh</Text>
    </>
  )
}

function DataRow({
  label,
  values,
  boldLabel = false,
  rowStyle,
}: {
  label: string
  values: [string, string, string, string]
  boldLabel?: boolean
  rowStyle?:
    | typeof styles.rowTopBorder
    | typeof styles.rowBottomBorder
    | typeof styles.rowTopBottomBorder
}) {
  const labelStyle = boldLabel ? styles.labelCellBold : styles.labelCell
  return (
    <View style={rowStyle ? [styles.cardRow, rowStyle] : styles.cardRow}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={styles.valueCell}>{values[0]}</Text>
      <Text style={styles.valueCell}>{values[1]}</Text>
      <Text style={styles.valueCell}>{values[2]}</Text>
      <Text style={styles.valueCell}>{values[3]}</Text>
    </View>
  )
}

function ProgramCard({ record }: { record: TscrProgramRecord }) {
  const proghrs =
    record.proghrs !== null && record.proghrs !== undefined ? String(record.proghrs) : ""
  const timePerc =
    record.time_perc !== null && record.time_perc !== undefined ? `${record.time_perc}%` : ""

  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.cardRow}>
        <Text style={styles.programNameCell}>{record.program_name}</Text>
        <MetricHeader />
      </View>

      <DataRow
        rowStyle={styles.rowTopBorder}
        label="Total Hours="
        values={[
          formatTscrPositiveSum(record.prog_nonm_hrs, record.prog_none_hrs, record.prog_enh_hrs),
          formatTscrPositiveNumber(record.prog_nonm_hrs),
          formatTscrPositiveNumber(record.prog_none_hrs),
          formatTscrPositiveNumber(record.prog_enh_hrs),
        ]}
      />
      <DataRow
        rowStyle={styles.rowBottomBorder}
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

      <View style={[styles.cardRow, styles.rowTopBottomBorder]}>
        <Text style={styles.discountHeaderLabel}>Discount S&B&apos;s</Text>
        <Text style={styles.discountHeaderValue}>Total</Text>
        <Text style={styles.discountHeaderValue}>Non Match</Text>
        <Text style={styles.discountHeaderValue}>Non Enh</Text>
        <Text style={styles.discountHeaderValue}>Enh</Text>
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
        rowStyle={styles.rowBottomBorder}
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
        <Text style={styles.valueCell}>
          {formatTscrBenefitsPercent(record.salary_total, record.benefits_total)}
        </Text>
        <Text style={styles.tsLabelCell}>TS hrs & % time:</Text>
        <Text style={styles.tsValueBox}>{proghrs}</Text>
        <Text style={styles.tsPercentBox}>{timePerc}</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.labelCell}>MC Factor:</Text>
        <Text style={styles.valueCell}>{`${record.medical_pct}%`}</Text>
        <Text style={styles.budgetLabelCell}>Budgeted hrs and % time:</Text>
        <Text style={styles.budgetValueBox}>{formatTscrBudgetValue(record.budget_hrs)}</Text>
        <Text style={styles.budgetValueBox}>{formatTscrBudgetValue(record.budget_perc)}</Text>
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
      <View style={styles.employeeBar}>
        <Text style={styles.employeeNameText}>
          {formatTscrEmployeeName(employee.full_name)}
        </Text>
        <View style={styles.totalHrsGroup}>
          <Text style={styles.bold}>Total. Hrs Time Studied:</Text>
          <Text style={styles.totalBox}>{employee.totalts}</Text>
        </View>
        <Text style={styles.dateRange}>
          {startDate} - {endDate}
        </Text>
      </View>

      <View style={styles.dataGrid}>
        {pairs.map(([left, right], index) => (
          <View key={`pair-${index}`} style={{ flexDirection: "row", width: CONTENT_WIDTH * 0.99 }}>
            <ProgramCard record={left} />
            {right ? <ProgramCard record={right} /> : <View style={{ width: CARD_WIDTH }} />}
          </View>
        ))}
      </View>
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
    <Page
      size="LETTER"
      style={[styles.page, pagePadding, { paddingTop: TSCR_CONTENT_TOP }]}
      wrap
    >
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
