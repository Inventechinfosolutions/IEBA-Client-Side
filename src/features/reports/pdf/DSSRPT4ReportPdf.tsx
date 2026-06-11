import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"

import { REPORT_PDF_DEFAULT_LOGOS } from "./reportPdfAssets"

import {
  ReportPdfFooter,
  ReportPdfHeader,
  resolvePagePadding,
} from "./ReportPdfChrome"
import {
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatDssrpt4EmployeeName,
  formatPrintedOnLabel,
  formatReportTime,
  resolveFooterVariant,
  type Dssrpt4CostPool,
  type Dssrpt4ReportPayload,
  type DSSRPT4ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544

const W = {
  employeeName: 152,
  alloc: 98,
  nonAlloc: 49,
  totalHours: 65,
  fte: 49,
  cost: 131,
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
  reportMeta: {
    marginBottom: 12,
    fontSize: 7.2,
  },
  metaLine: {
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.2,
  },
  table: {
    width: TABLE_WIDTH,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  costPoolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 4,
  },
  costPoolLabel: {
    fontSize: 7,
  },
  costPoolName: {
    fontSize: 7,
    marginLeft: 8,
  },
  headerCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  bodyCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 7,
    textAlign: "right",
  },
  leftCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 7,
    textAlign: "left",
  },
  employeeCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 7,
    textAlign: "left",
    fontFamily: "Helvetica",
  },
  boldLeftCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    paddingLeft: 20,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  grandHeaderCell: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    paddingLeft: 40,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  grandHeaderRight: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  grandDivider: {
    borderTopWidth: 2,
    borderTopColor: "#000000",
    marginTop: 16,
    marginBottom: 8,
    width: TABLE_WIDTH,
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function ReportMeta({ periodStarting, periodEnding }: { periodStarting: string; periodEnding: string }) {
  return (
    <View style={styles.reportMeta}>
      <Text style={styles.metaLine}>Report ID: DSSRPT4</Text>
      <Text style={styles.metaLine}>Period Starting: {periodStarting}</Text>
      <Text style={styles.metaLine}>Period Ending: {periodEnding}</Text>
    </View>
  )
}

function TableHeaderRow() {
  return (
    <View style={styles.row}>
      <Text style={[styles.headerCell, { width: W.employeeName, textAlign: "left" }]}>Employee Name</Text>
      <Text style={[styles.headerCell, { width: W.alloc }]}>Alloc.</Text>
      <Text style={[styles.headerCell, { width: W.nonAlloc }]}>Non-Alloc Hours</Text>
      <Text style={[styles.headerCell, { width: W.totalHours }]}>Total Hours</Text>
      <Text style={[styles.headerCell, { width: W.fte }]}>FTE</Text>
      <Text style={[styles.headerCell, { width: W.cost }]}>Cost</Text>
    </View>
  )
}

function CostPoolTable({ costpool }: { costpool: Dssrpt4CostPool }) {
  const employees = costpool.employees ?? []

  return (
    <View style={styles.table} wrap={false}>
      <View style={styles.costPoolRow}>
        <Text style={styles.costPoolLabel}>Cost Pool:</Text>
        <Text style={styles.costPoolName}>{costpool.costpoolname}</Text>
      </View>

      <TableHeaderRow />

      {employees.map((employee, index) => (
        <View key={`${employee.empname}-${index}`} style={styles.row}>
          <Text style={[styles.employeeCell, { width: W.employeeName }]}>
            {formatDssrpt4EmployeeName(employee.empname)}
          </Text>
          <Text style={[styles.bodyCell, { width: W.alloc }]}>{formatReportTime(employee.empalloc)}</Text>
          <Text style={[styles.bodyCell, { width: W.nonAlloc }]}>
            {formatReportTime(employee.empnonalloc)}
          </Text>
          <Text style={[styles.bodyCell, { width: W.totalHours }]}>{formatReportTime(employee.emptotal)}</Text>
          <Text style={[styles.bodyCell, { width: W.fte }]}>{formatReportTime(employee.empfte)}</Text>
          <Text style={[styles.bodyCell, { width: W.cost }]}>{formatReportTime(employee.empcost)}</Text>
        </View>
      ))}

      <View style={styles.row}>
        <Text style={[styles.boldLeftCell, { width: W.employeeName }]}>Cost Pool Totals:</Text>
        <Text style={[styles.bodyCell, { width: W.alloc, fontFamily: "Helvetica-Bold" }]}>
          {formatReportTime(costpool.totalcostpoolalloc)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.nonAlloc, fontFamily: "Helvetica-Bold" }]}>
          {formatReportTime(costpool.totalcostpoolnonalloc)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.totalHours, fontFamily: "Helvetica-Bold" }]}>
          {formatReportTime(costpool.totalcostpooltotal)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.fte, fontFamily: "Helvetica-Bold" }]}>
          {formatReportTime(costpool.totalfte)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.cost, fontFamily: "Helvetica-Bold" }]}>
          {formatReportTime(costpool.totalcost)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.boldLeftCell, { width: W.employeeName }]}>
          Overhead rate/charge/total:
        </Text>
        <Text style={[styles.leftCell, { width: W.alloc }]} />
        <Text style={[styles.leftCell, { width: W.nonAlloc }]} />
        <Text style={[styles.leftCell, { width: W.totalHours }]} />
        <Text style={[styles.leftCell, { width: W.fte }]} />
        <Text style={[styles.leftCell, { width: W.cost }]} />
      </View>
    </View>
  )
}

function GrandTotals({ payload }: { payload: Dssrpt4ReportPayload }) {
  return (
    <View wrap={false}>
      <View style={styles.grandDivider} />

      <View style={styles.row}>
        <Text style={[styles.grandHeaderCell, { width: W.employeeName }]}>Report Totals,All Pools</Text>
        <Text style={[styles.grandHeaderRight, { width: W.alloc }]}>Hours Alloc</Text>
        <Text style={[styles.grandHeaderRight, { width: W.nonAlloc }]}>Hours Non-Alloc</Text>
        <Text style={[styles.grandHeaderRight, { width: W.totalHours }]}>Hours Total</Text>
        <Text style={[styles.grandHeaderRight, { width: W.fte }]}>FTEs</Text>
        <Text style={[styles.grandHeaderRight, { width: W.cost }]}>Costs</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.grandHeaderCell, { width: W.employeeName }]} />
        <Text style={[styles.bodyCell, { width: W.alloc }]}>{formatReportTime(payload.grandtotalalloc)}</Text>
        <Text style={[styles.bodyCell, { width: W.nonAlloc }]}>
          {formatReportTime(payload.grandtotalnonalloc)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.totalHours }]}>{formatReportTime(payload.grandtotal)}</Text>
        <Text style={[styles.bodyCell, { width: W.fte }]}>{formatReportTime(payload.grandtotalfte)}</Text>
        <Text style={[styles.bodyCell, { width: W.cost }]}>{formatReportTime(payload.grandtotalcosts)}</Text>
      </View>
    </View>
  )
}

function DSSRPT4ReportDocument({
  payload,
  periodStarting,
  periodEnding,
  printedOn,
  meta,
  footerVariant,
}: DSSRPT4ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const pagePadding = resolvePagePadding(footerVariant)
  const sortedCostPools = [...payload.costpools].sort((a, b) =>
    a.costpoolname.localeCompare(b.costpoolname, undefined, { sensitivity: "base" }),
  )

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
        <View style={styles.content}>
          <ReportMeta periodStarting={periodStarting} periodEnding={periodEnding} />

          {sortedCostPools.length === 0 ? (
            <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
          ) : (
            <>
              {sortedCostPools.map((costpool, index) => (
                <View key={`${costpool.costpoolname}-${index}`}>
                  <CostPoolTable costpool={costpool} />
                  {index === sortedCostPools.length - 1 ? <GrandTotals payload={payload} /> : null}
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  )
}

export async function generateDSSRPT4ReportPdf(props: DSSRPT4ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "DSSRPT4" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <DSSRPT4ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
