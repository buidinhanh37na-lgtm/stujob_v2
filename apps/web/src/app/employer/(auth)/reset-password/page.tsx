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
          accent="text-orange-600"
          buttonClass="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
        />
      </Suspense>
    </AuthLayout>
  );
}