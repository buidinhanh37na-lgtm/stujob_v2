import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Quên mật khẩu — Stujob NTD" };

export default function EmployerForgotPage() {
  return (
    <AuthLayout role="employer">
      <ForgotPasswordForm
        role="employer"
        loginLink="/employer/login"
        accent="text-sky-600"
        buttonClass="bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-600/20"
      />
    </AuthLayout>
  );
}