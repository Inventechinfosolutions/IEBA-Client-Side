import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"
import type { ReactNode } from "react"

import defaultCountyLogo from "@/assets/county-avatar.png"
import pkiLogo from "@/assets/ieba-logo.png"

import {
  ReportPdfFooter,
  ReportPdfHeader,
  resolvePagePadding,
} from "./ReportPdfChrome"
import {
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatDssrpt1EmployeeName,
  formatPrintedOnLabel,
  getAllReportDates,
  getRowTotal,
  getWeeklyCellTexts,
  getWeekHeaderLabels,
  hasDssrpt1ReportData,
  resolveFooterVariant,
  type Dssrpt1DateEntry,
  type Dssrpt1Employee,
  type DSSRPT1ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const COL = { activity: 200, week: 118, total: 60 } as const
const TABLE_WIDTH = COL.activity + COL.week * 4 + COL.total

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 7.5,
  },
  content: { flexGrow: 1 },
  employeeInfo: { marginBottom: 10, marginLeft: 10 },
  infoLine: { flexDirection: "row", flexWrap: "wrap", gap: 24, marginBottom: 4 },
  infoLabel: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  infoValue: { fontSize: 8 },
  table: { width: TABLE_WIDTH, marginBottom: 16 },
  row: { flexDirection: "row", width: TABLE_WIDTH },
  cell: {
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  headerCell: { backgroundColor: "#FFFF00", fontSize: 7, textAlign: "center" },
  activityCell: { backgroundColor: "#FFFFFF", textAlign: "center", fontSize: 7.5 },
  dataCell: { textAlign: "center", fontSize: 7 },
  totalCell: { textAlign: "center", fontSize: 7, fontFamily: "Helvetica-Bold" },
  certificationRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    width: TABLE_WIDTH,
  },
  certificationBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 8,
    minHeight: 100,
    justifyContent: "space-between",
  },
  certificationText: { fontSize: 7.5, lineHeight: 1.35, marginBottom: 8 },
  signatureRow: { flexDirection: "row", alignItems: "flex-end", gap: 16, marginTop: "auto" },
  signatureField: { flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 4 },
  fieldLabel: { fontSize: 7.5, flexShrink: 0 },
  fieldLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginTop: 2,
    minHeight: 1,
  },
  emptyMessage: { fontSize: 9, padding: 12 },
})

function TableCell({
  width,
  children,
  style,
  bold,
}: {
  width: number
  children?: ReactNode
  style?: Style
  bold?: boolean
}) {
  return (
    <View style={style ? [styles.cell, { width }, style] : [styles.cell, { width }]}>
      {children != null && children !== "" ? (
        <Text style={bold ? { fontFamily: "Helvetica-Bold" } : undefined}>{children}</Text>
      ) : null}
    </View>
  )
}

function SignatureField({ label }: { label: string }) {
  return (
    <View style={styles.signatureField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldLine} />
    </View>
  )
}

function CertificationSection({ text }: { text: string }) {
  return (
    <View style={styles.certificationBox}>
      <Text style={styles.certificationText}>{text}</Text>
      <View style={styles.signatureRow}>
        <SignatureField label="Signature:" />
        <SignatureField label="Date:" />
      </View>
    </View>
  )
}

function EmployeeInfo({
  employee,
  startDate,
  endDate,
}: {
  employee: Dssrpt1Employee
  startDate: string
  endDate: string
}) {
  return (
    <View style={styles.employeeInfo}>
      <View style={styles.infoLine}>
        <Text>
          <Text style={styles.infoLabel}>Time Period: </Text>
          <Text style={styles.infoValue}>
            {startDate} / {endDate}
          </Text>
        </Text>
        <Text>
          <Text style={styles.infoLabel}>Employee: </Text>
          <Text style={styles.infoValue}>{formatDssrpt1EmployeeName(employee.employeeName)}</Text>
        </Text>
        <Text>
          <Text style={styles.infoLabel}>Empl#: </Text>
          <Text style={styles.infoValue}>{employee.empl}</Text>
        </Text>
        <Text>
          <Text style={styles.infoLabel}>Unit: </Text>
          <Text style={styles.infoValue}>{employee.Unit}</Text>
        </Text>
      </View>
    </View>
  )
}

function DataRow({
  label,
  sourceData,
  allDates,
  bold,
}: {
  label: string
  sourceData: Dssrpt1DateEntry[] | undefined
  allDates: string[]
  bold?: boolean
}) {
  const weeks = getWeeklyCellTexts(sourceData, allDates)
  return (
    <View style={styles.row}>
      <TableCell width={COL.activity} style={styles.activityCell} bold={bold}>
        {label}
      </TableCell>
      {weeks.map((week, index) => (
        <TableCell key={`${label}-w${index}`} width={COL.week} style={styles.dataCell}>
          {week}
        </TableCell>
      ))}
      <TableCell width={COL.total} style={styles.totalCell} bold={bold}>
        {getRowTotal(sourceData)}
      </TableCell>
    </View>
  )
}

function EmployeeTable({ employee, allDates }: { employee: Dssrpt1Employee; allDates: string[] }) {
  const weekHeaders = getWeekHeaderLabels(allDates)

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <TableCell width={COL.activity} style={styles.headerCell} />
        {weekHeaders.map((header, index) => (
          <TableCell key={`hdr-${index}`} width={COL.week} style={styles.headerCell}>
            {header}
          </TableCell>
        ))}
        <TableCell width={COL.total} style={styles.headerCell}>
          Total
        </TableCell>
      </View>

      {(employee.activities || []).map((activity, index) => (
        <DataRow
          key={`${activity.activityCode}-${index}`}
          label={`${activity.activityCode} - ${activity.activityName}`}
          sourceData={activity.dates}
          allDates={allDates}
        />
      ))}

      <View style={styles.row}>
        <View style={{ width: TABLE_WIDTH, height: 8 }} />
      </View>

      <DataRow label="Daily Total" sourceData={employee.diaplyTotals} allDates={allDates} bold />
      <DataRow
        label="9000 - Non Allocable"
        sourceData={employee.nonAllocable}
        allDates={allDates}
        bold
      />
      <DataRow label="Total Hours" sourceData={employee.totalHours} allDates={allDates} bold />
    </View>
  )
}

function EmployeeCertification() {
  return (
    <View style={styles.certificationRow} wrap={false}>
      <CertificationSection text="Employee - I certify that this is a true and accurate report of my time and functions performed as shown." />
      <CertificationSection text="Supervisor - I certify the employee's daily time records have been examined and that to the best of my knowledge and belief this time record is true and correct and the functions were performed as shown." />
    </View>
  )
}

function DSSRPT1ReportPage({
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

function DSSRPT1ReportDocument({
  employees,
  startDate,
  endDate,
  printedOn,
  meta,
  footerVariant,
}: DSSRPT1ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  if (!hasDssrpt1ReportData(employees)) {
    return (
      <Document>
        <DSSRPT1ReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>
            No time study data for the selected users, dates, activity codes, and status filters.
          </Text>
        </DSSRPT1ReportPage>
      </Document>
    )
  }

  const allDates = getAllReportDates(employees)

  return (
    <Document>
      {employees.map((employee, index) => (
        <DSSRPT1ReportPage
          key={`${employee.empl}-${employee.employeeName}-${index}`}
          meta={meta}
          footerVariant={footerVariant}
          printedOn={printedOn}
        >
          <EmployeeInfo employee={employee} startDate={startDate} endDate={endDate} />
          <EmployeeTable employee={employee} allDates={allDates} />
          <EmployeeCertification />
        </DSSRPT1ReportPage>
      ))}
    </Document>
  )
}

export async function generateDSSRPT1ReportPdf(props: DSSRPT1ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "DSSRPT1" },
    { countyLogo: defaultCountyLogo, rightLogo: pkiLogo },
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <DSSRPT1ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
