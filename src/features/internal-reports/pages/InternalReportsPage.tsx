import { PostedRecordsCountReport } from "../components/PostedRecordsCountReport"

export function InternalReportsPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.28px] text-[#1d1d1f]">PKI Reports</h1>
        <p className="mt-1 text-[14px] text-[#7a7a7a]">
          Internal reports for PKI administrators. Not visible to clients.
        </p>
      </div>
      <section className="rounded-[11px] border border-[#e0e0e0] bg-white p-6">
        <h2 className="mb-4 text-[17px] font-semibold text-[#1d1d1f]">A010: Count of Posted Records</h2>
        <PostedRecordsCountReport />
      </section>
    </div>
  )
}

export default InternalReportsPage
