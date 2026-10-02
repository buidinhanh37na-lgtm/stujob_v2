"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";

type Role = "student" | "employer" | "admin";

interface LoginFormProps {
  role: Role;
  apiEndpoint: string;
  redirectTo: string;
  registerLink?: string;
  forgotLink: string;
  backLink: { href: string; label: string };
  accent: string;
  buttonClass: string;
}

export function LoginForm({
  role,
  apiEndpoint,
  redirectTo,
  registerLink,
  forgotLink,
  backLink,
  accent,
  buttonClass,
}: LoginFormProps) {
  const router = useRouter();
  const setStudent = useAuthStore((s) => s.setStudent);
  const setEmployer = useAuthStore((s) => s.setEmployer);
  const setAdmin = useAuthStore((s) => s.setAdmin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post(apiEndpoint, {
        email: email.trim(),
        mat_khau: password,
      });

      if (!data.success) {
        setError(data.message || "Đăng nhập thất bại");
        setLoading(false);
        return;
      }

      // Lưu user vào store
      if (role === "student" && data.sinh_vien) setStudent(data.sinh_vien);
      if (role === "employer" && data.nha_tuyen_dung)
        setEmployer(data.nha_tuyen_dung);
      if (role === "admin" && data.admin) setAdmin(data.admin);

      toast.success("Đăng nhập thành công!");
      setTimeout(() => router.push(redirectTo), 400);
        } catch (err: unknown) {
       const axiosErr = err as { response?: { data?: { message?: string } } };
       const msg =
        axiosErr.response?.data?.message || "Lỗi kết nối. Vui lòng thử lại.";
       setError(msg);
       setLoading(false);
}
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Chào mừng trở lại
        </h1>
        <p className="text-slate-500">
          Đăng nhập để tiếp tục sử dụng Stujob
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="password"
              type={showPass ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPass ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Forgot */}
        <div className="flex justify-end">
          <Link
            href={forgotLink}
            className={`text-sm font-medium ${accent} hover:underline`}
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${buttonClass}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>

      {/* Register link */}
      {registerLink && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href={registerLink}
            className={`font-semibold ${accent} hover:underline`}
          >
            Đăng ký ngay
          </Link>
        </p>
      )}

      {/* Back to home */}
      <div className="mt-8 text-center">
        <Link
          href={backLink.href}
          className="text-sm text-slate-400 hover:text-slate-700 transition"
        >
          ← {backLink.label}
        </Link>
      </div>
    </div>
  );
}