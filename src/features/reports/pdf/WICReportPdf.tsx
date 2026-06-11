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
  computeWicColumnTotals,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatWicDisplayDate,
  formatWicEmployeeName,
  formatWicHours,
  getWicSubTotal,
  resolveFooterVariant,
  type WicDayRecord,
  type WicEmployee,
  type WICReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 752

const W = {
  date: 54,
  bfpc: 44,
  fmnp: 44,
  nutritional: 62,
  breastfeeding: 62,
  client: 54,
  generalAdmin: 58,
  subTotal: 50,
  nonSpecific: 54,
  totalWic: 54,
  others: 48,
  pto: 48,
  totalTime: 120,
} as const

const GRAY = "lightgray"

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 6.5,
  },
  content: {
    flexGrow: 1,
  },
  metaLine: {
    fontSize: 7.5,
    marginBottom: 6,
  },
  underlineField: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    fontSize: 7.5,
    marginBottom: 2,
  },
  metaCaption: {
    fontSize: 7.5,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    width: TABLE_WIDTH,
  },
  titleLeft: {
    width: "50%",
  },
  titleRight: {
    width: "40%",
    alignItems: "flex-end",
  },
  table: {
    width: TABLE_WIDTH,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  cell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    padding: 3,
    fontSize: 6,
    textAlign: "right",
  },
  headerCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    padding: 3,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    backgroundColor: GRAY,
  },
  groupHeader: {
    borderWidth: 1,
    borderColor: "lightslategray",
    padding: 3,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    backgroundColor: GRAY,
  },
  grayCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    padding: 3,
    fontSize: 6,
    textAlign: "right",
    backgroundColor: GRAY,
  },
  leftCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    padding: 3,
    fontSize: 6,
    textAlign: "left",
  },
  note: {
    marginTop: 14,
    marginBottom: 14,
    fontSize: 7,
  },
  totalsTable: {
    width: TABLE_WIDTH / 2,
    marginLeft: TABLE_WIDTH / 2,
    marginTop: 4,
  },
  totalsHeader: {
    backgroundColor: GRAY,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    padding: 5,
    textAlign: "center",
  },
  totalsCell: {
    backgroundColor: GRAY,
    fontSize: 7,
    padding: 5,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function WicDataRow({
  gray,
  width,
  value,
}: {
  gray?: boolean
  width: number
  value: string | number
}) {
  const style = gray ? styles.grayCell : styles.cell
  return (
    <Text style={[style, { width }]}>
      {value}
    </Text>
  )
}

function WicDayRow({ record }: { record: WicDayRecord }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.leftCell, { width: W.date }]}>{formatWicDisplayDate(record.date)}</Text>
      <WicDataRow width={W.bfpc} value={formatWicHours(record.BFPC)} gray />
      <WicDataRow width={W.fmnp} value={formatWicHours(record.FMNP)} gray />
      <WicDataRow width={W.nutritional} value={formatWicHours(record.NutritionalEducation)} />
      <WicDataRow width={W.breastfeeding} value={formatWicHours(record.BreastfeedingSupport)} />
      <WicDataRow width={W.client} value={formatWicHours(record.ClientServices)} />
      <WicDataRow width={W.generalAdmin} value={formatWicHours(record.GeneralAdministration)} />
      <WicDataRow width={W.subTotal} value={formatWicHours(getWicSubTotal(record))} gray />
      <WicDataRow width={W.nonSpecific} value={formatWicHours(record.NonSpecificTravel)} />
      <WicDataRow width={W.totalWic} value={formatWicHours(record.totalWicTime)} gray />
      <WicDataRow width={W.others} value={formatWicHours(record.others)} />
      <WicDataRow width={W.pto} value={formatWicHours(record.paidTimeOff)} />
      <WicDataRow width={W.totalTime} value={formatWicHours(record.TotalTime)} gray />
    </View>
  )
}

function WicMainTable({ records }: { records: WicDayRecord[] }) {
  const totals = computeWicColumnTotals(records)
  const subTotalGrand =
    totals.FMNP +
    totals.NutritionalEducation +
    totals.BreastfeedingSupport +
    totals.ClientServices +
    totals.GeneralAdministration

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.groupHeader, { width: W.date }]} />
        <Text style={[styles.groupHeader, { width: W.bfpc + W.fmnp }]}>NON_NSA GRANTS</Text>
        <Text
          style={[
            styles.groupHeader,
            {
              width:
                W.nutritional +
                W.breastfeeding +
                W.client +
                W.generalAdmin +
                W.subTotal,
            },
          ]}
        >
          NSA COST OBJECTIVES
        </Text>
        <Text style={[styles.groupHeader, { width: W.nonSpecific }]} />
        <Text style={[styles.groupHeader, { width: W.totalWic }]} />
        <Text style={[styles.groupHeader, { width: W.others }]} />
        <Text style={[styles.groupHeader, { width: W.pto }]} />
        <Text style={[styles.groupHeader, { width: W.totalTime }]} />
      </View>

      <View style={styles.row}>
        <Text style={[styles.headerCell, { width: W.date, textAlign: "left" }]}>Date</Text>
        <Text style={[styles.headerCell, { width: W.bfpc }]}>BFPC</Text>
        <Text style={[styles.headerCell, { width: W.fmnp }]}>FMNP</Text>
        <Text style={[styles.headerCell, { width: W.nutritional }]}>Nutritional Education</Text>
        <Text style={[styles.headerCell, { width: W.breastfeeding }]}>Breastfeeding Support</Text>
        <Text style={[styles.headerCell, { width: W.client }]}>Client Services</Text>
        <Text style={[styles.headerCell, { width: W.generalAdmin }]}>General Administration</Text>
        <Text style={[styles.headerCell, { width: W.subTotal }]}>SUB Total</Text>
        <Text style={[styles.headerCell, { width: W.nonSpecific }]}>Non Specific</Text>
        <Text style={[styles.headerCell, { width: W.totalWic }]}>Total WIC Time</Text>
        <Text style={[styles.headerCell, { width: W.others }]}>Others</Text>
        <Text style={[styles.headerCell, { width: W.pto }]}>Paid Time Off</Text>
        <Text style={[styles.headerCell, { width: W.totalTime }]}>Total Time (matches Time card)</Text>
      </View>

      {records.map((record, index) => (
        <WicDayRow key={`${record.date}-${index}`} record={record} />
      ))}

      <View style={styles.row}>
        <Text style={[styles.leftCell, { width: W.date, fontFamily: "Helvetica-Bold" }]}>Total Hours</Text>
        <Text style={[styles.grayCell, { width: W.bfpc }]}>**</Text>
        <Text style={[styles.grayCell, { width: W.fmnp }]}>{formatWicHours(totals.FMNP)}</Text>
        <Text style={[styles.grayCell, { width: W.nutritional }]}>
          {formatWicHours(totals.NutritionalEducation)}
        </Text>
        <Text style={[styles.grayCell, { width: W.breastfeeding }]}>
          {formatWicHours(totals.BreastfeedingSupport)}
        </Text>
        <Text style={[styles.grayCell, { width: W.client }]}>{formatWicHours(totals.ClientServices)}</Text>
        <Text style={[styles.grayCell, { width: W.generalAdmin }]}>
          {formatWicHours(totals.GeneralAdministration)}
        </Text>
        <Text style={[styles.grayCell, { width: W.subTotal }]}>{formatWicHours(subTotalGrand)}</Text>
        <Text style={[styles.grayCell, { width: W.nonSpecific }]}>
          {formatWicHours(totals.NonSpecificTravel)}
        </Text>
        <Text style={[styles.grayCell, { width: W.totalWic }]}>{formatWicHours(totals.totalWicTime)}</Text>
        <Text style={[styles.grayCell, { width: W.others }]}>{formatWicHours(totals.others)}</Text>
        <Text style={[styles.grayCell, { width: W.pto }]}>{formatWicHours(totals.paidTimeOff)}</Text>
        <Text style={[styles.grayCell, { width: W.totalTime }]}>{formatWicHours(totals.TotalTime)}</Text>
      </View>
    </View>
  )
}

function EmployeeSection({
  employee,
  countyName,
}: {
  employee: WicEmployee
  countyName: string
}) {
  const totals = computeWicColumnTotals(employee.tsrecords)
  const countyLabel = countyName || "Trinity"

  return (
    <View wrap={false}>
      <Text style={styles.metaLine}>{countyLabel} County Health & Human Services</Text>
      <Text style={styles.metaCaption}>Local Agency Name</Text>

      <Text style={styles.metaLine}>{countyLabel} County WIC Program</Text>
      <Text style={styles.metaCaption}>Office Name</Text>

      <View style={{ width: "30%", marginBottom: 8 }}>
        <Text style={styles.underlineField}>{formatWicEmployeeName(employee.username)}</Text>
        <Text style={styles.metaCaption}>Employee</Text>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.underlineField}>{employee.jobClassificationName}</Text>
          <Text style={styles.metaCaption}>Title</Text>
        </View>
        <View style={styles.titleRight}>
          <Text style={[styles.underlineField, { textAlign: "right" }]}>{employee.date}</Text>
          <Text style={[styles.metaCaption, { textAlign: "right" }]}>{employee.periodSubcaption}</Text>
        </View>
      </View>

      <WicMainTable records={employee.tsrecords} />

      <Text style={styles.note}>
        Overtime Hours should be included, if applicable, on this timesheet.
      </Text>

      <View style={styles.totalsTable}>
        <View style={styles.row}>
          <Text style={[styles.totalsHeader, { width: "33%" }]}>TL WIC</Text>
          <Text style={[styles.totalsHeader, { width: "34%" }]}>TL WIC & Others</Text>
          <Text style={[styles.totalsHeader, { width: "33%" }]} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.totalsCell, { width: "33%" }]}>
            {formatWicHours(totals.totalWicTime)} divided by
          </Text>
          <Text style={[styles.totalsCell, { width: "34%" }]}>
            {formatWicHours(employee.wic_others)} equals
          </Text>
          <Text style={[styles.totalsCell, { width: "33%" }]}>{employee.final}%</Text>
        </View>
      </View>
    </View>
  )
}

function WICReportPage({
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

function WICReportDocument({
  employees,
  printedOn,
  meta,
  footerVariant,
}: WICReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  if (employees.length === 0) {
    return (
      <Document>
        <WICReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </WICReportPage>
      </Document>
    )
  }

  return (
    <Document>
      {employees.map((employee, index) => (
        <WICReportPage
          key={`${employee.username}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          <EmployeeSection employee={employee} countyName={meta.countyName} />
        </WICReportPage>
      ))}
    </Document>
  )
}

export async function generateWICReportPdf(props: WICReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "WIC" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <WICReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
