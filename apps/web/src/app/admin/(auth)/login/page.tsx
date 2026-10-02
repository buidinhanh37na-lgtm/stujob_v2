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
        accent="text-slate-700"
        buttonClass="bg-slate-900 hover:bg-black shadow-lg shadow-slate-900/20"
      />
    </AuthLayout>
  );
}