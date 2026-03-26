import { ProfileDetail } from "../components/ProfileDetail"

export function ProfilePage() {
  return (
    <div
      className="ieba-roboto ieba-scale-120 w-full"
    >
      <h1 className="text-[22px] font-semibold text-[#111827]">Profile Details</h1>
      <section className="mt-6 w-full rounded-[10px] border border-[#e6e7ef] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <ProfileDetail />
      </section>
    </div>
  )
}

