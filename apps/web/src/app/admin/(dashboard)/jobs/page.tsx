"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Briefcase,
  Search,
  X,
  XCircle,
  Trash2,
  Building2,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useConfirm } from "@/components/ui";
import { fmtMoney, fmtDate } from "@/lib/utils";

interface JobItem {
  id: number;
  tieu_de: string;
  mo_ta: string | null;
  ky_nang_can: string | null;
  luong_min: number;
  luong_max: number;
  don_vi_luong: string;
  loai_cong_viec: string;
  trang_thai: "dang_mo" | "da_dong";
  created_at: string;
  ntd_id: number;
  ten_cong_ty: string;
  logo: string | null;
  so_ung_tuyen: number;
  kd_hanh_dong: string | null;
  diem_rui_ro: number | null;
}

interface Stats {
  tong: number;
  dang_mo: number;
  da_dong: number;
  tong_ung_tuyen: number;
}

type Filter = "all" | "dang_mo" | "da_dong";

const TYPE_LABEL: Record<string, string> = {
  remote: "🌐 Online",
  onsite: "🏢 Offline",
  hybrid: "🔀 Kết hợp",
};

export default function AdminJobsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");
  const confirm = useConfirm();

  const [items, setItems] = useState<JobItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("q", search.trim());
      params.set("page", String(page));

      const { data } = await api.get(`/api/admin/jobs?${params.toString()}`);
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch {
      toast.error("Không tải được danh sách tin việc");
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/api/admin/jobs/stats");
      if (data.success) setStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading) {
      load();
      loadStats();
    }
  }, [authLoading, load, loadStats]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  async function handleForceClose(id: number) {
    const reason = await confirm({
      title: "Đóng tin việc",
      message:
        "Tin việc sẽ chuyển sang trạng thái Đã đóng và NTD sẽ nhận thông báo. Vui lòng nhập lý do.",
      variant: "warning",
      confirmLabel: "Đóng tin",
      withReason: true,
      reasonLabel: "Lý do đóng",
      reasonPlaceholder: "VD: Vi phạm chính sách nội dung...",
      reasonRequired: true,
    });
    if (!reason) return;

    try {
      const { data } = await api.post("/api/admin/jobs/force-close", {
        id,
        ly_do: reason,
      });
      toast.success(data.message || "Đã đóng tin");
      load();
      loadStats();
    } catch {
      toast.error("Lỗi đóng tin");
    }
  }

  async function handleDelete(id: number, title: string) {
    const confirmed = await confirm({
      title: "Xóa vĩnh viễn tin việc?",
      message: `Tin "${title}" và toàn bộ ứng tuyển liên quan sẽ bị xóa. Hành động này không thể hoàn tác.`,
      variant: "danger",
      confirmLabel: "Xóa vĩnh viễn",
    });
    if (confirmed === null) return;

    try {
      const { data } = await api.delete(`/api/admin/jobs?id=${id}`);
      toast.success(data.message || "Đã xóa");
      load();
      loadStats();
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
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-purple-500" />
          Quản lý tin việc
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Xem, đóng hoặc xóa tin tuyển dụng trên sàn
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatBox label="Tổng tin" value={stats.tong} color="purple" />
          <StatBox label="Đang mở" value={stats.dang_mo} color="emerald" />
          <StatBox label="Đã đóng" value={stats.da_dong} color="red" />
          <StatBox
            label="Tổng ứng tuyển"
            value={stats.tong_ung_tuyen}
            color="blue"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-2xl border border-slate-200">
        {[
          { v: "all" as Filter, label: "Tất cả" },
          { v: "dang_mo" as Filter, label: "🟢 Đang mở" },
          { v: "da_dong" as Filter, label: "🔴 Đã đóng" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              filter === f.v
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-purple-300"
            }`}
          >
            {f.label}
          </button>
        ))}

        <div className="flex-1 min-w-[220px] relative ml-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tiêu đề, NTD..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Không có tin việc nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wide">
                    <th className="text-left p-3 font-bold">Tin việc</th>
                    <th className="text-left p-3 font-bold">NTD</th>
                    <th className="text-left p-3 font-bold">Lương</th>
                    <th className="text-center p-3 font-bold">Ứng tuyển</th>
                    <th className="text-center p-3 font-bold">Trạng thái</th>
                    <th className="text-left p-3 font-bold">Ngày tạo</th>
                    <th className="text-right p-3 font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((j) => (
                    <tr
                      key={j.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 max-w-[280px]">
                        <div className="font-semibold text-slate-800 truncate">
                          {j.tieu_de}
                        </div>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {TYPE_LABEL[j.loai_cong_viec] || j.loai_cong_viec}
                          </span>
                          {j.diem_rui_ro !== null && j.diem_rui_ro >= 5 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-semibold">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {j.diem_rui_ro}/10
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="text-slate-700 text-[13px] truncate max-w-[140px]">
                            {j.ten_cong_ty}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-emerald-700 font-semibold text-[13px]">
                          {j.luong_min === j.luong_max
                            ? fmtMoney(j.luong_min)
                            : `${fmtMoney(j.luong_min)} - ${fmtMoney(
                                j.luong_max
                              )}`}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold">
                          <Users className="w-3 h-3" />
                          {j.so_ung_tuyen}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            j.trang_thai === "dang_mo"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {j.trang_thai === "dang_mo"
                            ? "🟢 Đang mở"
                            : "🔴 Đã đóng"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap text-xs">
                        {fmtDate(j.created_at)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {j.trang_thai === "dang_mo" && (
                          <button
                            onClick={() => handleForceClose(j.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-semibold mr-1.5"
                          >
                            <XCircle className="w-3 h-3" />
                            Đóng
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(j.id, j.tieu_de)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  Tổng <b className="text-slate-700">{total}</b> tin
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold disabled:opacity-40"
                  >
                    ← Trước
                  </button>
                  <span className="px-3 text-sm font-semibold text-slate-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold disabled:opacity-40"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "purple" | "blue" | "emerald" | "red";
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">
        {value.toLocaleString("vi-VN")}
      </div>
    </div>
  );
}