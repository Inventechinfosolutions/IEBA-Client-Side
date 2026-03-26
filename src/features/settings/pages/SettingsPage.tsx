import { SettingsForm } from "@/features/settings/components/SettingsForm"

export function SettingsPage() {
  return (
    <section
      className="ieba-roboto w-full"
      style={{
        zoom: 1.2,
        "--primary": "#6C5DD3",
      } as React.CSSProperties}
    >
      <h1 className="mb-3 text-[16px] font-bold text-[#111827]">Settings</h1>
      <div className="w-full rounded-[10px] border border-gray-300 bg-white px-20 py-6 md:px-14 md:py-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <SettingsForm />
      </div>
    </section>
  )
}

