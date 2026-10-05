"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, Building2, User, Phone, MapPin, Briefcase, Globe,
  FileText, Save,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface EmployerInfo {
  id: number;
  ten_cong_ty: string;
  email: string;
  loai: string;
  nguoi_dai_dien: string | null;
  so_dien_thoai: string | null;
  dia_chi: string | null;
  linh_vuc: string | null;
  mo_ta: string | null;
  website: string | null;
  trang_thai_xac_thuc: string;
}

export default function EmployerProfilePage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<EmployerInfo | null>(null);

  const [form, setForm] = useState({
    ten_cong_ty: "",
    nguoi_dai_dien: "",
    so_dien_thoai: "",
    dia_chi: "",
    linh_vuc: "",
    mo_ta: "",
    website: "",
  });

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const { data } = await api.get("/api/employer/profile");
        if (data.success) {
          const n = data.nha_tuyen_dung;
          setInfo(n);
          setForm({
            ten_cong_ty: n.ten_cong_ty || "",
            nguoi_dai_dien: n.nguoi_dai_dien || "",
            so_dien_thoai: n.so_dien_thoai || "",
            dia_chi: n.dia_chi || "",
            linh_vuc: n.linh_vuc || "",
            mo_ta: n.mo_ta || "",
            website: n.website || "",
          });
        }
      } catch {
        setError("Không tải được hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await api.put("/api/employer/profile", form);
      if (data.success) {
        toast.success("Đã lưu hồ sơ");
      } else {
        setError(data.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
    } finally {
      setSaving(false);
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

  const verifyMap: Record<string, { label: string; cls: string }> = {
    chua: { label: "🔴 Chưa xác thực", cls: "bg-red-100 text-red-700" },
    dang_cho: { label: "🟡 Đang chờ", cls: "bg-amber-100 text-amber-700" },
    da_xac_thuc: { label: "✅ Đã xác thực", cls: "bg-emerald-100 text-emerald-700" },
  };
  const vs = verifyMap[info?.trang_thai_xac_thuc || "chua"];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Hồ sơ công ty</h2>
        <p className="text-slate-500 text-sm mt-1">
          Cập nhật thông tin để sinh viên hiểu rõ hơn về doanh nghiệp
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{info?.ten_cong_ty}</div>
              <div className="text-xs text-slate-500">
                {info?.email} • Loại:{" "}
                {info?.loai === "ca_nhan"
                  ? "Cá nhân"
                  : info?.loai === "ho_kinh_doanh"
                    ? "Hộ KD"
                    : "Doanh nghiệp"}
              </div>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${vs.cls}`}>
            {vs.label}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-600" />
          Thông tin cơ bản
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tên công ty *" icon={<Building2 className="w-4 h-4" />}>
            <input
              type="text"
              required
              value={form.ten_cong_ty}
              onChange={(e) => setForm({ ...form, ten_cong_ty: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </Field>

          <Field label="Email (không đổi)">
            <input
              type="email"
              value={info?.email || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm"
            />
          </Field>

          <Field label="Người đại diện" icon={<User className="w-4 h-4" />}>
            <input
              type="text"
              value={form.nguoi_dai_dien}
              onChange={(e) => setForm({ ...form, nguoi_dai_dien: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </Field>

          <Field label="Số điện thoại" icon={<Phone className="w-4 h-4" />}>
            <input
              type="tel"
              value={form.so_dien_thoai}
              onChange={(e) => setForm({ ...form, so_dien_thoai: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </Field>

          <Field label="Lĩnh vực" icon={<Briefcase className="w-4 h-4" />}>
            <input
              type="text"
              value={form.linh_vuc}
              onChange={(e) => setForm({ ...form, linh_vuc: e.target.value })}
              placeholder="VD: CNTT, F&B, Giáo dục"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </Field>

          <Field label="Website" icon={<Globe className="w-4 h-4" />}>
            <input
              type="text"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Địa chỉ" icon={<MapPin className="w-4 h-4" />}>
            <input
              type="text"
              value={form.dia_chi}
              onChange={(e) => setForm({ ...form, dia_chi: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-600" />
          Giới thiệu công ty
        </h3>
        <textarea
          value={form.mo_ta}
          onChange={(e) => setForm({ ...form, mo_ta: e.target.value })}
          rows={5}
          placeholder="Giới thiệu ngắn về công ty, văn hóa làm việc, môi trường..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-y"
        />
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 sticky bottom-4 bg-white/80 backdrop-blur p-3 rounded-2xl border border-slate-200">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lưu hồ sơ
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}