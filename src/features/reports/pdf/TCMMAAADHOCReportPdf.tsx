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
  chunkTcmMaaAdhocCategories,
  computeTcmMaaAdhocTotals,
  ensurePdfBlob,
  formatPrintedOnLabel,
  formatTcmMaaAdhocColumnNumber,
  formatTcmMaaAdhocEmployeeName,
  formatTcmMaaAdhocHours,
  formatTcmMaaAdhocNspmp,
  resolveFooterVariant,
  resolveReportTitle,
  sortTcmMaaAdhocEmployees,
  type TcmMaaAdhocCategory,
  type TcmMaaAdhocEmployee,
  type TCMMAAADHOCReportPdfProps,
  type ReportPdfFooterVariant,
  type ResolvedReportPdfMeta,
} from "./reportPdf"

const TABLE_WIDTH = 1150
const W = {
  employeeName: 110,
  jobClassification: 100,
  total: 56,
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
  table: {
    width: TABLE_WIDTH,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  row: {
    flexDirection: "row",
    width: TABLE_WIDTH,
  },
  transparentCell: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    backgroundColor: "transparent",
  },
  headerCell: {
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "#e0e0e0",
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textAlign: "center",
    justifyContent: "center",
  },
  categoryDescriptionHeader: {
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "transparent",
    padding: 5,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  categoryNumberHeader: {
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "transparent",
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textAlign: "center",
  },
  bodyCell: {
    borderWidth: 1,
    borderColor: "#cccccc",
    padding: 5,
    fontSize: 6.5,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  leftBodyCell: {
    borderWidth: 1,
    borderColor: "#cccccc",
    padding: 5,
    fontSize: 6.5,
    textAlign: "left",
    fontFamily: "Helvetica-Bold",
  },
  footerLabel: {
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "#f0f0f0",
    padding: 5,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  footerValue: {
    borderWidth: 1,
    borderColor: "#cccccc",
    backgroundColor: "#e0e0e0",
    padding: 5,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 9,
    padding: 12,
  },
})

function getCategoryWidth(chunkSize: number, includeTotal: boolean): number {
  const fixed = W.employeeName + W.jobClassification + (includeTotal ? W.total : 0)
  return (TABLE_WIDTH - fixed) / chunkSize
}

function CategoryChunkTable({
  categoryChunk,
  employees,
  employeeTotals,
  grandTotalHours,
  chunkIndex,
  chunkCount,
  startingColumnNumber,
  accumulatedNspmp,
}: {
  categoryChunk: TcmMaaAdhocCategory[]
  employees: TcmMaaAdhocEmployee[]
  employeeTotals: Record<string, number>
  grandTotalHours: number
  chunkIndex: number
  chunkCount: number
  startingColumnNumber: number
  accumulatedNspmp: { value: number }
}) {
  const isLastChunk = chunkIndex === chunkCount - 1
  const categoryWidth = getCategoryWidth(categoryChunk.length, isLastChunk)
  const chunkColumnTotals: Record<string, number> = {}

  categoryChunk.forEach((category) => {
    chunkColumnTotals[category.name] = 0
  })

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <View style={[styles.transparentCell, { width: W.employeeName }]} />
        <View style={[styles.transparentCell, { width: W.jobClassification, borderRightWidth: 1, borderRightColor: "#000000" }]} />
        {categoryChunk.map((category, index) => (
          <Text
            key={`num-${category.name}-${index}`}
            style={[styles.categoryNumberHeader, { width: categoryWidth }]}
          >
            {formatTcmMaaAdhocColumnNumber(startingColumnNumber + index)}
          </Text>
        ))}
      </View>

      <View style={styles.row}>
        <Text style={[styles.categoryDescriptionHeader, { width: W.employeeName }]}>Employee Name</Text>
        <Text style={[styles.categoryDescriptionHeader, { width: W.jobClassification }]}>
          Job Classification
        </Text>
        {categoryChunk.map((category, index) => (
          <Text
            key={`desc-${category.name}-${index}`}
            style={[styles.categoryDescriptionHeader, { width: categoryWidth }]}
          >
            {category.name}
          </Text>
        ))}
        {isLastChunk ? (
          <Text style={[styles.categoryDescriptionHeader, { width: W.total, textAlign: "center" }]}>
            Total
          </Text>
        ) : null}
      </View>

      {employees.map((employee, employeeIndex) => {
        let rowHours = 0
        return (
          <View key={`${employee.employeename}-${employeeIndex}`} style={styles.row}>
            <Text style={[styles.leftBodyCell, { width: W.employeeName }]}>
              {formatTcmMaaAdhocEmployeeName(employee.employeename)}
            </Text>
            <Text style={[styles.leftBodyCell, { width: W.jobClassification }]}>
              {employee.jobclassification}
            </Text>
            {categoryChunk.map((category, index) => {
              const rawHours = employee.category_hours[category.name]
              const numericHours =
                rawHours !== null && rawHours !== undefined ? Number(rawHours) || 0 : 0
              chunkColumnTotals[category.name] += numericHours
              rowHours += numericHours
              return (
                <Text key={`${employee.employeename}-${category.name}-${index}`} style={[styles.bodyCell, { width: categoryWidth }]}>
                  {formatTcmMaaAdhocHours(rawHours)}
                </Text>
              )
            })}
            {isLastChunk ? (
              <Text style={[styles.bodyCell, { width: W.total }]}>
                {formatTcmMaaAdhocHours(employeeTotals[employee.employeename] ?? rowHours)}
              </Text>
            ) : null}
          </View>
        )
      })}

      <View style={styles.row}>
        <Text style={[styles.footerLabel, { width: W.employeeName + W.jobClassification }]}>
          Total Hours:
        </Text>
        {categoryChunk.map((category, index) => (
          <Text key={`total-${category.name}-${index}`} style={[styles.footerValue, { width: categoryWidth }]}>
            {chunkColumnTotals[category.name].toFixed(2)}
          </Text>
        ))}
        {isLastChunk ? (
          <Text style={[styles.footerValue, { width: W.total }]}>{grandTotalHours.toFixed(2)}</Text>
        ) : null}
      </View>

      <View style={styles.row}>
        <Text style={[styles.footerLabel, { width: W.employeeName + W.jobClassification }]}>NSPMP%</Text>
        {categoryChunk.map((category, index) => {
          const nspmp =
            grandTotalHours > 0 ? (chunkColumnTotals[category.name] / grandTotalHours) * 100 : 0
          accumulatedNspmp.value += nspmp
          return (
            <Text key={`nspmp-${category.name}-${index}`} style={[styles.footerValue, { width: categoryWidth }]}>
              {formatTcmMaaAdhocNspmp(nspmp)}
            </Text>
          )
        })}
        {isLastChunk ? (
          <Text style={[styles.footerValue, { width: W.total }]}>
            {formatTcmMaaAdhocNspmp(accumulatedNspmp.value)}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

function TCMMAAADHOCReportPage({
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
    <Page size="A3" orientation="landscape" style={[styles.page, pagePadding]} wrap>
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

function TCMMAAADHOCReportDocument({
  payload,
  printedOn,
  meta,
  footerVariant,
}: TCMMAAADHOCReportPdfProps & {
  meta: ResolvedReportPdfMeta
  footerVariant: ReportPdfFooterVariant
}) {
  const employees = sortTcmMaaAdhocEmployees(payload.employees)
  const categoryChunks = chunkTcmMaaAdhocCategories(payload.categories)
  const { employeeTotals, grandTotalHours } = computeTcmMaaAdhocTotals(employees, payload.categories)
  const accumulatedNspmp = { value: 0 }

  if (!payload.categories.length || !employees.length) {
    return (
      <Document>
        <TCMMAAADHOCReportPage meta={meta} footerVariant={footerVariant} printedOn={printedOn}>
          <Text style={styles.emptyMessage}>No data available for the selected period.</Text>
        </TCMMAAADHOCReportPage>
      </Document>
    )
  }

  let startingColumnNumber = 1

  return (
    <Document>
      {categoryChunks.map((categoryChunk, chunkIndex) => {
        const page = (
          <TCMMAAADHOCReportPage
            key={`chunk-${chunkIndex}`}
            meta={meta}
            footerVariant={footerVariant}
            printedOn={printedOn}
          >
            <CategoryChunkTable
              categoryChunk={categoryChunk}
              employees={employees}
              employeeTotals={employeeTotals}
              grandTotalHours={grandTotalHours}
              chunkIndex={chunkIndex}
              chunkCount={categoryChunks.length}
              startingColumnNumber={startingColumnNumber}
              accumulatedNspmp={accumulatedNspmp}
            />
          </TCMMAAADHOCReportPage>
        )
        startingColumnNumber += categoryChunk.length
        return page
      })}
    </Document>
  )
}

export async function generateTCMMAAADHOCReportPdf(props: TCMMAAADHOCReportPdfProps): Promise<Blob> {
  const printedOn = props.printedOn ?? formatPrintedOnLabel()
  const activityCodeTypes = props.activityCodeTypes?.length ? props.activityCodeTypes : ["MAA", "TCM"]

  const meta = await buildResolvedPdfMeta(
    {
      ...props.meta,
      reportCode: props.meta?.reportCode ?? "TCM_MAA_ADHOC",
      reportTitle:
        props.meta?.reportTitle ??
        resolveReportTitle("TCM_MAA_ADHOC", { activityCodeTypes }),
    },
    REPORT_PDF_DEFAULT_LOGOS,
  )
  const footerVariant = resolveFooterVariant(meta.reportCode)

  const instance = pdf(
    <TCMMAAADHOCReportDocument
      {...props}
      printedOn={printedOn}
      meta={meta}
      footerVariant={footerVariant}
    />,
  )

  const blob = await instance.toBlob()
  return ensurePdfBlob(blob)
}
