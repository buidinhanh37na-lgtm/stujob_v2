import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Đặt lại mật khẩu — Stujob NTD" };

export default function EmployerResetPage() {
  return (
    <AuthLayout role="employer">
      <Suspense fallback={<div className="text-slate-400">Đang tải...</div>}>
        <ResetPasswordForm
          role="employer"
          loginLink="/employer/login"
          accent="text-sky-600"
          buttonClass="bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-600/20"
        />
      </Suspense>
    </AuthLayout>
  );
}