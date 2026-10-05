"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bot,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Wand2,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import api from "@/lib/axios";

// ============================================================
// TYPES
// ============================================================
interface JobDraft {
  nhom_viec?: string;
  tieu_de?: string;
  mo_ta?: string;
  ky_nang_can?: string;
  thu_lao?: number;
  loai_cong_viec?: "remote" | "onsite";
  so_luong_can?: number;
  so_buoi?: number;
  gio_uoc_tinh?: number;
  han_chot?: string;
  han_nop_file?: string;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  dia_chi_lam_viec?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  jobDraft?: JobDraft | null;
}

const STORAGE_KEY = "stujob_chatbot_history";
const JOB_DRAFT_KEY = "stujob_job_draft";

// ============================================================
// COMPONENT
// ============================================================
export function ChatbotWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const sinhVien = useAuthStore((s) => s.sinhVien);
  const nhaTuyenDung = useAuthStore((s) => s.nhaTuyenDung);
  const admin = useAuthStore((s) => s.admin);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);

  const role: "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien" | null =
    sinhVien
      ? "sinh_vien"
      : nhaTuyenDung
        ? "nha_tuyen_dung"
        : admin
          ? "quan_tri_vien"
          : null;

  const isAuthPage =
    pathname?.includes("/login") || pathname?.includes("/register");
  const shouldShow = role && !isAuthPage;

  // Load history
  useEffect(() => {
    if (!shouldShow) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, [shouldShow]);

  // Save history
  useEffect(() => {
    if (!shouldShow) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, shouldShow]);

  // Auto scroll
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  // Reset khi đổi role
  useEffect(() => {
    if (!role) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [role]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const apiHistory = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await api.post("/api/chatbot", {
        message: text,
        history: apiHistory,
      });

      if (data.success) {
        const assistantMsg: Message = {
          role: "assistant",
          content: data.reply,
          jobDraft: data.job_draft || null,
        };
        setMessages((h) => [...h, assistantMsg]);
      } else {
        setMessages((h) => [
          ...h,
          { role: "assistant", content: `❌ ${data.message}` },
        ]);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || "Lỗi kết nối";
      setMessages((h) => [
        ...h,
        { role: "assistant", content: `❌ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleFillForm(draft: JobDraft) {
    sessionStorage.setItem(JOB_DRAFT_KEY, JSON.stringify(draft));
    setOpen(false);
    router.push("/employer/post-job");
  }

  function clearHistory() {
    if (!confirm("Xóa lịch sử chat?")) return;
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  if (!shouldShow) return null;

  const accent =
    role === "sinh_vien"
      ? { grad: "from-indigo-500 to-purple-600", ring: "ring-indigo-500/20" }
      : role === "nha_tuyen_dung"
        ? { grad: "from-sky-500 to-indigo-600", ring: "ring-sky-500/20" }
        : { grad: "from-purple-600 to-purple-900", ring: "ring-purple-500/20" };

  const greeting =
    role === "sinh_vien"
      ? "👋 Xin chào! Tôi là trợ lý Stujob. Bạn cần tư vấn việc làm?"
      : role === "nha_tuyen_dung"
        ? "👋 Xin chào! Mô tả công việc bạn cần tuyển, tôi sẽ giúp tạo tin đăng."
        : "👋 Xin chào! Tôi có thể giải thích các chức năng admin.";

  const placeholder =
    role === "nha_tuyen_dung"
      ? 'VD: "Đăng tin thiết kế web lương 3 triệu remote"'
      : "Nhập câu hỏi...";

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br ${accent.grad} text-white shadow-lg hover:shadow-xl hover:scale-105 transition z-[60] flex items-center justify-center`}
          aria-label="Mở trợ lý ảo"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white" />
        </button>
      )}

      {/* Window */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-[60] ${accent.ring} ring-4`}
        >
          {/* Header */}
          <div
            className={`bg-gradient-to-r ${accent.grad} px-4 py-3 flex items-center gap-3 flex-shrink-0`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm">
                Trợ lý Stujob
              </div>
              <div className="flex items-center gap-1 text-[11px] text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                AI sẵn sàng hỗ trợ
              </div>
            </div>
            <button
              onClick={clearHistory}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition text-xs"
              title="Xóa lịch sử"
            >
              🗑️
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto p-3 bg-slate-50 flex flex-col gap-2 no-scrollbar"
          >
            {/* Greeting */}
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm text-slate-800 max-w-[85%]">
                  {greeting}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div key={i}>
                  <div
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                        isUser
                          ? `bg-gradient-to-br ${accent.grad} text-white rounded-br-md`
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>

                  {/* JOB DRAFT Preview Card */}
                  {m.jobDraft && (
                    <JobDraftCard
                      draft={m.jobDraft}
                      onFill={handleFillForm}
                      gradient={accent.grad}
                    />
                  )}
                </div>
              );
            })}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang suy nghĩ...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="border-t border-slate-200 p-3 flex gap-2 bg-white flex-shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={placeholder}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent.grad} text-white flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

// ============================================================
// JOB DRAFT PREVIEW CARD
// ============================================================
function JobDraftCard({
  draft,
  onFill,
  gradient,
}: {
  draft: JobDraft;
  onFill: (draft: JobDraft) => void;
  gradient: string;
}) {
  // CHỈ CÒN remote + onsite, BỎ hybrid
  const loaiLabel: Record<string, string> = {
    remote: "🌐 Online",
    onsite: "🏢 Offline",
  };

  const salary = draft.thu_lao
    ? Number(draft.thu_lao).toLocaleString("vi-VN") + "₫"
    : "—";

  const skills = (draft.ky_nang_can || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="mt-3 ml-0 mr-2 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-white" />
        <span className="text-xs font-bold text-white uppercase tracking-wide">
          Tin việc đã tạo
        </span>
        <Sparkles className="w-3.5 h-3.5 text-white/80 ml-auto" />
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        {/* Title */}
        <div>
          <div className="text-sm font-bold text-slate-900 line-clamp-2">
            {draft.tieu_de || "(Chưa có tiêu đề)"}
          </div>
          {draft.nhom_viec && (
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              📁 {draft.nhom_viec}
            </div>
          )}
        </div>

        {/* Description */}
        {draft.mo_ta && (
          <div className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {draft.mo_ta}
          </div>
        )}

        {/* Grid info */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <InfoItem label="💰 Thù lao" value={salary} />
          <InfoItem
            label="🎯 Hình thức"
            value={loaiLabel[draft.loai_cong_viec || "remote"] || "🌐 Online"}
          />
          {draft.han_chot && (
            <InfoItem label="⏰ Hạn ứng tuyển" value={draft.han_chot} />
          )}
          {draft.han_nop_file && (
            <InfoItem label="📤 Hạn nộp" value={draft.han_nop_file} />
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 5).map((s, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-700 text-[10px] font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={() => onFill(draft)}
          className={`w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${gradient} hover:opacity-90 text-white text-sm font-bold transition shadow-md`}
        >
          <Wand2 className="w-4 h-4" />
          Điền vào form đăng tin
          <CheckCircle2 className="w-4 h-4" />
        </button>

        <div className="text-[10px] text-slate-500 text-center">
          Kiểm tra và chỉnh sửa trước khi đăng
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-1.5 rounded-lg bg-white border border-emerald-100">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="font-semibold text-slate-800 text-[11px] truncate">
        {value}
      </div>
    </div>
  );
}