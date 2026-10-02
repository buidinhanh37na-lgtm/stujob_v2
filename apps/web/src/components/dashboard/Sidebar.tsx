"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LogOut, Menu, X, Home, User, FileText, Calendar, Briefcase,
  Send, Mail, ClipboardList, Wallet, MessageSquare, Bell,
  Building2, PenSquare, Users, Target, Shield, CheckCircle,
  AlertTriangle, Key, TrendingUp, Settings, Crown, Link2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { getInitials } from "@/lib/utils";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

export interface SidebarItem {
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

const ICONS = {
  Home, User, FileText, Calendar, Briefcase,
  Send, Mail, ClipboardList, Wallet, MessageSquare, Bell,
  Building2, PenSquare, Users, Target, Shield, CheckCircle,
  AlertTriangle, Key, TrendingUp, Settings, Crown, Link2,
};

const THEME: Record<Role, { logoBg: string; activeBg: string; activeText: string; brand: string; sub: string }> = {
  sinh_vien: {
    logoBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-700",
    brand: "Stujob",
    sub: "Sinh viên",
  },
  nha_tuyen_dung: {
    logoBg: "bg-gradient-to-br from-orange-500 to-rose-600",
    activeBg: "bg-orange-50",
    activeText: "text-orange-700",
    brand: "Stujob",
    sub: "Nhà tuyển dụng",
  },
  quan_tri_vien: {
    logoBg: "bg-gradient-to-br from-slate-700 to-slate-900",
    activeBg: "bg-slate-100",
    activeText: "text-slate-900",
    brand: "Stujob Admin",
    sub: "Quản trị hệ thống",
  },
};

interface Props {
  role: Role;
  items: SidebarItem[];
  pageTitle: string;
}

export function Sidebar({ role, items }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const theme = THEME[role];

  const sinhVien = useAuthStore((s) => s.sinhVien);
  const nhaTuyenDung = useAuthStore((s) => s.nhaTuyenDung);
  const admin = useAuthStore((s) => s.admin);
  const logoutStudent = useAuthStore((s) => s.logoutStudent);
  const logoutEmployer = useAuthStore((s) => s.logoutEmployer);
  const logoutAdmin = useAuthStore((s) => s.logoutAdmin);

  const user =
    role === "sinh_vien" ? sinhVien : role === "nha_tuyen_dung" ? nhaTuyenDung : admin;

  const userName =
    role === "sinh_vien"
      ? sinhVien?.ho_ten || "Sinh viên"
      : role === "nha_tuyen_dung"
        ? nhaTuyenDung?.ten_cong_ty || "Nhà tuyển dụng"
        : admin?.ho_ten || "Admin";

  async function handleLogout() {
    if (role === "sinh_vien") await logoutStudent();
    else if (role === "nha_tuyen_dung") await logoutEmployer();
    else await logoutAdmin();
    window.location.href =
      role === "sinh_vien"
        ? "/login"
        : role === "nha_tuyen_dung"
          ? "/employer/login"
          : "/admin/login";
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center"
        aria-label="Mở menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${theme.logoBg} flex items-center justify-center flex-shrink-0`}>
            {role === "quan_tri_vien" ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <Home className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900 truncate">
              {theme.brand}
            </div>
            <div className="text-xs text-slate-500 truncate">{theme.sub}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden ml-auto p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? `${theme.activeBg} ${theme.activeText}`
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer user */}
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition">
            <div className={`w-9 h-9 rounded-full ${theme.logoBg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-slate-900 truncate">
                {userName}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {user?.email || ""}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}