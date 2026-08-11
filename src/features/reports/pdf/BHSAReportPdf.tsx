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

/** Landscape letter usable width (~752 at 20px side padding). */
const TABLE_WIDTH = 752
const TABLE_HEADER_TOP = 78
const TABLE_HEADER_HEIGHT = 24
const CONTENT_TOP = TABLE_HEADER_TOP + TABLE_HEADER_HEIGHT + 8

const W = {
  activityCode: 70,
  activityName: 150,
  expenditureClassification: 90,
  bhccCategory: 78,
  ageGroup: 70,
  otherCountyExpenditureType: 110,
  bhsaNotes: 100,
  activityTime: 42,
  fte: 42,
} as const

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    fontSize: 6.5,
  },
  content: {
    flexGrow: 1,
  },
  reportMeta: {
    marginBottom: 6,
    fontSize: 8,
  },
  pageOneIntro: {
    marginBottom: 4,
  },
  tableHeaderFixed: {
    position: "absolute",
    top: TABLE_HEADER_TOP,
    left: 20,
    width: TABLE_WIDTH,
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
    paddingVertical: 4,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  bodyCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 6.5,
  },
  rightCell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 6.5,
    textAlign: "right",
  },
  employeeSection: {
    marginBottom: 10,
  },
  employeeNameRow: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  totalLabel: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 6.5,
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
      <View style={[styles.headerCell, { width: W.expenditureClassification }]}>
        <Text style={styles.headerText}>Expenditure Classification</Text>
      </View>
      <View style={[styles.headerCell, { width: W.bhccCategory }]}>
        <Text style={styles.headerText}>BHCC Category</Text>
      </View>
      <View style={[styles.headerCell, { width: W.ageGroup }]}>
        <Text style={styles.headerText}>Age Group</Text>
      </View>
      <View style={[styles.headerCell, { width: W.otherCountyExpenditureType }]}>
        <Text style={styles.headerText}>Other County Exp. Type</Text>
      </View>
      <View style={[styles.headerCell, { width: W.bhsaNotes }]}>
        <Text style={styles.headerText}>BHSA Notes</Text>
      </View>
      <View style={[styles.headerCell, { width: W.activityTime }]}>
        <Text style={styles.headerText}>Time</Text>
      </View>
      <View style={[styles.headerCell, { width: W.fte }]}>
        <Text style={styles.headerText}>FTE</Text>
      </View>
    </View>
  )
}

function PageOneIntro({ children }: { children: ReactNode }) {
  return (
    <View
      style={styles.pageOneIntro}
      render={({ pageNumber }) => (pageNumber === 1 ? <View>{children}</View> : null)}
    />
  )
}

function RepeatingTableHeader() {
  return (
    <View
      style={styles.tableHeaderFixed}
      fixed
      render={({ pageNumber }) => (pageNumber > 1 ? <TableHeaderRow /> : null)}
    />
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
          <Text style={[styles.bodyCell, { width: W.expenditureClassification }]}>
            {program.expenditureClassification || ""}
          </Text>
          <Text style={[styles.bodyCell, { width: W.bhccCategory }]}>{program.bhccCategory || ""}</Text>
          <Text style={[styles.bodyCell, { width: W.ageGroup }]}>{program.ageGroup || ""}</Text>
          <Text style={[styles.bodyCell, { width: W.otherCountyExpenditureType }]}>
            {program.otherCountyExpenditureType || ""}
          </Text>
          <Text style={[styles.bodyCell, { width: W.bhsaNotes }]}>{program.bhsaNotes || ""}</Text>
          <Text style={[styles.rightCell, { width: W.activityTime }]}>
            {formatReportTime(program.activityTime)}
          </Text>
          <Text style={[styles.rightCell, { width: W.fte }]}>
            {formatReportTime(program.allocatedFte)}
          </Text>
        </View>
      ))}

      <View style={[styles.row, { marginTop: 6 }]}>
        <Text style={[styles.bodyCell, { width: W.activityCode }]} />
        <Text
          style={[
            styles.totalLabel,
            {
              width:
                W.activityName +
                W.expenditureClassification +
                W.bhccCategory +
                W.ageGroup +
                W.otherCountyExpenditureType +
                W.bhsaNotes,
            },
          ]}
        >
          Total Hours/FTE:
        </Text>
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

function BHSAReportDocument({
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
  const pagePadding = {
    ...resolvePagePadding(footerVariant),
    paddingTop: CONTENT_TOP,
  }

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
        <RepeatingTableHeader />
        <View style={styles.content}>
          <PageOneIntro>
            <ReportMeta
              reportCode={reportDetails.reportCode || "BHSA"}
              runDate={reportDetails.runDate}
              periodStarting={periodStarting}
              periodEnding={periodEnding}
            />
          </PageOneIntro>
          <View render={({ pageNumber }) => (pageNumber === 1 ? <TableHeaderRow /> : null)} />

          {employees.length === 0 ? (
            <Text style={styles.emptyMessage}>No BHSA-applicable data for the selected period.</Text>
          ) : (
            <View style={styles.table}>
              {employees.map((employee, index) => (
                <EmployeeSection
                  key={`${employee.employeeId}-${employee.employeename}-${index}`}
                  employee={employee}
                />
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}

export async function generateBHSAReportPdf(props: DSSRPT2ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "BHSA" },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <BHSAReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )
  return ensurePdfBlob(await instance.toBlob())
}
