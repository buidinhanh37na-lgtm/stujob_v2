"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

const REDIRECT: Record<Role, string> = {
  sinh_vien: "/login",
  nha_tuyen_dung: "/employer/login",
  quan_tri_vien: "/admin/login",
};

export function useRequireAuth(role: Role) {
  const router = useRouter();
  const sinhVien = useAuthStore((s) => s.sinhVien);
  const nhaTuyenDung = useAuthStore((s) => s.nhaTuyenDung);
  const admin = useAuthStore((s) => s.admin);
  const isLoading = useAuthStore((s) => s.isLoading);

  const currentUser =
    role === "sinh_vien"
      ? sinhVien
      : role === "nha_tuyen_dung"
        ? nhaTuyenDung
        : admin;

  useEffect(() => {
    if (!isLoading && !currentUser) {
      toast.error("Vui lòng đăng nhập");
      router.push(REDIRECT[role]);
    }
  }, [isLoading, currentUser, role, router]);

  return { user: currentUser, isLoading };
}