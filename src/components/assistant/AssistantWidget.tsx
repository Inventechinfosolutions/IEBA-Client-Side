import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { HelpCircle, Lightbulb, Info, Download } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search";
import { Card, CardContent } from "@/components/ui/card";
import { UserManualModal } from "./UserManualModal";

const ASSISTANT_TOOLTIP =
  "👋 Hi! I'm your IEBA Assistant. I'm here to help answer your questions about the IEBA application.";

interface AssistantQA {
  id: number;
  question: string;
  answer: string;
}

interface AssistantWidgetProps {
  userRole: string;
  currentModule?: string;
  currentScreen?: string;
}

export const AssistantWidget: React.FC<AssistantWidgetProps> = ({
  userRole,
  currentModule,
  currentScreen,
}) => {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const derivedModule = currentModule || pathParts[0] || "dashboard";
  const derivedScreen = currentScreen || pathParts[1] || "index";

  const [questions, setQuestions] = useState<AssistantQA[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const shouldShowWelcomeTip =
    derivedModule === "dashboard" || derivedModule === "personal-time-study";

  // Welcome tip on Dashboard and Personal Time Study (all roles)
  useEffect(() => {
    if (!shouldShowWelcomeTip) {
      setTooltipOpen(false);
      return;
    }

    setTooltipOpen(false);
    const showTimer = window.setTimeout(() => {
      setTooltipOpen(true);
    }, 400);
    const hideTimer = window.setTimeout(() => setTooltipOpen(false), 5400);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [location.pathname, shouldShowWelcomeTip]);

  useEffect(() => {
    if (open) setTooltipOpen(false);
  }, [open]);

  useEffect(() => {
    setSelectedQuestion("");
    if (!open) return;
    const fetchQuestions = async () => {
      setLoading(true);
      setError("");
      try {
        const queryParams = new URLSearchParams({
          role: userRole,
          module: derivedModule,
          screen: derivedScreen,
        });
        const res = await api.get<AssistantQA[]>(`/assistant/questions?${queryParams.toString()}`);
        setQuestions(res || []);
      } catch (err: any) {
        console.error("Failed to load assistant questions", err);
        setError("Failed to load help content.");
      } finally {
        setLoading(false);
      }
    };
    if (userRole && derivedModule && derivedScreen) {
      fetchQuestions();
    }
  }, [userRole, derivedModule, derivedScreen, open]);

  const activeAnswer = questions.find((q) => q.id.toString() === selectedQuestion)?.answer;
  const options = useMemo(() => questions.map((q) => ({
    value: q.id.toString(),
    label: q.question,
  })), [questions]);

  return (
    <>
      <style>{`
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-text-shine {
          background: linear-gradient(to right,#fff 20%,#c7d2fe 40%,#c7d2fe 60%,#fff 80%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: text-shine 3s linear infinite;
        }
        @keyframes dl-drop {
          0%,100%{transform:translateY(0)}
          40%{transform:translateY(3px)}
          70%{transform:translateY(-1px)}
        }
        .dl-drop { animation: dl-drop 1.6s ease-in-out infinite; }
      `}</style>

      <TooltipProvider delayDuration={200}>
        <Tooltip
          open={!open && tooltipOpen}
          onOpenChange={(next) => {
            if (!open) setTooltipOpen(next);
          }}
        >
          <Popover
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (next) setTooltipOpen(false);
            }}
          >
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="IEBA Assistant"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#6C5DD3]/40 shadow-[0_0_0_2px_rgba(108,93,211,0.15)] bg-white text-[#6C5DD3] hover:border-[#6C5DD3]/70 hover:shadow-[0_0_0_3px_rgba(108,93,211,0.25)] transition-all group dark:bg-[#09090b] dark:border-[#6C5DD3]/50 dark:shadow-[0_0_0_2px_rgba(108,93,211,0.25)] dark:hover:border-[#6C5DD3]/80 dark:hover:shadow-[0_0_0_3px_rgba(108,93,211,0.4)]"
                >
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C5DD3] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6C5DD3]"></span>
                  </span>
                  <HelpCircle className="size-[20px] sm:size-[22px] group-hover:rotate-12 transition-transform duration-300" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>

            <TooltipContent
              side="bottom"
              sideOffset={8}
              className="max-w-[240px] border-0 bg-[#6C5DD3] px-3 py-2 text-left text-[13px] font-normal leading-relaxed text-white rounded-[8px] [&_svg]:bg-[#6C5DD3] [&_svg]:fill-[#6C5DD3]"
            >
              {ASSISTANT_TOOLTIP}
            </TooltipContent>

            <PopoverContent
              className="w-[360px] sm:w-[420px] p-0 overflow-hidden shadow-2xl border-[#6C5DD3]/30 dark:border-[#6C5DD3]/40 dark:bg-[#18181b] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-3 duration-200"
              align="end"
              sideOffset={12}
            >
              {/* Header */}
              <div className="bg-[#6C5DD3] px-4 py-2 text-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Info className="h-5 w-5 text-white/90 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-bold leading-none mb-1 tracking-wide drop-shadow-sm animate-text-shine">
                      Page Assistant
                    </h4>
                    <p className="text-[11px] text-white/80 leading-none font-medium">
                      Find answers to common questions
                    </p>
                  </div>
                </div>

                {/* Manual download box */}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setTimeout(() => setManualOpen(true), 150);
                  }}
                  className="shrink-0 flex items-center gap-2 pl-2.5 pr-4 py-1 rounded-xl text-[13px] font-bold text-[#6C5DD3] transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 hover:brightness-105"
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #EDE9FF 100%)",
                    boxShadow: "0 2px 12px rgba(108,93,211,0.35), 0 0 0 1px rgba(255,255,255,0.6) inset",
                  }}
                  title="User Manuals & Documentation"
                >
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-xl"
                    style={{ background: "linear-gradient(135deg, #6C5DD3, #8B7DD3)", boxShadow: "0 2px 6px rgba(108,93,211,0.5)" }}
                  >
                    <Download className="h-4 w-4 text-white dl-drop" />
                  </span>
                  <span>Manual</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 bg-gray-50/30 dark:bg-[#18181b]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-6 space-y-3">
                    <Spinner className="size-8 text-[#6C5DD3]" />
                    <p className="text-xs text-muted-foreground">Loading FAQs...</p>
                  </div>
                ) : error ? (
                  <div className="text-sm text-center p-4 text-red-600 bg-red-50 border border-red-100 rounded-md">
                    {error}
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-sm text-center p-8 text-muted-foreground bg-gray-50 border border-gray-100 rounded-md">
                    No FAQs available for this page.
                  </div>
                ) : (
                  <div className="space-y-4 min-h-[120px]">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Select a Question</label>
                      <SingleSelectSearchDropdown
                        value={selectedQuestion}
                        onChange={setSelectedQuestion}
                        onBlur={() => { }}
                        options={options}
                        placeholder="Search questions..."
                        className="bg-white shadow-sm border-gray-200 dark:bg-[#27272a] dark:border-[#3f3f46]"
                      />
                    </div>
                    {activeAnswer && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <Card className="border border-[#6C5DD3]/20 dark:border-[#6C5DD3]/40 bg-gradient-to-b from-[#6C5DD3]/[0.05] to-white dark:from-[#6C5DD3]/10 dark:to-[#27272a] shadow-sm overflow-hidden">
                          <div className="bg-[#6C5DD3]/10 dark:bg-[#6C5DD3]/20 px-3 py-2 border-b border-[#6C5DD3]/20 dark:border-[#6C5DD3]/40 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-[#6C5DD3]" />
                            <span className="text-[11px] font-bold text-[#6C5DD3] uppercase tracking-wider">Answer</span>
                          </div>
                          <CardContent className="p-3.5 text-[13px] whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
                            {activeAnswer}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </Tooltip>
      </TooltipProvider>

      <UserManualModal open={manualOpen} onOpenChange={setManualOpen} />
    </>
  );
};
