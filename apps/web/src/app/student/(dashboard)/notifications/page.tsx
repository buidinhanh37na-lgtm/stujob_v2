"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Bell, CheckCheck, Trash2, Info, AlertTriangle,
  XCircle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtTimeAgo } from "@/lib/utils";

interface Noti {
  id: number;
  tieu_de: string;
  noi_dung: string | null;
  loai: string;
  da_doc: number;
  created_at: string;
}

const LOAI_ICON: Record<string, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  escrow: <CheckCircle2 className="w-5 h-5 text-indigo-500" />,
  invitation: <Bell className="w-5 h-5 text-purple-500" />,
};

export default function StudentNotificationsPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");

  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/student/notifications");
      if (data.success) {
        setItems(data.items || []);
        setUnread(data.unread || 0);
      }
    } catch {
      toast.error("Không tải được thông báo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  // Auto mark-all-read sau 1.5s khi user vào xem
  useEffect(() => {
    if (authLoading || loading || unread === 0) return;
    const t = setTimeout(async () => {
      try {
        await api.put("/api/student/notifications", {});
        setItems((prev) => prev.map((it) => ({ ...it, da_doc: 1 })));
        setUnread(0);
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [authLoading, loading, unread]);

  async function handleMarkAll() {
    try {
      const { data } = await api.put("/api/student/notifications", {});
      toast.success(data.message || "Đã đánh dấu");
      setItems((prev) => prev.map((it) => ({ ...it, da_doc: 1 })));
      setUnread(0);
    } catch {
      toast.error("Lỗi");
    }
  }

  async function handleMarkOne(id: number) {
    try {
      await api.put("/api/student/notifications", { id });
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, da_doc: 1 } : it))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      toast.error("Lỗi");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa thông báo này?")) return;
    try {
      const { data } = await api.delete(`/api/student/notifications?id=${id}`);
      toast.success(data.message || "Đã xóa");
      load();
    } catch {
      toast.error("Lỗi xóa");
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            Thông báo
            {unread > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {unread}
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Cập nhật về việc làm, lời mời và ứng tuyển của bạn
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
          >
            <CheckCheck className="w-4 h-4" />
            Đã đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Bell className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có thông báo</p>
          <p className="text-xs mt-1">
            Khi bạn ứng tuyển hoặc được mời làm việc, thông báo sẽ xuất hiện ở đây
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const isUnread = !it.da_doc;
            return (
              <div
                key={it.id}
                className={`flex gap-3 p-4 rounded-2xl border transition ${
                  isUnread
                    ? "bg-indigo-50/60 border-indigo-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {LOAI_ICON[it.loai] || LOAI_ICON.info}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="font-bold text-slate-800 text-sm">
                      {it.tieu_de}
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                    )}
                  </div>

                  {it.noi_dung && (
                    <div className="text-[13px] text-slate-600 mt-1 whitespace-pre-line">
                      {it.noi_dung}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 mt-1.5">
                    {fmtTimeAgo(it.created_at)}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkOne(it.id)}
                      title="Đánh dấu đã đọc"
                      className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-indigo-600 transition"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(it.id)}
                    title="Xóa"
                    className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}