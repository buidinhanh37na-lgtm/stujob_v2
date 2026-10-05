"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Home } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

interface Props {
  title: string;
  role: Role;
}

export function Topbar({ title, role }: Props) {
  const [unread, setUnread] = useState(0);

  // Gọi hook vô điều kiện
  const sinhVien = useAuthStore((s) => s.sinhVien);
  const nhaTuyenDung = useAuthStore((s) => s.nhaTuyenDung);
  const admin = useAuthStore((s) => s.admin);

  const user =
    role === "sinh_vien"
      ? sinhVien
      : role === "nha_tuyen_dung"
        ? nhaTuyenDung
        : admin;

  useEffect(() => {
    setUnread(0);
  }, [user]);

  const notiHref =
    role === "sinh_vien"
      ? "/student/notifications"
      : role === "nha_tuyen_dung"
        ? "/employer/notifications"
        : "/admin/notifications";

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 lg:pl-6 pl-14">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 flex-1 truncate">
          {title}
        </h1>

        <Link
          href={notiHref}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition flex-shrink-0"
          title="Thông báo"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {role === "sinh_vien" && (
          <Link
            href="/"
            className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 items-center justify-center transition flex-shrink-0"
            title="Trang chủ"
          >
            <Home className="w-5 h-5 text-slate-600" />
          </Link>
        )}
      </div>
    </header>
  );
}