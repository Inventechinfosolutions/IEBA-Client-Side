// type SavedBucketItem = { code: string; label: string }

// export function SavedBucketPanel({
//   title,
//   subtitle,
//   items,
// }: {
//   title: string
//   subtitle?: string
//   items: SavedBucketItem[]
// }) {
//   return (
//     <div className="overflow-hidden rounded-[8px] border border-[#e7e9f2]">
//       <div className="flex min-h-[34px] flex-col items-center justify-center bg-[var(--primary)] px-3 py-1">
//         <div className="text-[12px] font-medium text-white">{title}</div>
//         {subtitle ? (
//           <div className="text-[10px] font-normal text-white/85">{subtitle}</div>
//         ) : null}
//       </div>
//       <div className="max-h-[120px] overflow-y-auto bg-white [scrollbar-gutter:stable]">
//         {items.length === 0 ? (
//           <p className="px-3 py-4 text-center text-[12px] text-[#6b7280]">None selected</p>
//         ) : (
//           <ul className="divide-y divide-[#e7e9f2]">
//             {items.map((item) => (
//               <li
//                 key={item.code}
//                 className="px-3 py-2 text-center text-[12px] text-[#111827]"
//               >
//                 {item.label}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </div>
//   )
// }
