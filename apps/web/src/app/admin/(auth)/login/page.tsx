import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Đăng nhập — Stujob Admin",
};

export default function AdminLoginPage() {
  return (
    <AuthLayout role="admin">
      <LoginForm
        role="admin"
        apiEndpoint="/api/auth/admin/login"
        redirectTo="/admin/dashboard"
        forgotLink="/admin/forgot-password"
        backLink={{ href: "/", label: "Về trang chủ" }}
        accent="text-purple-700"
        buttonClass="bg-purple-700 hover:bg-purple-800 shadow-lg shadow-purple-700/20"
      />
    </AuthLayout>
  );
}