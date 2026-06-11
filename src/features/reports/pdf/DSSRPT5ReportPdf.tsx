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
  formatDssrpt5Money,
  formatPrintedOnLabel,
  resolveFooterVariant,
  type Dssrpt5DateRow,
  type Dssrpt5ReportPayload,
  type DSSRPT5ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 752

const W = {
  checkDate: 44,
  emplId: 34,
  employee: 68,
  money: 43,
  subTotal: 44,
  grandTotal: 44,
} as const

const MONEY_KEYS = [
  "salary",
  "fica",
  "pers",
  "cafe",
  "stdlife",
  "defcomp",
  "spa",
  "cashout",
  "cellstipend",
  "ot",
  "recruitingincentive",
  "payout",
] as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 5.5,
  },
  content: {
    flexGrow: 1,
  },
  reportMeta: {
    marginBottom: 10,
  },
  metaLine: {
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
  },
  table: {
    width: TABLE_WIDTH,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  headerRow: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    borderStyle: "dotted",
    paddingBottom: 3,
    marginBottom: 2,
  },
  headerCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  centerCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 5.5,
    textAlign: "center",
  },
  rightCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 5.5,
    textAlign: "right",
  },
  leftCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 5.5,
    textAlign: "left",
  },
  labelCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 5.5,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  boldRight: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 5.5,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function ReportMeta({
  runDate,
  payrollQuarterFrom,
  payrollQuarterTo,
}: {
  runDate: string
  payrollQuarterFrom: string
  payrollQuarterTo: string
}) {
  return (
    <View style={styles.reportMeta}>
      <Text style={styles.metaLine}>Report ID: DSSRPT5</Text>
      <Text style={styles.metaLine}>Run Date: {runDate}</Text>
      <Text style={styles.metaLine}>
        Payroll Quarter: {payrollQuarterFrom} thru {payrollQuarterTo}
      </Text>
    </View>
  )
}

function TableHeaderRow() {
  return (
    <View style={styles.headerRow} fixed>
      <Text style={[styles.headerCell, { width: W.checkDate }]}>Check Date</Text>
      <Text style={[styles.headerCell, { width: W.emplId }]}>Empl ID</Text>
      <Text style={[styles.headerCell, { width: W.employee }]}>Employee</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>Salary</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>FICA</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>PERS</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>Cafe</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>STD/Life</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>Def Comp</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>SPA</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>Cash Out</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>Cell{"\n"}Stipend</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>OT</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>Recruiting{"\n"}Incentive</Text>
      <Text style={[styles.headerCell, { width: W.money }]}>Payout</Text>
      <Text style={[styles.headerCell, { width: W.subTotal }]}>Sub-Total</Text>
      <Text style={[styles.headerCell, { width: W.grandTotal }]}>Grand Total</Text>
    </View>
  )
}

function MoneyCells({ row }: { row: Dssrpt5DateRow }) {
  return (
    <>
      {MONEY_KEYS.map((key) => (
        <Text key={key} style={[styles.rightCell, { width: W.money }]}>
          {formatDssrpt5Money(row[key])}
        </Text>
      ))}
      <Text style={[styles.leftCell, { width: W.subTotal }]}>{formatDssrpt5Money(row.subtotal)}</Text>
      <Text style={[styles.leftCell, { width: W.grandTotal }]} />
    </>
  )
}

function EmployeeRows({ row }: { row: Dssrpt5DateRow }) {
  return (
    <View wrap={false}>
      <View style={styles.row}>
        <Text style={[styles.centerCell, { width: W.checkDate }]}>{row.date}</Text>
        <Text style={[styles.centerCell, { width: W.emplId }]}>{row.empid}</Text>
        <Text style={[styles.centerCell, { width: W.employee }]}>{row.empname}</Text>
        <MoneyCells row={row} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.centerCell, { width: W.checkDate }]} />
        <Text style={[styles.centerCell, { width: W.emplId }]} />
        <Text style={[styles.labelCell, { width: W.employee }]}>Standby wage/costs</Text>
        <Text style={[styles.rightCell, { width: W.money }]}>
          {formatDssrpt5Money(row.standbysalary)}
        </Text>
        <Text style={[styles.rightCell, { width: W.money }]}>
          {formatDssrpt5Money(row.standbyfica)}
        </Text>
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.leftCell, { width: W.subTotal }]}>
          {formatDssrpt5Money(row.standbysubtotal)}
        </Text>
        <Text style={[styles.leftCell, { width: W.grandTotal }]}>
          {formatDssrpt5Money(row.standbytotal)}
        </Text>
      </View>
    </View>
  )
}

function GrandTotalMoneyCells({ payload }: { payload: Dssrpt5ReportPayload }) {
  const values = [
    payload.gtsalary,
    payload.gtfica,
    payload.gtpers,
    payload.gtcafe,
    payload.gtstdLife,
    payload.gtdefComp,
    payload.gtspa,
    payload.gtCashout,
    payload.gtCellStipend,
    payload.gtOt,
    payload.gtRecruitingIncentive,
    payload.gtPayout,
  ]

  return (
    <>
      {values.map((value, index) => (
        <Text key={`gt-${index}`} style={[styles.boldRight, { width: W.money }]}>
          {formatDssrpt5Money(value)}
        </Text>
      ))}
      <Text style={[styles.boldRight, { width: W.subTotal }]}>
        {formatDssrpt5Money(payload.gtsubTotal)}
      </Text>
      <Text style={[styles.boldRight, { width: W.grandTotal }]}>
        {formatDssrpt5Money(payload.gtGrandTotal)}
      </Text>
    </>
  )
}

function GrandTotals({ payload }: { payload: Dssrpt5ReportPayload }) {
  return (
    <View wrap={false}>
      <View style={styles.row}>
        <Text style={[styles.labelCell, { width: W.checkDate + W.emplId }]}>Grand Totals</Text>
        <Text style={[styles.centerCell, { width: W.employee }]} />
        <GrandTotalMoneyCells payload={payload} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.centerCell, { width: W.checkDate }]} />
        <Text style={[styles.centerCell, { width: W.emplId }]} />
        <Text style={[styles.labelCell, { width: W.employee }]}>Standby wage/costs</Text>
        <Text style={[styles.boldRight, { width: W.money }]}>
          {formatDssrpt5Money(payload.gtStandbySalary)}
        </Text>
        <Text style={[styles.boldRight, { width: W.money }]}>
          {formatDssrpt5Money(payload.gtStandbyFica)}
        </Text>
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.rightCell, { width: W.money }]} />
        <Text style={[styles.boldRight, { width: W.subTotal }]}>
          {formatDssrpt5Money(payload.gtStandbySubtotal)}
        </Text>
        <Text style={[styles.boldRight, { width: W.grandTotal }]}>
          {formatDssrpt5Money(payload.gtStandbyGrandtotal)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.centerCell, { width: W.checkDate }]} />
        <Text style={[styles.centerCell, { width: W.emplId }]} />
        <Text style={[styles.labelCell, { width: W.employee }]}>Total Salary&Fica</Text>
        <Text style={[styles.boldRight, { width: W.money }]}>
          {formatDssrpt5Money(payload.gtSalaryFicaSalary)}
        </Text>
        <Text style={[styles.boldRight, { width: W.money }]}>
          {formatDssrpt5Money(payload.gtSalaryFicaFica)}
        </Text>
        {Array.from({ length: 10 }).map((_, index) => (
          <Text key={`salary-fica-empty-${index}`} style={[styles.rightCell, { width: W.money }]} />
        ))}
        <Text style={[styles.rightCell, { width: W.subTotal }]} />
        <Text style={[styles.rightCell, { width: W.grandTotal }]} />
      </View>
    </View>
  )
}

function DSSRPT5ReportDocument({
  payload,
  runDate,
  payrollQuarterFrom,
  payrollQuarterTo,
  printedOn,
  meta,
  footerVariant,
}: DSSRPT5ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const pagePadding = resolvePagePadding(footerVariant)

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={[styles.page, pagePadding]} wrap>
        <ReportPdfHeader
          countyName={meta.countyName}
          reportTitle={meta.reportTitle}
          countyLogoSrc={meta.countyLogoSrc}
          rightLogoSrc={meta.rightLogoSrc}
        />
        <ReportPdfFooter variant={footerVariant} printedOn={printedOn} />
        <View style={styles.content}>
          <ReportMeta
            runDate={runDate}
            payrollQuarterFrom={payrollQuarterFrom}
            payrollQuarterTo={payrollQuarterTo}
          />

          {payload.dates.length === 0 ? (
            <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
          ) : (
            <View style={styles.table}>
              <TableHeaderRow />
              {payload.dates.map((row, index) => (
                <EmployeeRows key={`${row.empid}-${index}`} row={row} />
              ))}
              <GrandTotals payload={payload} />
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export async function generateDSSRPT5ReportPdf(props: DSSRPT5ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "DSSRPT5" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <DSSRPT5ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
