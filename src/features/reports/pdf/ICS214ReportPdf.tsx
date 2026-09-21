import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { ReactNode } from "react"

import { REPORT_PDF_DEFAULT_LOGOS } from "./reportPdfAssets"

import {
  buildResolvedPdfMeta,
  ensurePdfBlob,
  formatIcs214ActivityDateTime,
  formatIcs214NotableActivity,
  formatPrintedOnLabel,
  formatReportDisplayDate,
  type Ics214Activity,
  type Ics214Employee,
  type ICS214ReportPdfProps,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

/** Letter width usable inside 18pt horizontal padding. */
const FORM_WIDTH = 576
const DATE_TIME_COL = 118
const NOTABLE_COL = FORM_WIDTH - DATE_TIME_COL
const RESOURCE_NAME = 170
const RESOURCE_POS = 170
const RESOURCE_AGENCY = FORM_WIDTH - RESOURCE_NAME - RESOURCE_POS

const FIRST_PAGE_ACTIVITY_SLOTS = 16
const CONTINUATION_ACTIVITY_SLOTS = 28
const RESOURCE_SLOTS = 4

const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 18,
    fontFamily: "Helvetica",
    fontSize: 8,
  },
  form: {
    width: FORM_WIDTH,
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  titleBar: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#000000",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f0f0f0",
  },
  titleText: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  cellLast: {
    borderRightWidth: 0,
  },
  cellNoBottom: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  value: {
    fontSize: 8,
    minHeight: 10,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    backgroundColor: "#f5f5f5",
  },
  headerCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    backgroundColor: "#e8e8e8",
  },
  bodyCell: {
    fontSize: 7.5,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    minHeight: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  footerLeft: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  footerRight: {
    fontSize: 8,
  },
  emptyMessage: {
    fontSize: 10,
    padding: 16,
  },
})

function displayPeriodDate(raw: string, fallback: string): string {
  const trimmed = String(raw ?? "").trim()
  if (!trimmed) return fallback
  return formatReportDisplayDate(trimmed) || trimmed
}

function padActivitySlots(activities: Ics214Activity[], slots: number): Array<Ics214Activity | null> {
  const rows: Array<Ics214Activity | null> = activities.slice(0, slots)
  while (rows.length < slots) rows.push(null)
  return rows
}

function chunkActivities(activities: Ics214Activity[]): Ics214Activity[][] {
  if (activities.length === 0) return [[]]
  const first = activities.slice(0, FIRST_PAGE_ACTIVITY_SLOTS)
  const rest = activities.slice(FIRST_PAGE_ACTIVITY_SLOTS)
  const chunks: Ics214Activity[][] = [first]
  for (let i = 0; i < rest.length; i += CONTINUATION_ACTIVITY_SLOTS) {
    chunks.push(rest.slice(i, i + CONTINUATION_ACTIVITY_SLOTS))
  }
  return chunks
}

function FormCell({
  width,
  label,
  value,
  last,
  noBottom,
  children,
}: {
  width: number | string
  label?: string
  value?: string
  last?: boolean
  noBottom?: boolean
  children?: ReactNode
}) {
  return (
    <View
      style={[
        styles.cell,
        { width },
        last ? styles.cellLast : {},
        noBottom ? styles.cellNoBottom : {},
      ]}
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children ?? <Text style={styles.value}>{value ?? " "}</Text>}
    </View>
  )
}

function ActivityTable({
  activities,
  slots,
  continuation,
}: {
  activities: Ics214Activity[]
  slots: number
  continuation?: boolean
}) {
  const rows = padActivitySlots(activities, slots)

  return (
    <View>
      <Text style={[styles.sectionLabel, { borderBottomWidth: 1 }]}>
        {continuation ? "7. Activity Log (continuation):" : "7. Activity Log:"}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.headerCell, { width: DATE_TIME_COL }]}>Date/Time</Text>
        <Text style={[styles.headerCell, styles.cellLast, { width: NOTABLE_COL }]}>
          Notable Activities
        </Text>
      </View>
      {rows.map((activity, index) => {
        const isLast = index === rows.length - 1
        return (
          <View key={`act-${index}`} style={styles.row} wrap={false}>
            <Text
              style={[
                styles.bodyCell,
                { width: DATE_TIME_COL },
                isLast ? styles.cellNoBottom : {},
              ]}
            >
              {activity ? formatIcs214ActivityDateTime(activity) : " "}
            </Text>
            <Text
              style={[
                styles.bodyCell,
                styles.cellLast,
                { width: NOTABLE_COL },
                isLast ? styles.cellNoBottom : {},
              ]}
            >
              {activity ? formatIcs214NotableActivity(activity) : " "}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function ResourcesTable({
  employeeName,
  homeAgency,
}: {
  employeeName: string
  homeAgency: string
}) {
  const rows = Array.from({ length: RESOURCE_SLOTS }, (_, i) =>
    i === 0
      ? { name: employeeName, position: "", agency: homeAgency }
      : { name: "", position: "", agency: "" },
  )

  return (
    <View>
      <Text style={styles.sectionLabel}>6. Resources Assigned:</Text>
      <View style={styles.row}>
        <Text style={[styles.headerCell, { width: RESOURCE_NAME }]}>Name</Text>
        <Text style={[styles.headerCell, { width: RESOURCE_POS }]}>ICS Position</Text>
        <Text style={[styles.headerCell, styles.cellLast, { width: RESOURCE_AGENCY }]}>
          Home Agency (and Unit)
        </Text>
      </View>
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1
        return (
          <View key={`res-${index}`} style={styles.row} wrap={false}>
            <Text
              style={[
                styles.bodyCell,
                { width: RESOURCE_NAME },
                isLast ? styles.cellNoBottom : {},
              ]}
            >
              {row.name || " "}
            </Text>
            <Text
              style={[
                styles.bodyCell,
                { width: RESOURCE_POS },
                isLast ? styles.cellNoBottom : {},
              ]}
            >
              {row.position || " "}
            </Text>
            <Text
              style={[
                styles.bodyCell,
                styles.cellLast,
                { width: RESOURCE_AGENCY },
                isLast ? styles.cellNoBottom : {},
              ]}
            >
              {row.agency || " "}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

function PreparedByFooter({
  name,
  printedOn,
  pageLabel,
}: {
  name: string
  printedOn: string
  pageLabel: string
}) {
  return (
    <View>
      <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: "#000000" }]}>
        <FormCell width="34%" label="8. Prepared by: Name:" value={name} noBottom />
        <FormCell width="33%" label="Position/Title:" value="" noBottom />
        <FormCell width="33%" label="Signature:" value="" last noBottom />
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.footerLeft}>{pageLabel}</Text>
        <Text style={styles.footerRight}>Date/Time: {printedOn}</Text>
      </View>
    </View>
  )
}

function Ics214FirstPage({
  employee,
  startDate,
  endDate,
  homeAgency,
  printedOn,
  pageNumber,
  totalPages,
  activities,
}: {
  employee: Ics214Employee
  startDate: string
  endDate: string
  homeAgency: string
  printedOn: string
  pageNumber: number
  totalPages: number
  activities: Ics214Activity[]
}) {
  const dateFrom = displayPeriodDate(employee.startdate, startDate)
  const dateTo = displayPeriodDate(employee.enddate, endDate)

  return (
    <Page size="LETTER" style={styles.page} wrap={false}>
      <View style={styles.form}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>ACTIVITY LOG (ICS 214)</Text>
        </View>

        <View style={styles.row}>
          <FormCell
            width="48%"
            label="1. Incident Name:"
            value={employee.program || "Time Study Activity Log"}
          />
          <View style={[styles.cell, styles.cellLast, { width: "52%", paddingVertical: 0, paddingHorizontal: 0 }]}>
            <Text style={[styles.label, { paddingTop: 4, paddingHorizontal: 5 }]}>
              2. Operational Period:
            </Text>
            <View style={styles.row}>
              <FormCell width="50%" label="Date From:" value={dateFrom} noBottom />
              <FormCell width="50%" label="Date To:" value={dateTo} last noBottom />
            </View>
            <View style={styles.row}>
              <FormCell width="50%" label="Time From:" value="" noBottom />
              <FormCell width="50%" label="Time To:" value="" last noBottom />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <FormCell width="34%" label="3. Name:" value={employee.employeename} />
          <FormCell width="33%" label="4. ICS Position:" value="" />
          <FormCell width="33%" label="5. Home Agency (and Unit):" value={homeAgency} last />
        </View>

        <ResourcesTable employeeName={employee.employeename} homeAgency={homeAgency} />
        <ActivityTable activities={activities} slots={FIRST_PAGE_ACTIVITY_SLOTS} />
        <PreparedByFooter
          name={employee.employeename}
          printedOn={printedOn}
          pageLabel={`ICS 214, Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  )
}

function Ics214ContinuationPage({
  employee,
  startDate,
  endDate,
  printedOn,
  pageNumber,
  totalPages,
  activities,
}: {
  employee: Ics214Employee
  startDate: string
  endDate: string
  printedOn: string
  pageNumber: number
  totalPages: number
  activities: Ics214Activity[]
}) {
  const dateFrom = displayPeriodDate(employee.startdate, startDate)
  const dateTo = displayPeriodDate(employee.enddate, endDate)

  return (
    <Page size="LETTER" style={styles.page} wrap={false}>
      <View style={styles.form}>
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>ACTIVITY LOG (ICS 214)</Text>
        </View>

        <View style={styles.row}>
          <FormCell
            width="48%"
            label="1. Incident Name:"
            value={employee.program || "Time Study Activity Log"}
          />
          <View style={[styles.cell, styles.cellLast, { width: "52%", paddingVertical: 0, paddingHorizontal: 0 }]}>
            <Text style={[styles.label, { paddingTop: 4, paddingHorizontal: 5 }]}>
              2. Operational Period:
            </Text>
            <View style={styles.row}>
              <FormCell width="50%" label="Date From:" value={dateFrom} noBottom />
              <FormCell width="50%" label="Date To:" value={dateTo} last noBottom />
            </View>
            <View style={styles.row}>
              <FormCell width="50%" label="Time From:" value="" noBottom />
              <FormCell width="50%" label="Time To:" value="" last noBottom />
            </View>
          </View>
        </View>

        <ActivityTable activities={activities} slots={CONTINUATION_ACTIVITY_SLOTS} continuation />
        <PreparedByFooter
          name={employee.employeename}
          printedOn={printedOn}
          pageLabel={`ICS 214, Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </Page>
  )
}

function ICS214ReportDocument({
  employees,
  startDate,
  endDate,
  printedOn,
  meta,
}: ICS214ReportPdfProps & { meta: ResolvedReportPdfMeta }) {
  if (employees.length === 0) {
    return (
      <Document>
        <Page size="LETTER" style={styles.page}>
          <View style={styles.form}>
            <View style={styles.titleBar}>
              <Text style={styles.titleText}>ACTIVITY LOG (ICS 214)</Text>
            </View>
            <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
          </View>
        </Page>
      </Document>
    )
  }

  const homeAgency = meta.countyName || ""
  const preparedOn = printedOn ?? formatPrintedOnLabel()

  return (
    <Document>
      {employees.flatMap((employee, employeeIndex) => {
        const chunks = chunkActivities(employee.activities)
        const totalPages = chunks.length
        return chunks.map((chunk, chunkIndex) => {
          const pageNumber = chunkIndex + 1
          const key = `${employee.employeename}-${employeeIndex}-p${pageNumber}`
          if (chunkIndex === 0) {
            return (
              <Ics214FirstPage
                key={key}
                employee={employee}
                startDate={startDate}
                endDate={endDate}
                homeAgency={homeAgency}
                printedOn={preparedOn}
                pageNumber={pageNumber}
                totalPages={totalPages}
                activities={chunk}
              />
            )
          }
          return (
            <Ics214ContinuationPage
              key={key}
              employee={employee}
              startDate={startDate}
              endDate={endDate}
              printedOn={preparedOn}
              pageNumber={pageNumber}
              totalPages={totalPages}
              activities={chunk}
            />
          )
        })
      })}
    </Document>
  )
}

export async function generateICS214ReportPdf(props: ICS214ReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const meta = await buildResolvedPdfMeta(
    { ...props.meta, reportCode: props.meta?.reportCode ?? "ICS214" },
    REPORT_PDF_DEFAULT_LOGOS,
  )

  const instance = pdf(
    <ICS214ReportDocument {...props} printedOn={printedOn} meta={meta} />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
