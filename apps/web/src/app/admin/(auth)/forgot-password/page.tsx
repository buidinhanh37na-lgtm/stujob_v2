import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Quên mật khẩu — Stujob Admin" };

export default function AdminForgotPage() {
  return (
    <AuthLayout role="admin">
      <ForgotPasswordForm
        role="admin"
        loginLink="/admin/login"
        accent="text-slate-700"
        buttonClass="bg-slate-900 hover:bg-black shadow-lg shadow-slate-900/20"
      />
    </AuthLayout>
  );
}