import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Quên mật khẩu — Stujob NTD" };

export default function EmployerForgotPage() {
  return (
    <AuthLayout role="employer">
      <ForgotPasswordForm
        role="employer"
        loginLink="/employer/login"
        accent="text-orange-600"
        buttonClass="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
      />
    </AuthLayout>
  );
}