import { SettingsForm } from "@/features/settings/components/SettingsForm"

export function SettingsPage() {
  return (
    <section
      className="font-roboto *:font-roboto w-full"
      style={{
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      <h1 className="mb-3 text-[16px] font-bold text-[#111827]">Settings</h1>
      <div className="w-full rounded-[10px] border border-gray-300 bg-white px-4 py-6 sm:px-6 md:px-8 xl:px-12 shadow-[0_2px_10px_rgba(0,0,0,0.03)] xl:max-h-[calc(100svh-160px)] xl:overflow-auto">
        <SettingsForm />
      </div>
    </section>
  )
}


export default SettingsPage

