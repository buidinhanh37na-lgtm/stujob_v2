import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Quên mật khẩu — Stujob Sinh viên" };

export default function StudentForgotPage() {
  return (
    <AuthLayout role="student">
      <ForgotPasswordForm
        role="student"
        loginLink="/login"
        accent="text-emerald-600"
        buttonClass="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
      />
    </AuthLayout>
  );
}