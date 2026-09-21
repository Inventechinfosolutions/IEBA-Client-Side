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
  resolveFooterVariant,
  type WicDayRecord,
  type WicEmployee,
  type WICReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 560

/** Columns kept per I-1-I419 mockup (removed: SUB Total, Non Specific, Total WIC Time, Others). */
const W = {
  date: 52,
  bfpc: 48,
  fmnp: 48,
  nutritional: 72,
  breastfeeding: 72,
  client: 60,
  generalAdmin: 72,
  pto: 56,
  totalTime: 80,
} as const

const GRAY = "lightgray"

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 18,
    fontFamily: "Helvetica",
    fontSize: 6.5,
  },
  content: {
    flexGrow: 1,
  },
  headerBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: TABLE_WIDTH,
    marginBottom: 4,
  },
  agencyBlock: {
    width: "38%",
  },
  agencyLine: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  agencyCaption: {
    fontSize: 6.5,
    marginBottom: 3,
  },
  monthBlock: {
    width: "24%",
    alignItems: "center",
    paddingTop: 2,
  },
  monthLine: {
    fontSize: 7.5,
    textAlign: "center",
    width: "100%",
  },
  employeeBlock: {
    width: "34%",
    alignItems: "flex-end",
  },
  underlineField: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    fontSize: 7.5,
    marginBottom: 1,
    width: "100%",
    textAlign: "right",
  },
  fieldCaption: {
    fontSize: 6.5,
    marginBottom: 3,
    textAlign: "right",
    width: "100%",
  },
  table: {
    width: TABLE_WIDTH,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
    minHeight: 11,
  },
  cell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    minHeight: 11,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 5.5,
    textAlign: "right",
  },
  headerCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    minHeight: 11,
    justifyContent: "center",
    backgroundColor: GRAY,
  },
  headerText: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  groupHeader: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    minHeight: 11,
    justifyContent: "center",
    backgroundColor: GRAY,
  },
  grayCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    minHeight: 11,
    justifyContent: "center",
    backgroundColor: GRAY,
  },
  leftCell: {
    borderWidth: 1,
    borderColor: "lightslategray",
    paddingVertical: 1.5,
    paddingHorizontal: 2,
    minHeight: 11,
    justifyContent: "center",
  },
  leftCellText: {
    fontSize: 5.5,
    textAlign: "left",
  },
  note: {
    marginTop: 6,
    marginBottom: 6,
    fontSize: 6.5,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: TABLE_WIDTH,
  },
  signatureField: {
    width: "46%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 2,
    minHeight: 14,
  },
  signatureLabel: {
    fontSize: 7,
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
        ? styles.headerText
        : styles.cellText

  return (
    <View style={[boxStyle, { width }]}>
      {bold ? (
        <Text style={[textStyle, { fontFamily: "Helvetica-Bold" }]}>{value}</Text>
      ) : (
        <Text style={textStyle}>{value}</Text>
      )}
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
      <WicTableCell width={W.pto} value={formatWicHours(record.paidTimeOff)} />
      <WicTableCell width={W.totalTime} value={formatWicHours(record.TotalTime)} gray />
    </View>
  )
}

function WicMainTable({ records }: { records: WicDayRecord[] }) {
  const totals = computeWicColumnTotals(records)

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
              width: W.nutritional + W.breastfeeding + W.client + W.generalAdmin,
              justifyContent: "center",
            },
          ]}
        >
          <Text style={styles.headerText}>NSA COST OBJECTIVES</Text>
        </View>
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
        <View style={[styles.headerCell, { width: W.pto }]}>
          <Text style={styles.headerText}>Paid Time Off</Text>
        </View>
        <View style={[styles.headerCell, { width: W.totalTime }]}>
          <Text style={styles.headerText}>Total Time</Text>
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
  const countyLabel = countyName || "Trinity"

  return (
    <View>
      <View style={styles.headerBlock}>
        <View style={styles.agencyBlock}>
          <Text style={styles.agencyLine}>{countyLabel} County Health & Human Services</Text>
          <Text style={styles.agencyCaption}>Local Agency Name</Text>
          <Text style={styles.agencyLine}>{countyLabel} County WIC Program</Text>
          <Text style={styles.agencyCaption}>Office Name</Text>
        </View>

        <View style={styles.monthBlock}>
          <Text style={styles.monthLine}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Month/Year</Text>
            {` : ${employee.date}`}
          </Text>
        </View>

        <View style={styles.employeeBlock}>
          <Text style={styles.underlineField}>{formatWicEmployeeName(employee.username)}</Text>
          <Text style={styles.fieldCaption}>Employee</Text>
          <Text style={styles.underlineField}>{employee.jobClassificationName}</Text>
          <Text style={styles.fieldCaption}>Title</Text>
        </View>
      </View>

      <WicMainTable records={employee.tsrecords} />

      <Text style={styles.note}>
        Overtime Hours should be included, if applicable, on this timesheet.
      </Text>

      <View style={styles.signatureRow} wrap={false}>
        <View style={styles.signatureField}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Employee signature</Text>
        </View>
        <View style={styles.signatureField}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Supervisor signature</Text>
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
    <Page size="LETTER" orientation="portrait" style={[styles.page, pagePadding]} wrap>
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
