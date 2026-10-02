import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterStudentForm } from "@/components/auth/RegisterStudentForm";

export const metadata = { title: "Đăng ký — Stujob Sinh viên" };

export default function StudentRegisterPage() {
  return (
    <AuthLayout role="student">
      <RegisterStudentForm />
    </AuthLayout>
  );
}