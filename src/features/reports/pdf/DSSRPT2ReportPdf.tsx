import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"

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
  formatPrintedOnLabel,
  formatReportTime,
  resolveFooterVariant,
  sortDssrpt2ByActivityCode,
  type Dssrpt2GroupedEmployee,
  type DSSRPT2ReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 544

const W = {
  activityCode: 82,
  activityName: 299,
  activityTime: 82,
  fte: 81,
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
    marginBottom: 10,
    fontSize: 8,
  },
  metaLine: {
    marginBottom: 2,
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 3,
  },
  table: {
    width: TABLE_WIDTH,
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  headerCell: {
    backgroundColor: "rgb(219, 219, 219)",
    borderWidth: 1,
    borderColor: "#000000",
    paddingVertical: 5,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  bodyCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
  },
  rightCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
    textAlign: "right",
  },
  employeeSection: {
    marginBottom: 12,
  },
  employeeNameRow: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  totalLabel: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function ReportMeta({
  reportCode,
  runDate,
  periodStarting,
  periodEnding,
}: {
  reportCode: string
  runDate: string
  periodStarting: string
  periodEnding: string
}) {
  return (
    <View style={styles.reportMeta}>
      <Text style={styles.metaLine}>
        <Text style={styles.metaLabel}>Report ID:</Text>
        {reportCode}
      </Text>
      <Text style={styles.metaLine}>
        <Text style={styles.metaLabel}>Run Date:</Text>
        {runDate}
      </Text>
      <Text style={styles.metaLine}>
        <Text style={styles.metaLabel}>Period Starting:</Text>
        {periodStarting}
      </Text>
      <Text style={styles.metaLine}>
        <Text style={styles.metaLabel}>Period Ending:</Text>
        {periodEnding}
      </Text>
    </View>
  )
}

function TableHeaderRow() {
  return (
    <View style={styles.row}>
      <View style={[styles.headerCell, { width: W.activityCode }]}>
        <Text style={styles.headerText}>Activity Code</Text>
      </View>
      <View style={[styles.headerCell, { width: W.activityName }]}>
        <Text style={styles.headerText}>Activity Name</Text>
      </View>
      <View style={[styles.headerCell, { width: W.activityTime }]}>
        <Text style={styles.headerText}>Activity Time</Text>
      </View>
      <View style={[styles.headerCell, { width: W.fte }]}>
        <Text style={styles.headerText}>FTE</Text>
      </View>
    </View>
  )
}

function EmployeeSection({ employee }: { employee: Dssrpt2GroupedEmployee }) {
  const sortedPrograms = [...employee.programs].sort(sortDssrpt2ByActivityCode)

  return (
    <View style={styles.employeeSection} wrap={false}>
      <View style={styles.row}>
        <Text style={[styles.employeeNameRow, { width: TABLE_WIDTH }]}>
          Employee Name: {employee.employeeId} {employee.employeename}
        </Text>
      </View>

      {sortedPrograms.map((program, index) => (
        <View key={`${program.activityCode}-${index}`} style={styles.row}>
          <Text style={[styles.bodyCell, { width: W.activityCode }]}>{program.activityCode}</Text>
          <Text style={[styles.bodyCell, { width: W.activityName }]}>{program.activityName}</Text>
          <Text style={[styles.rightCell, { width: W.activityTime }]}>
            {formatReportTime(program.activityTime)}
          </Text>
          <Text style={[styles.rightCell, { width: W.fte }]}>
            {formatReportTime(program.allocatedFte)}
          </Text>
        </View>
      ))}

      <View style={[styles.row, { marginTop: 8 }]}>
        <Text style={[styles.bodyCell, { width: W.activityCode }]} />
        <Text style={[styles.totalLabel, { width: W.activityName }]}>Total Hours/FTE:</Text>
        <Text style={[styles.totalValue, { width: W.activityTime }]}>
          {formatReportTime(employee.totalActivityTime)}
        </Text>
        <Text style={[styles.totalValue, { width: W.fte }]}>
          {formatReportTime(employee.totalFteHours)}
        </Text>
      </View>
    </View>
  )
}

function DSSRPT2ReportDocument({
  employees,
  reportDetails,
  periodStarting,
  periodEnding,
  printedOn,
  meta,
  footerVariant,
}: DSSRPT2ReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const pagePadding = resolvePagePadding(footerVariant)

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
          <ReportMeta
            reportCode={reportDetails.reportCode}
            runDate={reportDetails.runDate}
            periodStarting={periodStarting}
            periodEnding={periodEnding}
          />

          {employees.length === 0 ? (
            <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
          ) : (
            <View style={styles.table}>
              <TableHeaderRow />
              {employees.map((employee, index) => (
                <EmployeeSection key={`${employee.employeeId}-${employee.employeename}-${index}`} employee={employee} />
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export async function generateDSSRPT2ReportPdf(props: DSSRPT2ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "DSSRPT2" },
    { countyLogo: defaultCountyLogo, rightLogo: pkiLogo },
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <DSSRPT2ReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
