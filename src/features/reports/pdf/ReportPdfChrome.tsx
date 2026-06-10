import { Image, StyleSheet, Text, View } from "@react-pdf/renderer"

import { formatPrintedOnLabel, type ReportPdfFooterVariant } from "./reportPdf"

const LOGO_SIZE = 36
const SIGNATURE_ROW_WIDTH = 544

const SIGNATURE_SLOTS = [
  { label: "Employee Signature", lineWidth: 122 },
  { label: "Date", lineWidth: 42 },
  { label: "Supervisor Signature", lineWidth: 130 },
  { label: "Date", lineWidth: 42 },
] as const

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 6,
    fontFamily: "Helvetica",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
    width: "100%",
  },
  reportTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    width: "100%",
  },
  logoSlot: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#666666",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: SIGNATURE_ROW_WIDTH,
  },
  signatureField: {
    alignItems: "center",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
  },
  signatureLabel: {
    marginTop: 5,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#5c5c5c",
    textAlign: "center",
  },
  pageMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: SIGNATURE_ROW_WIDTH,
    marginTop: 16,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  pageOnlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  inlineSignature: {
    marginTop: 28,
    marginBottom: 12,
    fontFamily: "Helvetica",
    width: SIGNATURE_ROW_WIDTH,
  },
})

export function ReportPdfHeader({
  countyName,
  reportTitle,
  countyLogoSrc,
  rightLogoSrc,
  titleColor,
}: {
  countyName: string
  reportTitle: string
  countyLogoSrc?: string
  rightLogoSrc?: string
  titleColor?: string
}) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.logoSlot}>
        {countyLogoSrc ? <Image src={countyLogoSrc} style={styles.logo} /> : null}
      </View>
      <View style={styles.headerCenter}>
        {countyName.trim() ? <Text style={styles.countyName}>{countyName.trim()}</Text> : null}
        <Text
          style={titleColor ? [styles.reportTitle, { color: titleColor }] : styles.reportTitle}
        >
          {reportTitle}
        </Text>
      </View>
      <View style={styles.logoSlot}>
        {rightLogoSrc ? <Image src={rightLogoSrc} style={styles.logo} /> : null}
      </View>
    </View>
  )
}

function SignatureField({ label, lineWidth }: { label: string; lineWidth: number }) {
  return (
    <View style={styles.signatureField}>
      <View style={[styles.signatureLine, { width: lineWidth }]} />
      <Text style={styles.signatureLabel}>{label}</Text>
    </View>
  )
}

export function ReportPdfEmployeeSignature({ printedOn }: { printedOn?: string }) {
  const printedLabel = printedOn ?? formatPrintedOnLabel()

  return (
    <View style={styles.inlineSignature} wrap={false}>
      <View style={styles.signatureRow}>
        {SIGNATURE_SLOTS.map((slot, index) => (
          <SignatureField
            key={`${slot.label}-${index}`}
            label={slot.label}
            lineWidth={slot.lineWidth}
          />
        ))}
      </View>
      <View style={styles.pageMetaRow}>
        <Text>Printed on {printedLabel}</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </View>
  )
}

function FixedSignatureFooter({ printedOn }: { printedOn: string }) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.signatureRow}>
        {SIGNATURE_SLOTS.map((slot, index) => (
          <SignatureField
            key={`${slot.label}-${index}`}
            label={slot.label}
            lineWidth={slot.lineWidth}
          />
        ))}
      </View>
      <View style={styles.pageMetaRow}>
        <Text fixed>Printed on {printedOn}</Text>
        <Text
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
    </View>
  )
}

export function ReportPdfFooter({
  variant,
  printedOn,
}: {
  variant: ReportPdfFooterVariant
  printedOn?: string
}) {
  const printedLabel = printedOn ?? formatPrintedOnLabel()

  if (variant === "signaturePerPage") {
    return <FixedSignatureFooter printedOn={printedLabel} />
  }

  if (variant === "minimal" || variant === "signature") {
    return <View style={styles.footer} fixed />
  }

  return (
    <View style={styles.footer} fixed>
      <View style={styles.pageOnlyRow}>
        <Text>Printed on {printedLabel}</Text>
        <Text
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </View>
    </View>
  )
}

/** Fixed page numbers on every page — used when inline footer has Printed on but chrome is minimal. */
export function ReportPdfPageNumbers() {
  return (
    <View style={[styles.footer, { alignItems: "flex-end" }]} fixed>
      <Text
        style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: "#000000" }}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        fixed
      />
    </View>
  )
}

export function resolvePagePadding(footerVariant: ReportPdfFooterVariant): {
  paddingTop: number
  paddingBottom: number
} {
  switch (footerVariant) {
    case "minimal":
      return { paddingTop: 80, paddingBottom: 28 }
    case "signature":
      return { paddingTop: 80, paddingBottom: 32 }
    case "signaturePerPage":
      return { paddingTop: 80, paddingBottom: 108 }
    case "pageOnly":
      return { paddingTop: 80, paddingBottom: 52 }
    default:
      return { paddingTop: 80, paddingBottom: 52 }
  }
}
