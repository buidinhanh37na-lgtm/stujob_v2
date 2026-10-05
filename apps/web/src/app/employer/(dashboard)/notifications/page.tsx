"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Bell, CheckCircle2, Wallet, Shield, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDateTime } from "@/lib/utils";

interface Notification {
  id: number;
  tieu_de: string;
  noi_dung: string | null;
  loai: string;
  da_doc: number;
  ngay_tao: string;
}

export default function EmployerNotificationsPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    try {
      const { data } = await api.get("/api/employer/notifications");
      if (data.success) setItems(data.items || []);
    } catch {
      toast.error("Không tải được thông báo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function markAllRead() {
    try {
      await api.put("/api/employer/notifications");
      toast.success("Đã đánh dấu tất cả đã đọc");
      load();
    } catch {
      toast.error("Lỗi");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  const unread = items.filter((i) => !i.da_doc).length;

  function getIcon(loai: string) {
    if (loai === "success") return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (loai === "wallet") return <Wallet className="w-5 h-5 text-amber-600" />;
    if (loai === "escrow") return <Shield className="w-5 h-5 text-sky-600" />;
    if (loai === "warning") return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <Bell className="w-5 h-5 text-slate-500" />;
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Thông báo</h2>
          <p className="text-slate-500 text-sm mt-1">
            {unread > 0 ? `Bạn có ${unread} thông báo chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Bell className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition ${
                !n.da_doc
                  ? "bg-sky-50 border-sky-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                {getIcon(n.loai)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="font-semibold text-sm text-slate-900 flex-1">
                    {n.tieu_de}
                  </div>
                  {!n.da_doc && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                {n.noi_dung && (
                  <div className="text-sm text-slate-600 mt-0.5 whitespace-pre-line">
                    {n.noi_dung}
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-2">
                  {fmtDateTime(n.ngay_tao)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}