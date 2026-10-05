"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, Key, Trash2, Plus, Pencil, X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface Keyword {
  id: number;
  tu_khoa: string;
  muc_do_rui_ro: number;
  hanh_dong: string;
  loai: string;
  ghi_chu: string | null;
  created_at: string;
}

interface Stats {
  stats: {
    tong: number;
    chan: number;
    canh_bao: number;
    lua_dao: number;
    rui_ro: number;
    khong_phu_hop: number;
  };
}

type Loai = "lua_dao" | "rui_ro" | "khong_phu_hop";

export default function KeywordsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Keyword[]>([]);
  const [stats, setStats] = useState<Stats["stats"] | null>(null);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [form, setForm] = useState({
    tu_khoa: "",
    muc_do_rui_ro: "8",
    loai: "lua_dao" as Loai,
    hanh_dong: "chan",
    ghi_chu: "",
  });

  async function load() {
    try {
      const [list, s] = await Promise.all([
        api.get("/api/admin/moderation/keywords"),
        api.get("/api/admin/moderation/keywords-stats"),
      ]);
      if (list.data.success) setItems(list.data.items || []);
      if (s.data.success) setStats(s.data.stats);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  function resetForm() {
    setForm({
      tu_khoa: "",
      muc_do_rui_ro: "8",
      loai: "lua_dao",
      hanh_dong: "chan",
      ghi_chu: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  function openEdit(k: Keyword) {
    setEditing(k);
    setForm({
      tu_khoa: k.tu_khoa,
      muc_do_rui_ro: String(k.muc_do_rui_ro),
      loai: k.loai as Loai,
      hanh_dong: k.hanh_dong,
      ghi_chu: k.ghi_chu || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.tu_khoa.trim()) return toast.error("Nhập từ khóa");

    setBusyId(-1);
    try {
      const payload = {
        id: editing?.id,
        tu_khoa: form.tu_khoa.trim(),
        muc_do_rui_ro: Number(form.muc_do_rui_ro) || 5,
        loai: form.loai,
        hanh_dong: form.hanh_dong,
        ghi_chu: form.ghi_chu,
      };

      const url = editing
        ? "/api/admin/moderation/update-keyword"
        : "/api/admin/moderation/add-keyword";

      const { data } = await api.post(url, payload);
      if (data.success) {
        toast.success(data.message);
        resetForm();
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(k: Keyword) {
    if (!confirm(`Xóa từ khóa "${k.tu_khoa}"?`)) return;
    setBusyId(k.id);
    try {
      const { data } = await api.delete(
        `/api/admin/moderation/delete-keyword?id=${k.id}`
      );
      if (data.success) {
        toast.success("Đã xóa");
        load();
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
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

  const filtered = items.filter((k) =>
    search
      ? k.tu_khoa.toLowerCase().includes(search.toLowerCase()) ||
        (k.ghi_chu || "").toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Từ khóa chặn</h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý từ khóa để tự động phát hiện tin việc rủi ro
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Thêm từ khóa
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <StatBox label="Tổng" value={stats.tong} color="purple" />
          <StatBox label="Chặn hoàn toàn" value={stats.chan} color="red" />
          <StatBox label="Cảnh báo" value={stats.canh_bao} color="amber" />
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">
              {editing ? "✏️ Sửa từ khóa" : "➕ Thêm từ khóa mới"}
            </h3>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Từ khóa *
              </label>
              <input
                type="text"
                required
                value={form.tu_khoa}
                onChange={(e) => setForm({ ...form, tu_khoa: e.target.value })}
                placeholder="VD: đa cấp, forex, cá độ..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mức rủi ro (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.muc_do_rui_ro}
                  onChange={(e) =>
                    setForm({ ...form, muc_do_rui_ro: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loại
                </label>
                <select
                  value={form.loai}
                  onChange={(e) =>
                    setForm({ ...form, loai: e.target.value as Loai })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="lua_dao">🚨 Lừa đảo</option>
                  <option value="rui_ro">⚠️ Rủi ro</option>
                  <option value="khong_phu_hop">🚫 Không phù hợp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hành động
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hanh_dong: "chan" })}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    form.hanh_dong === "chan"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  🚫 Chặn hoàn toàn
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, hanh_dong: "canh_bao" })}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    form.hanh_dong === "canh_bao"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  ⚠️ Chỉ cảnh báo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={form.ghi_chu}
                onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-y"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busyId !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md disabled:opacity-60"
              >
                {busyId !== null ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editing ? "Lưu" : "Thêm"}
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm từ khóa..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Không có từ khóa nào</p>
          </div>
        ) : (
          filtered.map((k) => {
            const risk =
              k.muc_do_rui_ro >= 8
                ? "border-l-red-500"
                : k.muc_do_rui_ro >= 5
                  ? "border-l-amber-500"
                  : "border-l-slate-300";
            return (
              <div
                key={k.id}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 ${risk} p-3.5 flex items-start gap-3 hover:shadow-sm transition`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    <Key className="w-4 h-4 text-purple-600" />
                    {k.tu_khoa}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        k.hanh_dong === "chan"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {k.hanh_dong === "chan" ? "🚫 Chặn" : "⚠️ Cảnh báo"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        k.muc_do_rui_ro >= 8
                          ? "bg-red-100 text-red-700"
                          : k.muc_do_rui_ro >= 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {k.muc_do_rui_ro}/10
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {k.loai === "lua_dao"
                        ? "🚨 Lừa đảo"
                        : k.loai === "rui_ro"
                          ? "⚠️ Rủi ro"
                          : "🚫 Không phù hợp"}
                    </span>
                  </div>
                  {k.ghi_chu && (
                    <div className="text-xs text-slate-500 mt-2 italic">
                      📝 {k.ghi_chu}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(k)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                    title="Sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(k)}
                    disabled={busyId === k.id}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-60"
                    title="Xóa"
                  >
                    {busyId === k.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
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
  color: "purple" | "red" | "amber";
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    red: "bg-red-50 border-red-200 text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}