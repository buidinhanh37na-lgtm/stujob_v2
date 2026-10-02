import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Đặt lại mật khẩu — Stujob Admin" };

export default function AdminResetPage() {
  return (
    <AuthLayout role="admin">
      <Suspense fallback={<div className="text-slate-400">Đang tải...</div>}>
        <ResetPasswordForm
          role="admin"
          loginLink="/admin/login"
          accent="text-slate-700"
          buttonClass="bg-slate-900 hover:bg-black shadow-lg shadow-slate-900/20"
        />
      </Suspense>
    </AuthLayout>
  );
}