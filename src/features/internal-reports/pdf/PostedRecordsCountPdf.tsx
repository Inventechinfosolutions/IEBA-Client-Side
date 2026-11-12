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
  noteText: {
    marginTop: 14,
    fontSize: 9,
    fontStyle: "italic",
    color: "#7a7a7a",
  },
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

/** Label column, one column per selected quarter, then an optional Total column. */
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
      {total === undefined ? null : (
        <Text style={[styles.numCell, variant === "body" ? styles.bold : {}]}>{String(total)}</Text>
      )}
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

/** One table per quarter: the quarter's three months, then unique users for the quarter. */
function CountySection({ section, report }: { section: PostedRecordsCountySection; report: PostedRecordsCountReport }) {
  const title = `${section.countyName.trim().toUpperCase()} Active Users`
  if (section.status === "error") {
    return (
      <View wrap={false}>
        <SectionTitle>{title}</SectionTitle>
        <Text style={styles.errorText}>Could not load data: {section.error ?? "unknown error"}</Text>
      </View>
    )
  }

  return (
    <View>
      {report.quarterLabels.map((quarter, qi) => {
        const months = <T,>(values: T[]) => values.slice(qi * 3, qi * 3 + 3)
        return (
          <View key={quarter}>
            <SectionTitle>{`${title} – ${quarter}`}</SectionTitle>
            <TableRow label="Department" quarters={months(report.monthLabels)} total={quarter} variant="header" />
            {section.departments.map((d) => (
              <TableRow key={d.departmentId} label={d.departmentName} quarters={months(d.monthCounts)} total={d.counts[qi] ?? 0} />
            ))}
            <TableRow
              label={section.includesPkiUsers ? "County Total *" : "County Total"}
              quarters={months(section.countyMonthTotals)}
              total={section.countyTotals[qi] ?? 0}
              variant="total"
            />
          </View>
        )
      })}
    </View>
  )
}

function ReportHeader({
  report,
  departmentNames,
}: {
  report: PostedRecordsCountReport
  departmentNames: string[]
}) {
  return (
    <>
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
    </>
  )
}

function PageFooter({ printedOn }: { printedOn: string }) {
  return (
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
  )
}

function PostedRecordsCountDocument({ report, printedOn }: { report: PostedRecordsCountReport; printedOn: string }) {
  const departmentNames = report.allCounties ? [] : (report.counties[0]?.departmentNames ?? [])

  if (report.allCounties) {
    // One continuous Page: each county may wrap across multiple pages; `break` starts the next county.
    return (
      <Document title={report.reportTitle}>
        <Page size="LETTER" style={styles.page} wrap>
          {report.counties.map((section, index) => (
            <View key={section.nameSpace} break={index > 0} wrap>
              <ReportHeader report={report} departmentNames={[]} />
              <CountySection section={section} report={report} />
              {report.pkiNote ? <Text style={styles.noteText}>{report.pkiNote}</Text> : null}
            </View>
          ))}
          <PageFooter printedOn={printedOn} />
        </Page>
      </Document>
    )
  }

  return (
    <Document title={report.reportTitle}>
      <Page size="LETTER" style={styles.page} wrap>
        <ReportHeader report={report} departmentNames={departmentNames} />
        {report.counties.map((section) => (
          <CountySection key={section.nameSpace} section={section} report={report} />
        ))}
        {report.pkiNote ? <Text style={styles.noteText}>{report.pkiNote}</Text> : null}
        <PageFooter printedOn={printedOn} />
      </Page>
    </Document>
  )
}

export async function generatePostedRecordsCountPdf(report: PostedRecordsCountReport): Promise<Blob> {
  const failed = report.counties.filter((c) => c.status === "error")
  if (failed.length) {
    const labels = failed.map((c) => c.countyName.trim().toUpperCase() || c.nameSpace)
    throw new Error(
      failed.length === 1
        ? `A010 failed for ${labels[0]}: ${failed[0].error ?? "unknown error"}`
        : `A010 failed for ${failed.length} counties (${labels.join(", ")}). No partial PDF is returned.`,
    )
  }

  const blob = await pdf(<PostedRecordsCountDocument report={report} printedOn={formatPrintedOn()} />).toBlob()
  return blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" })
}
