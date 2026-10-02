import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Đăng nhập — Stujob Nhà tuyển dụng",
};

export default function EmployerLoginPage() {
  return (
    <AuthLayout role="employer">
      <LoginForm
        role="employer"
        apiEndpoint="/api/auth/employer/login"
        redirectTo="/employer/dashboard"
        registerLink="/employer/register"
        forgotLink="/employer/forgot-password"
        backLink={{ href: "/", label: "Về trang chủ" }}
        accent="text-orange-600"
        buttonClass="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
      />
    </AuthLayout>
  );
}