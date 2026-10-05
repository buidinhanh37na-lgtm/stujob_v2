"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Bell, Send, CheckCheck, Trash2, X, Info,
  AlertTriangle, XCircle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { fmtTimeAgo } from "@/lib/utils";

interface Noti {
  id: number;
  admin_id: number | null;
  tieu_de: string;
  noi_dung: string | null;
  loai: string;
  da_doc: number;
  created_at: string;
}

interface AdminOpt {
  id: number;
  ho_ten: string;
  vai_tro: string;
}

const LOAI_ICON: Record<string, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
};

export default function AdminNotificationsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");
  const { refresh: refreshBadge } = useAdminNotifications();

  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminOpt[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/notifications");
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

  // Tự đánh dấu đã đọc sau 1.5s khi user đã xem trang
  useEffect(() => {
    if (authLoading || loading || unread === 0) return;
    const t = setTimeout(async () => {
      try {
        await api.put("/api/admin/notifications", {});
        refreshBadge();
        setItems((prev) => prev.map((it) => ({ ...it, da_doc: 1 })));
        setUnread(0);
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [authLoading, loading, unread, refreshBadge]);

  async function handleMarkOne(id: number) {
    try {
      await api.put("/api/admin/notifications", { id });
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, da_doc: 1 } : it))
      );
      refreshBadge();
    } catch {
      toast.error("Lỗi");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa thông báo này?")) return;
    try {
      const { data } = await api.delete(`/api/admin/notifications?id=${id}`);
      toast.success(data.message || "Đã xóa");
      load();
      refreshBadge();
    } catch {
      toast.error("Lỗi xóa");
    }
  }

  async function openSendModal() {
    setSendOpen(true);
    if (admins.length === 0) {
      try {
        const { data } = await api.get("/api/admin/admins/list");
        if (data.success) setAdmins(data.items || []);
      } catch {}
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
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-500" />
            Thông báo
            {unread > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {unread}
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Thông báo hệ thống và từ quản trị viên khác
          </p>
        </div>
        <button
          onClick={openSendModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold shadow-sm transition"
        >
          <Send className="w-4 h-4" />
          Gửi thông báo
        </button>
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
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const isUnread = !it.da_doc;
            const isGlobal = it.admin_id === null;
            return (
              <div
                key={it.id}
                className={`flex gap-3 p-4 rounded-2xl border transition ${
                  isUnread
                    ? "bg-purple-50/60 border-purple-200"
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
                    {isGlobal && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        Global
                      </span>
                    )}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
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
                      className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-purple-600 transition"
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

      {sendOpen && (
        <SendModal
          admins={admins}
          onClose={() => setSendOpen(false)}
          onSent={() => {
            setSendOpen(false);
            load();
            refreshBadge();
          }}
        />
      )}
    </div>
  );
}

function SendModal({
  admins,
  onClose,
  onSent,
}: {
  admins: AdminOpt[];
  onClose: () => void;
  onSent: () => void;
}) {
  const [tieuDe, setTieuDe] = useState("");
  const [noiDung, setNoiDung] = useState("");
  const [loai, setLoai] = useState("info");
  const [targetId, setTargetId] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!tieuDe.trim()) return toast.error("Nhập tiêu đề");

    setBusy(true);
    try {
      const { data } = await api.post("/api/admin/notifications", {
        tieu_de: tieuDe,
        noi_dung: noiDung,
        loai,
        admin_id: targetId ? Number(targetId) : null,
      });
      toast.success(data.message || "Đã gửi");
      onSent();
    } catch (e: unknown) {
  const msg =
    (e as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || "Lỗi gửi";
  toast.error(msg);
} finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="border-b border-slate-200 px-5 py-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-500" />
            Gửi thông báo
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Gửi đến">
            <select
              value={targetId}
              onChange={(e) =>
                setTargetId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">🌐 Tất cả admin (global)</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ho_ten} ({a.vai_tro})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Loại">
            <select
              value={loai}
              onChange={(e) => setLoai(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="info">ℹ️ Thông tin</option>
              <option value="warning">⚠️ Cảnh báo</option>
              <option value="error">❌ Lỗi</option>
              <option value="success">✅ Thành công</option>
            </select>
          </Field>

          <Field label="Tiêu đề *">
            <input
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
              placeholder="VD: Bảo trì hệ thống 22h tối nay"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </Field>

          <Field label="Nội dung">
            <textarea
              value={noiDung}
              onChange={(e) => setNoiDung(e.target.value)}
              rows={4}
              placeholder="Chi tiết thông báo..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
            />
          </Field>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold"
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {busy ? "Đang gửi..." : "Gửi"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}