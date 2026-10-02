import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Đăng nhập — Stujob Sinh viên",
};

export default function StudentLoginPage() {
  return (
    <AuthLayout role="student">
      <LoginForm
        role="student"
        apiEndpoint="/api/auth/student/login"
        redirectTo="/student/dashboard"
        registerLink="/register"
        forgotLink="/forgot-password"
        backLink={{ href: "/", label: "Về trang chủ" }}
        accent="text-emerald-600"
        buttonClass="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
      />
    </AuthLayout>
  );
}