import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Download,
  FileText,
  BookOpen,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  User,
  LayoutGrid,
  Clock,
  DollarSign,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";

import superAdminPdf from "@/documents/IEBA_SuperAdmin_Manual.pdf";
import deptAdminPdf from "@/documents/IEBA_DepartmnentAdmin_Manual.pdf";
import payrollAdminPdf from "@/documents/IEBA_PayrollAdmin_Manual.pdf";
import timeStudyAdminPdf from "@/documents/IEBA_TimeStudyAdmin_Manual.pdf";
import supervisorPdf from "@/documents/IEBA_Supervisor_Manual.pdf";
import userPdf from "@/documents/IEBA_User_Manual.pdf";

export interface ManualItem {
  id: string;
  title: string;
  subtitle: string;
  roleBadge: string;
  description: string;
  fileSize: string;
  pages: string;
  url: string;
  fileName: string;
  roleKeys: string[];
  color: string;
  icon: React.ReactNode;
}

const ALL_MANUALS: ManualItem[] = [
  {
    id: "superadmin",
    title: "Super Admin Manual",
    subtitle: "IEBA System Administration",
    roleBadge: "Super Admin",
    description: "Full system control — county settings, user management, permissions, and global configuration.",
    fileSize: "21.8 MB",
    pages: "~180 pages",
    url: superAdminPdf,
    fileName: "IEBA_SuperAdmin_Manual.pdf",
    roleKeys: ["super admin", "superadmin"],
    color: "#6C5DD3",
    icon: React.createElement(ShieldCheck, { className: "h-5 w-5" }),
  },
  {
    id: "deptadmin",
    title: "Department Admin Manual",
    subtitle: "IEBA Department Management",
    roleBadge: "Department Admin",
    description: "Manage departments, assign employees, configure department settings, and run reports.",
    fileSize: "15.6 MB",
    pages: "~130 pages",
    url: deptAdminPdf,
    fileName: "IEBA_DepartmnentAdmin_Manual.pdf",
    roleKeys: ["department admin", "dept admin", "departmentadmin"],
    color: "#6C5DD3",
    icon: React.createElement(LayoutGrid, { className: "h-5 w-5" }),
  },
  {
    id: "payrolladmin",
    title: "Payroll Admin Manual",
    subtitle: "IEBA Payroll Administration",
    description: "Payroll rates, lockouts, export settings, earning codes, and payroll report generation.",
    roleBadge: "Payroll Admin",
    fileSize: "9.4 MB",
    pages: "~80 pages",
    url: payrollAdminPdf,
    fileName: "IEBA_PayrollAdmin_Manual.pdf",
    roleKeys: ["payroll admin", "payrolladmin"],
    color: "#6C5DD3",
    icon: React.createElement(DollarSign, { className: "h-5 w-5" }),
  },
  {
    id: "timestudyadmin",
    title: "Time Study Admin Manual",
    subtitle: "IEBA Time Study Administration",
    description: "Create time studies, configure activity codes, manage review workflows, and study analytics.",
    roleBadge: "Time Study Admin",
    fileSize: "12.5 MB",
    pages: "~105 pages",
    url: timeStudyAdminPdf,
    fileName: "IEBA_TimeStudyAdmin_Manual.pdf",
    roleKeys: ["time study admin", "timestudyadmin"],
    color: "#6C5DD3",
    icon: React.createElement(BarChart2, { className: "h-5 w-5" }),
  },
  {
    id: "supervisor",
    title: "Supervisor Manual",
    subtitle: "IEBA Team Supervision",
    description: "Review timesheets, approve employee activities, track team performance, and supervisor workflows.",
    roleBadge: "Supervisor",
    fileSize: "12.5 MB",
    pages: "~105 pages",
    url: supervisorPdf,
    fileName: "IEBA_Supervisor_Manual.pdf",
    roleKeys: ["supervisor", "time study supervisor", "timestudysupervisor"],
    color: "#6C5DD3",
    icon: React.createElement(Clock, { className: "h-5 w-5" }),
  },
  {
    id: "user",
    title: "User Manual",
    subtitle: "IEBA Daily Operations",
    description: "Time entry, task logging, personal profile management, and everyday employee features.",
    roleBadge: "User / Employee",
    fileSize: "3.8 MB",
    pages: "~40 pages",
    url: userPdf,
    fileName: "IEBA_User_Manual.pdf",
    roleKeys: ["user", "employee", "default"],
    color: "#6C5DD3",
    icon: React.createElement(User, { className: "h-5 w-5" }),
  },
];

interface UserManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [downloading, setDownloading] = useState<string | null>(null);

  const availableManuals = useMemo(() => {
    if (isSuperAdmin) return ALL_MANUALS;
    const userRoles = (user?.roles || []).map((r) => r.toLowerCase());
    const matched = ALL_MANUALS.filter((manual) => {
      if (manual.id === "user") return true;
      return manual.roleKeys.some((rk) =>
        userRoles.some((ur) => ur === rk || ur.includes(rk))
      );
    });
    return matched.length > 0 ? matched : [ALL_MANUALS.find((m) => m.id === "user")!];
  }, [user?.roles, isSuperAdmin]);

  const handleDownload = async (url: string, fileName: string, id: string, title: string) => {
    setDownloading(id);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`"${title}" downloaded successfully`, { duration: 3500 });



    } catch {
      toast.error("Download failed", {
        description: "Could not download the manual. Please try again.",
        duration: 4000,
      });
    } finally {
      setTimeout(() => setDownloading(null), 1500);
    }
  };

  return (
    <>
      <style>{`
        @keyframes manual-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes manual-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes dl-bounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(3px); }
          70% { transform: translateY(-2px); }
        }
        .manual-card:hover .manual-icon-wrap {
          transform: scale(1.1) rotate(-3deg);
        }
        .manual-card:hover .manual-dl-btn {
          transform: translateY(0);
          opacity: 1;
        }
        .dl-icon-anim {
          animation: dl-bounce 1.4s ease-in-out infinite;
        }
        .manual-shimmer-bar {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: manual-shimmer 2.8s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showClose={false} className="sm:max-w-[620px] p-0 overflow-hidden border-0 shadow-[0_32px_80px_rgba(0,0,0,0.28)] rounded-3xl">

          {/* -- HEADER ------------------------------- */}
          <div
            className="relative overflow-hidden px-7 py-6"
            style={{
              background: "linear-gradient(135deg, #4C3B9E 0%, #6C5DD3 45%, #8B74E8 100%)",
            }}
          >
            <div className="manual-shimmer-bar" />

            {/* Custom white close button */}
            <DialogClose asChild>
              <button
                type="button"
                className="absolute top-4 right-4 z-20 flex items-center justify-center w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </DialogClose>

            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/[0.07] blur-2xl" />
            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/[0.05] blur-2xl" />
            <div className="absolute top-3 right-20 w-12 h-12 rounded-full bg-purple-300/20" />

            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-4">
                {/* Icon box */}
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-lg"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <BookOpen className="h-6 w-6 text-white" style={{ animation: "manual-float 3s ease-in-out infinite" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-[20px] font-bold text-white tracking-tight mb-1">
                    User Manuals & Documentation
                  </DialogTitle>
                  <DialogDescription className="text-white/75 text-[13px] leading-snug">
                    {isSuperAdmin
                      ? "Full access — download documentation for any system role."
                      : "Download official guides for your assigned  roles."}
                  </DialogDescription>
                </div>

              </div>

              {/* Stats row */}
              <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="flex items-center gap-1.5 text-white/70 text-[12px]">
                  <FileText className="h-3.5 w-3.5" />
                  <span><strong className="text-white">{availableManuals.length}</strong> {availableManuals.length === 1 ? "Manual" : "Manuals"} Available</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70 text-[12px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Official PDF Documentation</span>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* -- MANUAL LIST --------------------------- */}
          <div className="bg-[#F6F7FB] dark:bg-[#111113] px-5 py-5 space-y-3 max-h-[54vh] overflow-y-auto">
            {availableManuals.map((manual) => (
              <div
                key={manual.id}
                className="manual-card group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1C1C1F] border border-gray-100 dark:border-[#2E2E35] shadow-sm hover:shadow-lg hover:border-transparent transition-all duration-250 cursor-default"
                style={{ "--manual-color": manual.color } as React.CSSProperties}
              >
                {/* Left color strip */}
                <div
                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-200"
                  style={{ background: manual.color, opacity: 0.7 }}
                />

                {/* Icon */}
                <div
                  className="manual-icon-wrap flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-300 shrink-0 ml-2"
                  style={{ background: `${manual.color}18`, color: manual.color }}
                >
                  {manual.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[var(--manual-color)] transition-colors truncate">
                      {manual.title}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        background: `${manual.color}15`,
                        color: manual.color,
                        border: `1px solid ${manual.color}30`,
                      }}
                    >
                      {manual.roleBadge}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mb-1">
                    {manual.subtitle}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 leading-relaxed">
                    {manual.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                    <span className="font-mono">{manual.fileSize}</span>
                    <span>·</span>
                    <span>{manual.pages}</span>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  type="button"
                  disabled={downloading === manual.id}
                  onClick={() => handleDownload(manual.url, manual.fileName, manual.id, manual.title)}
                  className="shrink-0 flex items-center justify-center gap-1.5 w-10 h-10 rounded-xl font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                  style={{
                    background: `linear-gradient(135deg, ${manual.color}, ${manual.color}CC)`,
                    boxShadow: `0 4px 14px ${manual.color}40`,
                  }}
                  title={`Download ${manual.title}`}
                >
                  {downloading === manual.id ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <Download className="h-4 w-4 dl-icon-anim" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* -- FOOTER ------------------------------- */}
          <div className="bg-white dark:bg-[#111113] border-t border-gray-100 dark:border-[#2E2E35] px-6 py-3 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#6C5DD3]" />
              IEBA Official Documentation
            </span>
            <span className="text-[11px] text-gray-400">PDF Format · Secure Download</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};





