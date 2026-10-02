"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Send, Clock, CheckCircle, XCircle, Trophy,
  Trash2, Building2, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDateTime } from "@/lib/utils";

interface Application {
  id: number;
  viec_lam_id: number;
  loai: string;
  loi_nhan: string | null;
  trang_thai: string;
  created_at: string;
  tieu_de: string;
  luong_min: number;
  luong_max: number;
  loai_cong_viec: string;
  ten_cong_ty: string;
  logo: string | null;
}

const STATUS_MAP: Record<
  string,
  { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }
> = {
  cho_duyet: { label: "⏳ Chờ duyệt", cls: "bg-amber-100 text-amber-800", icon: Clock },
  da_chap_nhan: { label: "✅ Đã nhận", cls: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  tu_choi: { label: "❌ Từ chối", cls: "bg-red-100 text-red-700", icon: XCircle },
  hoan_thanh: { label: "🎉 Hoàn thành", cls: "bg-purple-100 text-purple-800", icon: Trophy },
};

type Filter = "all" | "cho_duyet" | "da_chap_nhan" | "tu_choi" | "hoan_thanh";

export default function ApplicationsPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  async function load() {
    try {
      const { data } = await api.get("/api/student/applications");
      if (data.success) setItems(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading]);

  async function handleCancel(id: number) {
    if (!confirm("Hủy ứng tuyển này?")) return;
    try {
      const { data } = await api.delete(`/api/student/applications/${id}`);
      if (data.success) {
        toast.success("Đã hủy");
        load();
      } else {
        toast.error(data.message);
      }
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

  const counts = {
    all: items.length,
    cho_duyet: items.filter((i) => i.trang_thai === "cho_duyet").length,
    da_chap_nhan: items.filter((i) => i.trang_thai === "da_chap_nhan").length,
    tu_choi: items.filter((i) => i.trang_thai === "tu_choi").length,
    hoan_thanh: items.filter((i) => i.trang_thai === "hoan_thanh").length,
  };

  const filtered =
    filter === "all" ? items : items.filter((i) => i.trang_thai === filter);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Đã ứng tuyển</h2>
        <p className="text-slate-500 text-sm mt-1">
          Theo dõi trạng thái các đơn ứng tuyển của bạn
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {([
          { value: "all" as Filter, label: `Tất cả (${counts.all})` },
          { value: "cho_duyet" as Filter, label: `⏳ Chờ duyệt (${counts.cho_duyet})` },
          { value: "da_chap_nhan" as Filter, label: `✅ Đã nhận (${counts.da_chap_nhan})` },
          { value: "hoan_thanh" as Filter, label: `🎉 Hoàn thành (${counts.hoan_thanh})` },
          { value: "tu_choi" as Filter, label: `❌ Từ chối (${counts.tu_choi})` },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
              filter === f.value
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Send className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {filter === "all"
              ? "Chưa ứng tuyển việc làm nào"
              : "Không có đơn nào ở mục này"}
          </p>
          {filter === "all" && (
            <Link
              href="/student/jobs"
              className="inline-block mt-3 text-sm text-emerald-600 hover:underline font-medium"
            >
              Khám phá việc làm →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((it) => {
            const st = STATUS_MAP[it.trang_thai] || STATUS_MAP.cho_duyet;
            const Icon = st.icon;
            const initial = (it.ten_cong_ty || "?").charAt(0).toUpperCase();
            const salary =
              it.luong_min === it.luong_max
                ? fmtMoney(it.luong_min)
                : `${fmtMoney(it.luong_min)} - ${fmtMoney(it.luong_max)}`;

            return (
              <div
                key={it.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {it.tieu_de}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="truncate">{it.ten_cong_ty}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${st.cls}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {st.label.replace(/^[^\s]+\s/, "")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <Wallet className="w-3.5 h-3.5" />
                        {salary}
                      </span>
                      <span>{fmtDateTime(it.created_at)}</span>
                      {it.loai === "loi_moi" && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium">
                          📬 Lời mời
                        </span>
                      )}
                    </div>

                    {it.loi_nhan && (
                      <div className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        💬 {it.loi_nhan}
                      </div>
                    )}

                    {it.trang_thai === "cho_duyet" && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => handleCancel(it.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hủy ứng tuyển
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}