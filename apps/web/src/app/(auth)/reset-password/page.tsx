import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Đặt lại mật khẩu — Stujob Sinh viên" };

export default function StudentResetPage() {
  return (
    <AuthLayout role="student">
      <Suspense fallback={<div className="text-slate-400">Đang tải...</div>}>
        <ResetPasswordForm
          role="student"
          loginLink="/login"
          accent="text-emerald-600"
          buttonClass="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
        />
      </Suspense>
    </AuthLayout>
  );
}