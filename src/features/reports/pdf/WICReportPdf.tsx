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
    minHeight: 14,
  },
  cell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: 14,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 6,
    textAlign: "right",
  },
  headerCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: 14,
    justifyContent: "center",
    backgroundColor: GRAY,
  },
  headerText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  groupHeader: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: 14,
    justifyContent: "center",
    backgroundColor: GRAY,
  },
  grayCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: 14,
    justifyContent: "center",
    backgroundColor: GRAY,
  },
  leftCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: 14,
    justifyContent: "center",
  },
  leftCellText: {
    fontSize: 6,
    textAlign: "left",
  },
  metaBlock: {
    marginBottom: 8,
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

function WicTableCell({
  width,
  value,
  align = "right",
  gray,
  bold,
}: {
  width: number
  value: string | number
  align?: "left" | "center" | "right"
  gray?: boolean
  bold?: boolean
}) {
  const boxStyle = gray ? styles.grayCell : align === "left" ? styles.leftCell : styles.cell
  const textStyle =
    align === "left"
      ? styles.leftCellText
      : align === "center"
        ? [styles.headerText, { textAlign: "center" as const }]
        : styles.cellText

  return (
    <View style={[boxStyle, { width }]}>
      <Text style={bold ? [textStyle, { fontFamily: "Helvetica-Bold" }] : textStyle}>{value}</Text>
    </View>
  )
}

function WicDayRow({ record }: { record: WicDayRecord }) {
  return (
    <View style={styles.row} wrap={false}>
      <WicTableCell width={W.date} value={formatWicDisplayDate(record.date)} align="left" />
      <WicTableCell width={W.bfpc} value={formatWicHours(record.BFPC)} gray />
      <WicTableCell width={W.fmnp} value={formatWicHours(record.FMNP)} gray />
      <WicTableCell width={W.nutritional} value={formatWicHours(record.NutritionalEducation)} />
      <WicTableCell width={W.breastfeeding} value={formatWicHours(record.BreastfeedingSupport)} />
      <WicTableCell width={W.client} value={formatWicHours(record.ClientServices)} />
      <WicTableCell width={W.generalAdmin} value={formatWicHours(record.GeneralAdministration)} />
      <WicTableCell width={W.subTotal} value={formatWicHours(getWicSubTotal(record))} gray />
      <WicTableCell width={W.nonSpecific} value={formatWicHours(record.NonSpecificTravel)} />
      <WicTableCell width={W.totalWic} value={formatWicHours(record.totalWicTime)} gray />
      <WicTableCell width={W.others} value={formatWicHours(record.others)} />
      <WicTableCell width={W.pto} value={formatWicHours(record.paidTimeOff)} />
      <WicTableCell width={W.totalTime} value={formatWicHours(record.TotalTime)} gray />
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
      <View style={styles.row} wrap={false}>
        <View style={[styles.groupHeader, { width: W.date }]} />
        <View style={[styles.groupHeader, { width: W.bfpc + W.fmnp, justifyContent: "center" }]}>
          <Text style={styles.headerText}>NON_NSA GRANTS</Text>
        </View>
        <View
          style={[
            styles.groupHeader,
            {
              width:
                W.nutritional +
                W.breastfeeding +
                W.client +
                W.generalAdmin +
                W.subTotal,
              justifyContent: "center",
            },
          ]}
        >
          <Text style={styles.headerText}>NSA COST OBJECTIVES</Text>
        </View>
        <View style={[styles.groupHeader, { width: W.nonSpecific }]} />
        <View style={[styles.groupHeader, { width: W.totalWic }]} />
        <View style={[styles.groupHeader, { width: W.others }]} />
        <View style={[styles.groupHeader, { width: W.pto }]} />
        <View style={[styles.groupHeader, { width: W.totalTime }]} />
      </View>

      <View style={styles.row} wrap={false}>
        <View style={[styles.headerCell, { width: W.date }]}>
          <Text style={[styles.headerText, { textAlign: "left" }]}>Date</Text>
        </View>
        <View style={[styles.headerCell, { width: W.bfpc }]}>
          <Text style={styles.headerText}>BFPC</Text>
        </View>
        <View style={[styles.headerCell, { width: W.fmnp }]}>
          <Text style={styles.headerText}>FMNP</Text>
        </View>
        <View style={[styles.headerCell, { width: W.nutritional }]}>
          <Text style={styles.headerText}>Nutritional Education</Text>
        </View>
        <View style={[styles.headerCell, { width: W.breastfeeding }]}>
          <Text style={styles.headerText}>Breastfeeding Support</Text>
        </View>
        <View style={[styles.headerCell, { width: W.client }]}>
          <Text style={styles.headerText}>Client Services</Text>
        </View>
        <View style={[styles.headerCell, { width: W.generalAdmin }]}>
          <Text style={styles.headerText}>General Administration</Text>
        </View>
        <View style={[styles.headerCell, { width: W.subTotal }]}>
          <Text style={styles.headerText}>SUB Total</Text>
        </View>
        <View style={[styles.headerCell, { width: W.nonSpecific }]}>
          <Text style={styles.headerText}>Non Specific</Text>
        </View>
        <View style={[styles.headerCell, { width: W.totalWic }]}>
          <Text style={styles.headerText}>Total WIC Time</Text>
        </View>
        <View style={[styles.headerCell, { width: W.others }]}>
          <Text style={styles.headerText}>Others</Text>
        </View>
        <View style={[styles.headerCell, { width: W.pto }]}>
          <Text style={styles.headerText}>Paid Time Off</Text>
        </View>
        <View style={[styles.headerCell, { width: W.totalTime }]}>
          <Text style={styles.headerText}>Total Time (matches Time card)</Text>
        </View>
      </View>

      {records.map((record, index) => (
        <WicDayRow key={`${record.date}-${index}`} record={record} />
      ))}

      <View style={styles.row} wrap={false}>
        <WicTableCell width={W.date} value="Total Hours" align="left" bold />
        <WicTableCell width={W.bfpc} value={formatWicHours(totals.BFPC)} gray />
        <WicTableCell width={W.fmnp} value={formatWicHours(totals.FMNP)} gray />
        <WicTableCell width={W.nutritional} value={formatWicHours(totals.NutritionalEducation)} gray />
        <WicTableCell width={W.breastfeeding} value={formatWicHours(totals.BreastfeedingSupport)} gray />
        <WicTableCell width={W.client} value={formatWicHours(totals.ClientServices)} gray />
        <WicTableCell width={W.generalAdmin} value={formatWicHours(totals.GeneralAdministration)} gray />
        <WicTableCell width={W.subTotal} value={formatWicHours(subTotalGrand)} gray />
        <WicTableCell width={W.nonSpecific} value={formatWicHours(totals.NonSpecificTravel)} gray />
        <WicTableCell width={W.totalWic} value={formatWicHours(totals.totalWicTime)} gray />
        <WicTableCell width={W.others} value={formatWicHours(totals.others)} gray />
        <WicTableCell width={W.pto} value={formatWicHours(totals.paidTimeOff)} gray />
        <WicTableCell width={W.totalTime} value={formatWicHours(totals.TotalTime)} gray />
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
    <View>
      <View style={styles.metaBlock}>
        <Text style={styles.metaLine}>{countyLabel} County Health & Human Services</Text>
        <Text style={styles.metaCaption}>Local Agency Name</Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaLine}>{countyLabel} County WIC Program</Text>
        <Text style={styles.metaCaption}>Office Name</Text>
      </View>

      <View style={[styles.metaBlock, { width: "30%" }]}>
        <Text style={styles.underlineField}>{formatWicEmployeeName(employee.username)}</Text>
        <Text style={styles.metaCaption}>Employee</Text>
      </View>

      <View style={[styles.titleRow, styles.metaBlock]}>
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

      <View style={styles.totalsTable} wrap={false}>
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
