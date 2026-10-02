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
  const user =
    role === "sinh_vien"
      ? useAuthStore((s) => s.sinhVien)
      : role === "nha_tuyen_dung"
        ? useAuthStore((s) => s.nhaTuyenDung)
        : useAuthStore((s) => s.admin);

  // TODO Chặng 2J: load số thông báo chưa đọc
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
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 lg:pl-6 pl-14">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex-1 truncate">
          {title}
        </h1>

        <Link
          href={notiHref}
          className="relative w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition"
          title="Thông báo"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {role === "sinh_vien" && (
          <Link
            href="/"
            className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 items-center justify-center transition"
            title="Trang chủ"
          >
            <Home className="w-5 h-5 text-slate-600" />
          </Link>
        )}
      </div>
    </header>
  );
}