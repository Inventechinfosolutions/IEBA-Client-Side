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
  formatDssrpt3MonthLabel,
  formatPrintedOnLabel,
  formatReportDisplayDate,
  formatReportTime,
  getDssrpt3FiscalQuarter,
  resolveFooterVariant,
  sortDssrpt3ByActivityCode,
  type Dssrpt3CostPool,
  type Dssrpt3ReportPayload,
  type DSSRPT3ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544

const W = {
  activityName: 109,
  code: 54,
  cwHours: 82,
  svHours: 54,
  totalHours: 54,
  fte: 54,
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
  periodLabel: {
    marginBottom: 10,
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  periodLabelText: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    minWidth: 36,
  },
  periodValue: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    width: TABLE_WIDTH,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  costPoolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  costPoolLabel: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    maxWidth: 48,
  },
  costPoolName: {
    fontSize: 7.2,
    marginLeft: 8,
  },
  headerCell: {
    paddingVertical: 5,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  bodyCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
    textAlign: "left",
  },
  boldCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    paddingLeft: 20,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  grandBoldCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    paddingLeft: 40,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  spacerRow: {
    height: 20,
  },
  grandDivider: {
    borderTopWidth: 2,
    borderTopColor: "#000000",
    marginTop: 24,
    marginBottom: 8,
    width: TABLE_WIDTH,
  },
  poolSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginVertical: 8,
    width: TABLE_WIDTH,
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function TableHeaderRow() {
  return (
    <View style={styles.row}>
      <View style={[styles.headerCell, { width: W.activityName }]}>
        <Text style={styles.headerText}>Activity Name</Text>
      </View>
      <View style={[styles.headerCell, { width: W.code }]}>
        <Text style={styles.headerText}>Code</Text>
      </View>
      <View style={[styles.headerCell, { width: W.cwHours }]}>
        <Text style={styles.headerText}>Case Worker Hours</Text>
      </View>
      <View style={[styles.headerCell, { width: W.svHours }]}>
        <Text style={styles.headerText}>Supervisor Hours</Text>
      </View>
      <View style={[styles.headerCell, { width: W.totalHours }]}>
        <Text style={styles.headerText}>Total Hours</Text>
      </View>
      <View style={[styles.headerCell, { width: W.fte }]}>
        <Text style={styles.headerText}>FTE</Text>
      </View>
    </View>
  )
}

function PeriodLabel({
  isMonthly,
  month,
  fiscalYear,
  dateFrom,
  dateTo,
}: {
  isMonthly: boolean
  month?: string
  fiscalYear: string
  dateFrom?: string
  dateTo?: string
}) {
  if (isMonthly) {
    return <Text style={styles.periodLabel}>{formatDssrpt3MonthLabel(month)}</Text>
  }

  const quarter = getDssrpt3FiscalQuarter(dateFrom)
  const periodStart = formatReportDisplayDate(dateFrom)
  const periodEnd = formatReportDisplayDate(dateTo)

  return (
    <View style={styles.periodRow}>
      <Text style={styles.periodLabelText}>FY/QTR:</Text>
      <Text style={styles.periodValue}>
        {fiscalYear}/{quarter}
      </Text>
      {periodStart ? (
        <>
          <Text style={styles.periodLabelText}>Start Date:</Text>
          <Text style={styles.periodValue}>{periodStart}</Text>
        </>
      ) : null}
      {periodEnd ? (
        <>
          <Text style={styles.periodLabelText}>End Date:</Text>
          <Text style={styles.periodValue}>{periodEnd}</Text>
        </>
      ) : null}
    </View>
  )
}

function CostPoolSection({ costpool }: { costpool: Dssrpt3CostPool }) {
  const sortedActivities = [...costpool.activities].sort(sortDssrpt3ByActivityCode)

  return (
    <View wrap={false}>
      <View style={styles.costPoolRow}>
        <Text style={styles.costPoolLabel}>Cost Pool:</Text>
        <Text style={styles.costPoolName}>{costpool.costpoolname}</Text>
      </View>

      <TableHeaderRow />

      {sortedActivities.map((activity, index) => (
        <View key={`${activity.activitycode}-${index}`}>
          <View style={styles.row}>
            <Text style={[styles.bodyCell, { width: W.activityName }]}>{activity.activityname}</Text>
            <Text style={[styles.bodyCell, { width: W.code }]}>{activity.activitycode}</Text>
            <Text style={[styles.bodyCell, { width: W.cwHours }]}>
              {formatReportTime(activity.caseworkeractivitytime)}
            </Text>
            <Text style={[styles.bodyCell, { width: W.svHours }]}>
              {formatReportTime(activity.supervisoractivitytime)}
            </Text>
            <Text style={[styles.bodyCell, { width: W.totalHours }]}>
              {formatReportTime(activity.totalactivitytime)}
            </Text>
            <Text style={[styles.bodyCell, { width: W.fte }]}>
              {formatReportTime(activity.totalfte)}
            </Text>
          </View>

          {index === sortedActivities.length - 1 ? (
            <>
              <View style={styles.row}>
                <Text style={[styles.boldCell, { width: W.activityName }]}>
                  Cost Pool Total Allocable
                </Text>
                <Text style={[styles.bodyCell, { width: W.code }]} />
                <Text style={[styles.bodyCell, { width: W.cwHours }]}>
                  {formatReportTime(costpool.caseworkertotalallochours)}
                </Text>
                <Text style={[styles.bodyCell, { width: W.svHours }]}>
                  {formatReportTime(costpool.supervisortotalallochours)}
                </Text>
                <Text style={[styles.bodyCell, { width: W.totalHours }]}>
                  {formatReportTime(costpool.totalallochours)}
                </Text>
                <Text style={[styles.bodyCell, { width: W.fte }]} />
              </View>

              <View style={styles.row}>
                <Text style={[styles.boldCell, { width: W.activityName }]}>
                  Cost Pool Total Non-Allocable
                </Text>
                <Text style={[styles.bodyCell, { width: W.code }]} />
                <Text style={[styles.bodyCell, { width: W.cwHours }]} />
                <Text style={[styles.bodyCell, { width: W.svHours }]} />
                <Text style={[styles.bodyCell, { width: W.totalHours }]}>
                  {formatReportTime(costpool.totalnonallochours)}
                </Text>
                <Text style={[styles.bodyCell, { width: W.fte }]} />
              </View>

              <View style={styles.row}>
                <Text style={[styles.boldCell, { width: W.activityName, paddingBottom: 20 }]}>
                  Cost Pool Number of FTEs
                </Text>
                <Text style={[styles.bodyCell, { width: W.code, paddingBottom: 20 }]} />
                <Text style={[styles.bodyCell, { width: W.cwHours, paddingBottom: 20 }]}>
                  {formatReportTime(costpool.caseworkertotalfte)}
                </Text>
                <Text style={[styles.bodyCell, { width: W.svHours, paddingBottom: 20 }]}>
                  {formatReportTime(costpool.supervisortotalfte)}
                </Text>
                <Text style={[styles.bodyCell, { width: W.totalHours, paddingBottom: 20 }]} />
                <Text style={[styles.bodyCell, { width: W.fte, paddingBottom: 20 }]}>
                  {formatReportTime(costpool.totalfte)}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      ))}

      <View style={styles.poolSeparator} />
    </View>
  )
}

function GrandTotals({ payload }: { payload: Dssrpt3ReportPayload }) {
  return (
    <View wrap={false}>
      <View style={styles.grandDivider} />

      <View style={styles.row}>
        <Text style={[styles.bodyCell, { width: W.activityName }]} />
        <Text style={[styles.bodyCell, { width: W.code }]} />
        <Text style={[styles.bodyCell, { width: W.cwHours }]}>CaseWorker</Text>
        <Text style={[styles.bodyCell, { width: W.svHours }]}>Supervisor</Text>
        <Text style={[styles.bodyCell, { width: W.totalHours }]}>Total</Text>
        <Text style={[styles.bodyCell, { width: W.fte }]} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.grandBoldCell, { width: W.activityName }]}>Grand Total Allocable</Text>
        <Text style={[styles.bodyCell, { width: W.code }]} />
        <Text style={[styles.bodyCell, { width: W.cwHours }]}>
          {formatReportTime(payload.granttotalcaseworkerallocable)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.svHours }]}>
          {formatReportTime(payload.granttotalsupervisorallocable)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.totalHours }]}>
          {formatReportTime(payload.granttotal)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.fte }]} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.grandBoldCell, { width: W.activityName }]}>
          Grand Total Non-Allocable
        </Text>
        <Text style={[styles.bodyCell, { width: W.code }]} />
        <Text style={[styles.bodyCell, { width: W.cwHours }]} />
        <Text style={[styles.bodyCell, { width: W.svHours }]} />
        <Text style={[styles.bodyCell, { width: W.totalHours }]}>
          {formatReportTime(payload.granttotalnonallocable)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.fte }]} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.grandBoldCell, { width: W.activityName }]}>Grand Total FTEs</Text>
        <Text style={[styles.bodyCell, { width: W.code }]} />
        <Text style={[styles.bodyCell, { width: W.cwHours }]}>
          {formatReportTime(payload.grantotalcaseworkerfte)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.svHours }]}>
          {formatReportTime(payload.grantotalsupervisorfte)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.totalHours }]}>
          {formatReportTime(payload.granttotalfte)}
        </Text>
        <Text style={[styles.bodyCell, { width: W.fte }]} />
      </View>
    </View>
  )
}

function DSSRPT3ReportDocument({
  payload,
  isMonthly,
  month,
  dateFrom,
  dateTo,
  printedOn,
  meta,
  footerVariant,
}: DSSRPT3ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const pagePadding = resolvePagePadding(footerVariant)
  const sortedCostPools = [...payload.costPools].sort((a, b) =>
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
          <PeriodLabel
            isMonthly={isMonthly}
            month={month}
            fiscalYear={payload.fiscalYear}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />

          {sortedCostPools.length === 0 ? (
            <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
          ) : (
            <View style={styles.table}>
              {sortedCostPools.map((costpool, index) => (
                <View key={`${costpool.costpoolname}-${index}`}>
                  <CostPoolSection costpool={costpool} />
                  {index === sortedCostPools.length - 1 ? <GrandTotals payload={payload} /> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export async function generateDSSRPT3ReportPdf(props: DSSRPT3ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "DSSRPT3" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <DSSRPT3ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
