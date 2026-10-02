"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Loader2, Mail, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

type Role = "student" | "employer" | "admin";

interface Props {
  role: Role;
  loginLink: string;
  accent: string;
  buttonClass: string;
}

export function ForgotPasswordForm({ role, loginLink, accent, buttonClass }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResetLink(null);

    if (!email.trim()) return setError("Vui lòng nhập email");

    setLoading(true);
    try {
      const { data } = await api.post(`/api/auth/${role}/forgot`, { email });
      if (!data.success) {
        setError(data.message || "Lỗi");
        setLoading(false);
        return;
      }
      toast.success("Đã tạo yêu cầu đặt lại mật khẩu");
      if (data.reset_link) {
  // Backend luôn trả `/reset-password` → cần đổi path theo role
  const prefix = role === "student" ? "" : `/${role === "employer" ? "employer" : "admin"}`;
  const fixedLink = data.reset_link.replace(
    /^\/reset-password/,
    `${prefix}/reset-password`
  );
  setResetLink(fixedLink);
}
      else setError(data.message);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Quên mật khẩu</h1>
        <p className="text-slate-500">Nhập email để nhận link đặt lại mật khẩu</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {resetLink ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 mb-5">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-800 mb-1">
                Yêu cầu đã được tạo
              </div>
              <div className="text-sm text-emerald-700">
                Trong môi trường production, link sẽ được gửi qua email. Ở chế độ
                demo, click vào link bên dưới để tiếp tục.
              </div>
            </div>
          </div>
          <Link
            href={resetLink}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition ${buttonClass}`}
          >
            <ExternalLink className="w-4 h-4" />
            Đặt lại mật khẩu ngay
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email tài khoản
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${buttonClass}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </button>
        </form>
      )}

      <div className="mt-8 text-center">
        <Link
          href={loginLink}
          className={`text-sm font-medium ${accent} hover:underline`}
        >
          ← Về trang đăng nhập
        </Link>
      </div>
    </div>
  );
}