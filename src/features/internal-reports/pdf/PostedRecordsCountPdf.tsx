import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"

import type { PostedRecordsCountReport, PostedRecordsCountySection } from "../types"
import { formatPrintedOn } from "../utils/postedRecordsCountFormat"

const LABEL_COL = 205
const NUM_COL = 66
const BORDER_DARK = "#1d1d1f"
const BORDER_LIGHT = "#8a8a8a"

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 56,
    paddingHorizontal: 30,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: BORDER_DARK,
  },
  title: {
    fontSize: 19,
    paddingBottom: 8,
    marginBottom: 14,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
    width: 370,
  },
  metaRow: { flexDirection: "row", marginBottom: 7 },
  metaLabel: { width: 112 },
  metaValue: { fontFamily: "Helvetica-Bold" },
  sectionBar: {
    marginTop: 14,
    marginBottom: 12,
    paddingVertical: 5,
    paddingHorizontal: 2,
    backgroundColor: "#f2f2f2",
    fontFamily: "Helvetica-Bold",
    fontSize: 12.5,
  },
  headerRow: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderTopColor: BORDER_LIGHT,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 11.5,
  },
  row: { flexDirection: "row", paddingVertical: 3.5 },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderTopWidth: 0.75,
    borderTopColor: BORDER_DARK,
    fontFamily: "Helvetica-Bold",
  },
  labelCell: { width: LABEL_COL, paddingRight: 8 },
  numCell: { width: NUM_COL, textAlign: "center" },
  bold: { fontFamily: "Helvetica-Bold" },
  errorText: { color: "#b91c1c", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 30,
    right: 30,
    flexDirection: "row",
    alignItems: "flex-end",
    fontSize: 8,
  },
  footerLeft: { flex: 1 },
  footerCenter: { flex: 1, textAlign: "center" },
  footerRight: { flex: 1, alignItems: "flex-end" },
  footerRightText: {
    width: 190,
    paddingTop: 4,
    borderTopWidth: 0.75,
    borderTopColor: BORDER_DARK,
    textAlign: "right",
    fontSize: 6.5,
  },
})

type Cell = string | number

/** Label column, one column per quarter, then an optional Total column (always reserved for alignment). */
function TableRow({
  label,
  quarters,
  total,
  variant = "body",
}: {
  label: string
  quarters: Cell[]
  total?: Cell
  variant?: "header" | "body" | "total"
}) {
  const rowStyle = variant === "header" ? styles.headerRow : variant === "total" ? styles.totalRow : styles.row
  return (
    <View style={rowStyle} wrap={false}>
      <Text style={styles.labelCell}>{label}</Text>
      {quarters.map((v, i) => (
        <Text key={i} style={styles.numCell}>
          {String(v)}
        </Text>
      ))}
      <Text style={[styles.numCell, variant === "body" ? styles.bold : {}]}>
        {total === undefined ? "" : String(total)}
      </Text>
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionBar} minPresenceAhead={70}>
      {children} »
    </Text>
  )
}

function CountySection({ section, labels }: { section: PostedRecordsCountySection; labels: string[] }) {
  const county = section.countyName
  if (section.status === "error") {
    return (
      <View wrap={false}>
        <SectionTitle>{county}</SectionTitle>
        <Text style={styles.errorText}>Could not load data: {section.error ?? "unknown error"}</Text>
      </View>
    )
  }

  const zeros = labels.map(() => 0)
  const blanks = labels.map(() => "")
  const { fullTime, monthly } = section.timeStudyRecords

  return (
    <View>
      <SectionTitle>{`${county} Expenditures`}</SectionTitle>
      <TableRow label="Department" quarters={labels} total="Total" variant="header" />
      <TableRow label="" quarters={blanks} total={0} />

      <SectionTitle>{`${county} Revenues`}</SectionTitle>
      <TableRow label="Department" quarters={labels} total="Total" variant="header" />
      <TableRow label="" quarters={blanks} total={0} />

      <SectionTitle>{`${county} Employee Records`}</SectionTitle>
      <TableRow label="Quarter:" quarters={labels} variant="header" />
      <TableRow label="" quarters={section.employeeRecords.counts} />

      <SectionTitle>{`${county} Time Study Records`}</SectionTitle>
      <TableRow label="Quarter:" quarters={labels} total="Total" variant="header" />
      <TableRow label="Full Time TS" quarters={fullTime.counts.length ? fullTime.counts : zeros} total={fullTime.total} />
      <TableRow label="Monthly TS" quarters={monthly.counts.length ? monthly.counts : zeros} total={monthly.total} />
      <TableRow
        label=""
        quarters={section.timeStudyRecords.counts}
        total={section.timeStudyRecords.total}
        variant="total"
      />
    </View>
  )
}

function AllClientsSummary({ report }: { report: PostedRecordsCountReport }) {
  return (
    <View>
      <SectionTitle>All Clients Summary</SectionTitle>
      <TableRow label="County" quarters={report.quarterLabels} total="Total" variant="header" />
      {report.counties.map((c) => (
        <TableRow
          key={c.nameSpace}
          label={c.countyName}
          quarters={c.status === "error" ? report.quarterLabels.map(() => "-") : c.timeStudyRecords.counts}
          total={c.status === "error" ? "-" : c.timeStudyRecords.total}
        />
      ))}
      <TableRow
        label=""
        quarters={report.summary.timeStudyRecordCounts}
        total={report.summary.timeStudyRecords}
        variant="total"
      />
    </View>
  )
}

function PostedRecordsCountDocument({ report, printedOn }: { report: PostedRecordsCountReport; printedOn: string }) {
  const labels = report.quarterLabels
  const departmentNames = report.allCounties ? [] : (report.counties[0]?.departmentNames ?? [])
  return (
    <Document title={report.reportTitle}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{report.reportTitle}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Fiscal Year:</Text>
          <Text style={styles.metaValue}>{report.fiscalYearId}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Beginning Quarter:</Text>
          <Text style={styles.metaValue}>{report.startQuarter}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Ending Quarter:</Text>
          <Text style={styles.metaValue}>{report.endQuarter}</Text>
        </View>
        {departmentNames.length ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Department:</Text>
            <Text style={styles.metaValue}>{departmentNames.join(", ")}</Text>
          </View>
        ) : null}

        {report.counties.map((section) => (
          <CountySection key={section.nameSpace} section={section} labels={labels} />
        ))}

        {report.allCounties ? <AllClientsSummary report={report} /> : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>Printed on: {printedOn}</Text>
          <Text
            style={styles.footerCenter}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
          <View style={styles.footerRight}>
            <Text style={styles.footerRightText}>IEBA, A010</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generatePostedRecordsCountPdf(report: PostedRecordsCountReport): Promise<Blob> {
  const blob = await pdf(<PostedRecordsCountDocument report={report} printedOn={formatPrintedOn()} />).toBlob()
  return blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" })
}
