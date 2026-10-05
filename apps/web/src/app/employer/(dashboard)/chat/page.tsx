"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2, MessageSquare, Search, Send, Lock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/stores/auth.store";
import { fmtDateTime, fmtTimeAgo } from "@/lib/utils";

interface Partner {
  sinh_vien_id: number;
  ho_ten: string;
  ma_sinh_vien: string;
  anh_dai_dien: string | null;
  tin_cuoi: string | null;
  thoi_gian: string | null;
  chua_doc: number;
}

export default function EmployerChatPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  async function loadPartners() {
    try {
      const { data } = await api.get("/api/employer/messages/conversations");
      if (data.success) {
        setPartners(data.items || []);
        if (!activeId && data.items?.length) {
          setActiveId(data.items[0].sinh_vien_id);
        }
      }
    } catch {
      toast.error("Không tải được danh sách chat");
    } finally {
      setLoadingPartners(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Refresh partners mỗi 20s
  useEffect(() => {
    if (authLoading) return;
    const t = setInterval(() => {
      if (!document.hidden) loadPartners();
    }, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  const activePartner =
    partners.find((p) => p.sinh_vien_id === activeId) || null;

  const filtered = search.trim()
    ? partners.filter((p) =>
        p.ho_ten.toLowerCase().includes(search.trim().toLowerCase()) ||
        p.ma_sinh_vien?.toLowerCase().includes(search.trim().toLowerCase())
      )
    : partners;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-sky-500" />
          Tin nhắn
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Trao đổi trực tiếp với sinh viên đã được duyệt
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
        {/* LEFT: Partner list */}
        <aside className="border-r border-slate-200 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sinh viên..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingPartners ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Đang tải...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {search ? "Không tìm thấy" : "Chưa có cuộc trò chuyện nào"}
                </p>
                {!search && (
                  <p className="text-xs mt-1">
                    Chat mở khi bạn duyệt ứng tuyển của SV
                  </p>
                )}
              </div>
            ) : (
              filtered.map((p) => {
                const active = p.sinh_vien_id === activeId;
                const initial = (p.ho_ten || "?").charAt(0).toUpperCase();
                return (
                  <button
                    key={p.sinh_vien_id}
                    onClick={() => setActiveId(p.sinh_vien_id)}
                    className={`w-full flex items-center gap-3 p-3 border-b border-slate-100 text-left transition ${
                      active
                        ? "bg-sky-50 border-l-4 border-l-sky-500"
                        : "hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-slate-900 truncate">
                          {p.ho_ten}
                        </div>
                        {p.thoi_gian && (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {fmtTimeAgo(p.thoi_gian)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="text-xs text-slate-500 truncate">
                          {p.tin_cuoi || "Chưa có tin nhắn"}
                        </div>
                        {p.chua_doc > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {p.chua_doc > 9 ? "9+" : p.chua_doc}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT: Message thread */}
        {activePartner && activeId ? (
          <ChatThread
            key={activeId}
            partnerId={activeId}
            partnerName={activePartner.ho_ten}
            partnerCode={activePartner.ma_sinh_vien}
            onNewMessage={loadPartners}
          />
        ) : (
          <div className="hidden md:flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CHAT THREAD
// ============================================================
function ChatThread({
  partnerId,
  partnerName,
  partnerCode,
  onNewMessage,
}: {
  partnerId: number;
  partnerName: string;
  partnerCode: string;
  onNewMessage: () => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef(0);

  const nhaTuyenDung = useAuthStore((s) => s.nhaTuyenDung);
  const nhaTuyenDungId = nhaTuyenDung?.id ?? null;

  const {
    messages,
    loading,
    locked,
    lockedMessage,
    typingFrom,
    connected,
    sendMessage,
    emitTyping,
  } = useChat({
    sinhVienId: partnerId,
    nhaTuyenDungId,
    myRole: "nha_tuyen_dung",
    fallbackRest: true,
  });

  // Auto scroll
  useEffect(() => {
    if (!bodyRef.current) return;
    if (messages.length !== lastMsgCountRef.current) {
      lastMsgCountRef.current = messages.length;
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Notify parent để refresh partners
  useEffect(() => {
    if (messages.length > 0) onNewMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const clean = input.trim();
    if (!clean || sending) return;

    setSending(true);
    const ok = await sendMessage(clean);
    if (ok) {
      setInput("");
      emitTyping(false);
    } else {
      toast.error("Không gửi được tin nhắn");
    }
    setSending(false);
  }

  function handleInputChange(v: string) {
    setInput(v);
    emitTyping(v.length > 0);
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {(partnerName || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-slate-900 truncate">
            {partnerName}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            {typingFrom ? (
              <span className="text-sky-600 font-medium">Đang nhập...</span>
            ) : connected ? (
              <>
                Online
                {partnerCode && (
                  <span className="text-slate-400">• {partnerCode}</span>
                )}
              </>
            ) : (
              "Đang kết nối..."
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-2"
      >
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải tin nhắn...
          </div>
        ) : locked ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-sm">
              <Lock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700 mb-1">
                Chat đã bị khóa
              </p>
              <p className="text-sm text-slate-500">
                {lockedMessage ||
                  "Công việc đã nghiệm thu quá 1 ngày. Hãy mời SV làm việc mới nếu muốn tiếp tục liên lạc."}
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Chưa có tin nhắn nào</p>
            <p className="text-xs mt-1">
              Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.nguoi_gui === "nha_tuyen_dung";
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    isMe
                      ? "bg-sky-500 text-white rounded-br-md"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-md"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {m.noi_dung}
                  </div>
                  <div
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-sky-100" : "text-slate-400"
                    }`}
                  >
                    {fmtDateTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingFrom && !locked && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span
                className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-200 p-3 flex gap-2 flex-shrink-0 bg-white"
      >
        <input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={locked || sending}
          placeholder={locked ? "Chat đã bị khóa" : "Nhập tin nhắn..."}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!input.trim() || locked || sending}
          className="w-11 h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}