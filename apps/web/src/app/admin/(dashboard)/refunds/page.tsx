"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, RotateCcw, Search, Plus, X, User, Building2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDateTime } from "@/lib/utils";

interface Refund {
  id: number;
  so_tien: number;
  ly_do: string | null;
  nguoi_nhan_loai: string;
  nguoi_nhan_id: number;
  nguoi_nhan_ten: string;
  khieu_nai_id: number | null;
  ten_khieu_nai: string;
  admin_name: string;
  created_at: string;
}

interface Stats {
  tong_hoan: number;
  cho_sv: number;
  cho_ntd: number;
  so_lan: number;
  escrow_dang_giu: number;
}

export default function AdminRefundsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Refund[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nguoi_nhan_loai: "sinh_vien",
    nguoi_nhan_id: "",
    so_tien: "",
    ly_do: "",
  });

  async function loadStats() {
    try {
      const { data } = await api.get("/api/admin/refunds/stats");
      if (data.success) setStats(data);
    } catch {}
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/admin/refunds?q=${encodeURIComponent(search)}`
      );
      if (data.success) setItems(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      load();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  function resetForm() {
    setForm({
      nguoi_nhan_loai: "sinh_vien",
      nguoi_nhan_id: "",
      so_tien: "",
      ly_do: "",
    });
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nguoi_nhan_id) return toast.error("Nhập ID người nhận");
    if (!form.so_tien || Number(form.so_tien) <= 0)
      return toast.error("Số tiền phải > 0");
    if (!form.ly_do.trim()) return toast.error("Nhập lý do");

    setSubmitting(true);
    try {
      const { data } = await api.post("/api/admin/refunds", {
        nguoi_nhan_loai: form.nguoi_nhan_loai,
        nguoi_nhan_id: Number(form.nguoi_nhan_id),
        so_tien: Number(form.so_tien),
        ly_do: form.ly_do,
      });
      if (data.success) {
        toast.success(data.message);
        resetForm();
        load();
        loadStats();
      } else toast.error(data.message);
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
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
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hoàn tiền</h2>
          <p className="text-slate-500 text-sm mt-1">
            Lịch sử hoàn tiền và tạo hoàn tiền thủ công
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Tạo hoàn tiền
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Tổng hoàn" value={fmtMoney(stats.tong_hoan)} color="purple" />
          <StatBox label="Cho SV" value={fmtMoney(stats.cho_sv)} color="blue" />
          <StatBox label="Cho NTD" value={fmtMoney(stats.cho_ntd)} color="emerald" />
          <StatBox label="Escrow đang giữ" value={fmtMoney(stats.escrow_dang_giu)} color="amber" />
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">➕ Tạo hoàn tiền thủ công</h3>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Người nhận *
              </label>
              <select
                value={form.nguoi_nhan_loai}
                onChange={(e) =>
                  setForm({ ...form, nguoi_nhan_loai: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="sinh_vien">🎓 Sinh viên</option>
                <option value="nha_tuyen_dung">🏢 Nhà tuyển dụng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ID người nhận *
              </label>
              <input
                type="number"
                required
                value={form.nguoi_nhan_id}
                onChange={(e) =>
                  setForm({ ...form, nguoi_nhan_id: e.target.value })
                }
                placeholder="VD: 1"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số tiền (VNĐ) *
              </label>
              <input
                type="number"
                required
                min={1000}
                step={1000}
                value={form.so_tien}
                onChange={(e) => setForm({ ...form, so_tien: e.target.value })}
                placeholder="VD: 100000"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lý do *
              </label>
              <textarea
                required
                value={form.ly_do}
                onChange={(e) => setForm({ ...form, ly_do: e.target.value })}
                rows={2}
                placeholder="VD: Hoàn tiền do khiếu nại, bồi thường..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-y"
              />
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Tạo hoàn tiền
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Tìm theo lý do..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RotateCcw className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có lịch sử hoàn tiền</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Ngày</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Người nhận</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Loại</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Số tiền</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Lý do</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Admin</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {fmtDateTime(r.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold flex items-center gap-1.5">
                        {r.nguoi_nhan_loai === "sinh_vien" ? (
                          <User className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-sky-500" />
                        )}
                        {r.nguoi_nhan_ten}
                      </div>
                      {r.ten_khieu_nai && (
                        <div className="text-[11px] text-slate-400">
                          📋 {r.ten_khieu_nai}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.nguoi_nhan_loai === "sinh_vien"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {r.nguoi_nhan_loai === "sinh_vien" ? "🎓 SV" : "🏢 NTD"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {fmtMoney(r.so_tien)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 hidden md:table-cell max-w-[250px] truncate">
                      {r.ly_do || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 hidden lg:table-cell">
                      {r.admin_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "purple" | "blue" | "emerald" | "amber";
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-xl font-bold mt-1 truncate">{value}</div>
    </div>
  );
}