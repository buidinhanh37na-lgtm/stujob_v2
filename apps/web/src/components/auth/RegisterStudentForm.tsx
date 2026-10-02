"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Loader2, Mail, Lock, User, IdCard, Phone, School, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export function RegisterStudentForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    ma_sinh_vien: "",
    ho_ten: "",
    email: "",
    mat_khau: "",
    so_dien_thoai: "",
    truong: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.ma_sinh_vien.trim()) return setError("Vui lòng nhập MSSV");
    if (!form.ho_ten.trim()) return setError("Vui lòng nhập họ tên");
    if (!form.email.trim()) return setError("Vui lòng nhập email");
    if (form.mat_khau.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự");

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/student/register", form);
      if (!data.success) {
        setError(data.message || "Đăng ký thất bại");
        setLoading(false);
        return;
      }
      toast.success("Đăng ký thành công! Chuyển sang đăng nhập...");
      setTimeout(() => router.push("/login"), 800);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản</h1>
        <p className="text-slate-500">Đăng ký để bắt đầu tìm việc làm</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Mã sinh viên *" icon={<IdCard className="w-4 h-4" />}>
          <input type="text" required value={form.ma_sinh_vien}
            onChange={(e) => update("ma_sinh_vien", e.target.value)}
            placeholder="VD: SV001"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
        </Field>

        <Field label="Họ và tên *" icon={<User className="w-4 h-4" />}>
          <input type="text" required value={form.ho_ten}
            onChange={(e) => update("ho_ten", e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
        </Field>

        <Field label="Email *" icon={<Mail className="w-4 h-4" />}>
          <input type="email" required value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="email@example.com"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
        </Field>

        <Field label="Mật khẩu * (≥6 ký tự)" icon={<Lock className="w-4 h-4" />}>
          <input type={showPass ? "text" : "password"} required minLength={6}
            value={form.mat_khau}
            onChange={(e) => update("mat_khau", e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
          <button type="button" onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </Field>

        <Field label="Số điện thoại" icon={<Phone className="w-4 h-4" />}>
          <input type="tel" value={form.so_dien_thoai}
            onChange={(e) => update("so_dien_thoai", e.target.value)}
            placeholder="09xx xxx xxx"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
        </Field>

        <Field label="Trường" icon={<School className="w-4 h-4" />}>
          <input type="text" value={form.truong}
            onChange={(e) => update("truong", e.target.value)}
            placeholder="VD: ĐH Bách Khoa"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
        </Field>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition">
          {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Đang xử lý...</>) : "Đăng ký"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
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