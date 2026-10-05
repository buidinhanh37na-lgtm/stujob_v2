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
        accent="text-indigo-600"
        buttonClass="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
      />
    </AuthLayout>
  );
}