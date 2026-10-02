"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, Mail, Lock, Building2, User, Phone, MapPin, Briefcase,
  AlertCircle, UserCircle2, Store, FileText,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

type Loai = "ca_nhan" | "ho_kinh_doanh" | "doanh_nghiep";

export function RegisterEmployerForm() {
  const router = useRouter();
  const [loai, setLoai] = useState<Loai>("doanh_nghiep");
  const [form, setForm] = useState({
    ten_cong_ty: "", email: "", mat_khau: "",
    cccd: "", ma_so_thue: "", ma_so_hkd: "",
    nguoi_dai_dien: "", so_dien_thoai: "", dia_chi: "", linh_vuc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const config: Record<Loai, {
    tenLabel: string; tenPlaceholder: string;
    idLabel: string; idField: keyof typeof form; idPlaceholder: string;
  }> = {
    ca_nhan: {
      tenLabel: "Họ và tên *", tenPlaceholder: "Nguyễn Văn A",
      idLabel: "Số CCCD * (12 số)", idField: "cccd", idPlaceholder: "012345678901",
    },
    ho_kinh_doanh: {
      tenLabel: "Tên hộ kinh doanh *", tenPlaceholder: "Hộ KD Trà Sữa ABC",
      idLabel: "Mã số HKD *", idField: "ma_so_hkd", idPlaceholder: "12A3456789",
    },
    doanh_nghiep: {
      tenLabel: "Tên doanh nghiệp *", tenPlaceholder: "Công ty TNHH ABC",
      idLabel: "Mã số thuế *", idField: "ma_so_thue", idPlaceholder: "0123456789",
    },
  };

  const cur = config[loai];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.ten_cong_ty.trim()) return setError("Vui lòng nhập tên");
    if (!form.email.trim()) return setError("Vui lòng nhập email");
    if (form.mat_khau.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự");
    if (!form[cur.idField]) return setError(`Vui lòng nhập ${cur.idLabel.replace(" *", "").toLowerCase()}`);

    setLoading(true);
    try {
      const payload = {
        loai,
        ten_cong_ty: form.ten_cong_ty,
        email: form.email,
        mat_khau: form.mat_khau,
        cccd: loai === "ca_nhan" ? form.cccd : undefined,
        ma_so_thue: loai === "doanh_nghiep" ? form.ma_so_thue : undefined,
        ma_so_hkd: loai === "ho_kinh_doanh" ? form.ma_so_hkd : undefined,
        nguoi_dai_dien: form.nguoi_dai_dien,
        so_dien_thoai: form.so_dien_thoai,
        dia_chi: form.dia_chi,
        linh_vuc: form.linh_vuc,
      };
      const { data } = await api.post("/api/auth/employer/register", payload);
      if (!data.success) {
        setError(data.message || "Đăng ký thất bại");
        setLoading(false);
        return;
      }
      toast.success("Đăng ký thành công! Chuyển sang đăng nhập...");
      setTimeout(() => router.push("/employer/login"), 800);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản NTD</h1>
        <p className="text-slate-500">Đăng ký để bắt đầu đăng tin tuyển dụng</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Loại tài khoản *</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "ca_nhan" as Loai, label: "Cá nhân", icon: UserCircle2 },
              { value: "ho_kinh_doanh" as Loai, label: "Hộ KD", icon: Store },
              { value: "doanh_nghiep" as Loai, label: "Doanh nghiệp", icon: Building2 },
            ] as const).map((opt) => {
              const Icon = opt.icon;
              const active = loai === opt.value;
              return (
                <button key={opt.value} type="button" onClick={() => setLoai(opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${
                    active ? "border-orange-500 bg-orange-50 text-orange-700"
                           : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label={cur.tenLabel} icon={<Building2 className="w-4 h-4" />}>
          <input type="text" required value={form.ten_cong_ty}
            onChange={(e) => update("ten_cong_ty", e.target.value)}
            placeholder={cur.tenPlaceholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <Field label="Email *" icon={<Mail className="w-4 h-4" />}>
          <input type="email" required value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="hr@company.vn"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <Field label="Mật khẩu * (≥6 ký tự)" icon={<Lock className="w-4 h-4" />}>
          <input type="password" required minLength={6} value={form.mat_khau}
            onChange={(e) => update("mat_khau", e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <Field label={cur.idLabel} icon={<FileText className="w-4 h-4" />}>
          <input type="text" required value={form[cur.idField]}
            onChange={(e) => update(cur.idField, e.target.value)}
            placeholder={cur.idPlaceholder}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <Field label="Người đại diện" icon={<User className="w-4 h-4" />}>
          <input type="text" value={form.nguoi_dai_dien}
            onChange={(e) => update("nguoi_dai_dien", e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <Field label="Số điện thoại" icon={<Phone className="w-4 h-4" />}>
          <input type="tel" value={form.so_dien_thoai}
            onChange={(e) => update("so_dien_thoai", e.target.value)}
            placeholder="09xx xxx xxx"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <Field label="Địa chỉ" icon={<MapPin className="w-4 h-4" />}>
          <input type="text" value={form.dia_chi}
            onChange={(e) => update("dia_chi", e.target.value)}
            placeholder="Số 1, đường ABC, Hà Nội"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <Field label="Lĩnh vực hoạt động" icon={<Briefcase className="w-4 h-4" />}>
          <input type="text" value={form.linh_vuc}
            onChange={(e) => update("linh_vuc", e.target.value)}
            placeholder="VD: CNTT, F&B, Giáo dục"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition" />
        </Field>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition">
          {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý...</>) : "Đăng ký"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link href="/employer/login" className="font-semibold text-orange-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

function Field({ label, icon, children }: {
  label: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}