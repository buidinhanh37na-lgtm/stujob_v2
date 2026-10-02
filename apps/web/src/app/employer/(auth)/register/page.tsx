import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterEmployerForm } from "@/components/auth/RegisterEmployerForm";

export const metadata = { title: "Đăng ký — Stujob Nhà tuyển dụng" };

export default function EmployerRegisterPage() {
  return (
    <AuthLayout role="employer">
      <RegisterEmployerForm />
    </AuthLayout>
  );
}