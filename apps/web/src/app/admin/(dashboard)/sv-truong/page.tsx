"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, School, Plus, Trash2, Search, Upload, Download, X,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDate } from "@/lib/utils";

interface SvTruong {
  id: number;
  ma_sinh_vien: string;
  ho_ten: string;
  ngay_sinh: string | null;
  khoa: string | null;
  chuyen_nganh: string | null;
  nam_hoc: number | null;
  lop: string | null;
  trang_thai: string;
  da_dang_ky: boolean;
  created_at: string;
}

interface Stats {
  tong: number;
  dang_hoc: number;
  tot_nghiep: number;
  bi_dinh_chi: number;
}

type Filter = "all" | "dang_hoc" | "tot_nghiep" | "bi_dinh_chi";

export default function SvTruongPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SvTruong[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    ma_sinh_vien: "",
    ho_ten: "",
    ngay_sinh: "",
    khoa: "",
    chuyen_nganh: "",
    nam_hoc: "",
    lop: "",
    trang_thai: "dang_hoc",
  });

  async function loadStats() {
    try {
      const { data } = await api.get("/api/admin/sv-truong/stats");
      if (data.success) setStats(data);
    } catch {}
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/admin/sv-truong?q=${encodeURIComponent(search)}&status=${filter}`
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
  }, [authLoading, filter]);

  function resetForm() {
    setForm({
      ma_sinh_vien: "",
      ho_ten: "",
      ngay_sinh: "",
      khoa: "",
      chuyen_nganh: "",
      nam_hoc: "",
      lop: "",
      trang_thai: "dang_hoc",
    });
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.ma_sinh_vien.trim()) return toast.error("Nhập MSSV");
    if (!form.ho_ten.trim()) return toast.error("Nhập họ tên");

    setSubmitting(true);
    try {
      const payload = {
        ma_sinh_vien: form.ma_sinh_vien,
        ho_ten: form.ho_ten,
        ngay_sinh: form.ngay_sinh || null,
        khoa: form.khoa,
        chuyen_nganh: form.chuyen_nganh,
        nam_hoc: form.nam_hoc ? Number(form.nam_hoc) : null,
        lop: form.lop,
        trang_thai: form.trang_thai,
      };
      const { data } = await api.post("/api/admin/sv-truong", payload);
      if (data.success) {
        toast.success(data.message);
        resetForm();
        load();
        loadStats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sv: SvTruong) {
    if (!confirm(`Xóa SV "${sv.ho_ten}" (${sv.ma_sinh_vien})?`)) return;
    setBusyId(sv.id);
    try {
      const { data } = await api.delete(`/api/admin/sv-truong/${sv.id}`);
      if (data.success) {
        toast.success("Đã xóa");
        load();
        loadStats();
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const fd = new FormData();
      fd.append("file", file);

      try {
        const { data } = await api.post("/api/admin/sv-truong/import", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.success) {
          toast.success(data.message);
          load();
          loadStats();
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Import lỗi");
      }
    };
    input.click();
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    dang_hoc: { label: "🎓 Đang học", cls: "bg-emerald-100 text-emerald-700" },
    tot_nghiep: { label: "✅ Tốt nghiệp", cls: "bg-blue-100 text-blue-700" },
    bi_dinh_chi: { label: "🚫 Đình chỉ", cls: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">SV nhà trường</h2>
          <p className="text-slate-500 text-sm mt-1">
            Database sinh viên dùng để đối chiếu khi xác thực
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="http://localhost:4000/api/admin/sv-truong/template"
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            <Download className="w-4 h-4" />
            File mẫu
          </a>
          <button
            onClick={handleImport}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm SV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Tổng" value={stats.tong} color="purple" />
          <StatBox label="Đang học" value={stats.dang_hoc} color="emerald" />
          <StatBox label="Tốt nghiệp" value={stats.tot_nghiep} color="blue" />
          <StatBox label="Đình chỉ" value={stats.bi_dinh_chi} color="red" />
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">➕ Thêm sinh viên nhà trường</h3>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <Field label="MSSV *" value={form.ma_sinh_vien} onChange={(v) => setForm({ ...form, ma_sinh_vien: v })} placeholder="VD: SV001" />
            <Field label="Họ tên *" value={form.ho_ten} onChange={(v) => setForm({ ...form, ho_ten: v })} placeholder="Nguyễn Văn A" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ngày sinh</label>
              <input
                type="date"
                value={form.ngay_sinh}
                onChange={(e) => setForm({ ...form, ngay_sinh: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <Field label="Khoa" value={form.khoa} onChange={(v) => setForm({ ...form, khoa: v })} placeholder="VD: Công nghệ thông tin" />
            <Field label="Chuyên ngành" value={form.chuyen_nganh} onChange={(v) => setForm({ ...form, chuyen_nganh: v })} placeholder="VD: Kỹ thuật phần mềm" />
            <Field label="Năm học" value={form.nam_hoc} onChange={(v) => setForm({ ...form, nam_hoc: v })} placeholder="1-7" type="number" />
            <Field label="Lớp" value={form.lop} onChange={(v) => setForm({ ...form, lop: v })} placeholder="VD: KTPM01" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
              <select
                value={form.trang_thai}
                onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="dang_hoc">Đang học</option>
                <option value="tot_nghiep">Tốt nghiệp</option>
                <option value="bi_dinh_chi">Bị đình chỉ</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Thêm
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

      {/* Filter + Search */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { v: "all" as Filter, label: "Tất cả" },
          { v: "dang_hoc" as Filter, label: "🎓 Đang học" },
          { v: "tot_nghiep" as Filter, label: "✅ Tốt nghiệp" },
          { v: "bi_dinh_chi" as Filter, label: "🚫 Đình chỉ" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
              filter === f.v
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1 min-w-[200px] relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Tìm MSSV, tên, ngành..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <School className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có sinh viên nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">MSSV</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Họ tên</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Khoa / Ngành</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">Năm / Lớp</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((sv) => {
                  const st = STATUS_MAP[sv.trang_thai] || STATUS_MAP.dang_hoc;
                  return (
                    <tr key={sv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{sv.ma_sinh_vien}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold flex items-center gap-1.5">
                          {sv.ho_ten}
                          {sv.da_dang_ky && (
                            <span title="Đã đăng ký app" className="text-emerald-500">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {sv.ngay_sinh ? fmtDate(sv.ngay_sinh) : ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs hidden md:table-cell">
                        <div>{sv.khoa || "—"}</div>
                        <div className="text-slate-400">{sv.chuyen_nganh || ""}</div>
                      </td>
                      <td className="py-3 px-4 text-xs hidden lg:table-cell">
                        <div>Năm {sv.nam_hoc || "—"}</div>
                        <div className="text-slate-400">{sv.lop || ""}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(sv)}
                          disabled={busyId === sv.id}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-60"
                          title="Xóa"
                        >
                          {busyId === sv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
  value: number;
  color: "purple" | "emerald" | "blue" | "red";
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
      />
    </div>
  );
}