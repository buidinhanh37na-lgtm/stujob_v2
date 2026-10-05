"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LogOut,
  Menu,
  X,
  Home,
  User,
  FileText,
  Calendar,
  Briefcase,
  Send,
  Mail,
  ClipboardList,
  Wallet,
  MessageSquare,
  Bell,
  Building2,
  PenSquare,
  Users,
  Target,
  Shield,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Key,
  TrendingUp,
  Settings,
  Crown,
  Link2,
  Star,
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
  Home,
  User,
  FileText,
  Calendar,
  Briefcase,
  Send,
  Mail,
  ClipboardList,
  Wallet,
  MessageSquare,
  Bell,
  Building2,
  PenSquare,
  Users,
  Target,
  Shield,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Key,
  TrendingUp,
  Settings,
  Crown,
  Link2,
  Star,
};

// ============================================================
// THEME — SIDEBAR MÀU THEO ROLE
// ============================================================
interface ThemeConfig {
  /** Background gradient của sidebar */
  bg: string;
  /** Border giữa các section */
  border: string;
  /** Text thường */
  text: string;
  /** Text đậm/hover */
  textHover: string;
  /** Text khi active */
  activeText: string;
  /** Background khi hover */
  hoverBg: string;
  /** Background khi active */
  activeBg: string;
  /** Section label (nhóm menu) */
  groupText: string;
  /** Logo box */
  logoBg: string;
  /** User avatar */
  avatarBg: string;
  /** Brand color */
  brand: string;
  /** Subtitle */
  sub: string;
}

const THEME: Record<Role, ThemeConfig> = {
  sinh_vien: {
    bg: "linear-gradient(180deg, #1e1b4b 0%, #4c1d95 50%, #5b21b6 100%)",
    border: "border-white/10",
    text: "text-indigo-100",
    textHover: "text-white",
    activeText: "text-white",
    hoverBg: "hover:bg-white/10",
    activeBg: "bg-white/15 shadow-lg shadow-purple-500/20",
    groupText: "text-indigo-300/70",
    logoBg: "bg-gradient-to-br from-indigo-400 to-purple-500",
    avatarBg: "bg-gradient-to-br from-indigo-400 to-purple-500",
    brand: "Stujob",
    sub: "Sinh viên",
  },
  nha_tuyen_dung: {
    bg: "linear-gradient(180deg, #082f49 0%, #0369a1 50%, #075985 100%)",
    border: "border-white/10",
    text: "text-sky-100",
    textHover: "text-white",
    activeText: "text-white",
    hoverBg: "hover:bg-white/10",
    activeBg: "bg-white/15 shadow-lg shadow-sky-500/20",
    groupText: "text-sky-300/70",
    logoBg: "bg-gradient-to-br from-sky-400 to-blue-500",
    avatarBg: "bg-gradient-to-br from-sky-400 to-blue-500",
    brand: "Stujob",
    sub: "Nhà tuyển dụng",
  },
  quan_tri_vien: {
    bg: "linear-gradient(180deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)",
    border: "border-white/10",
    text: "text-purple-100",
    textHover: "text-white",
    activeText: "text-white",
    hoverBg: "hover:bg-white/10",
    activeBg: "bg-white/15 shadow-lg shadow-purple-500/20",
    groupText: "text-purple-300/70",
    logoBg: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
    avatarBg: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
    brand: "Stujob Admin",
    sub: "Quản trị hệ thống",
  },
};

// ============================================================
// ICON COLOR THEO ROLE
// ============================================================
const ICON_COLOR: Record<Role, string> = {
  sinh_vien: "text-purple-300",
  nha_tuyen_dung: "text-sky-300",
  quan_tri_vien: "text-purple-300",
};

const ICON_ACTIVE_COLOR: Record<Role, string> = {
  sinh_vien: "text-white",
  nha_tuyen_dung: "text-white",
  quan_tri_vien: "text-white",
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
    role === "sinh_vien"
      ? sinhVien
      : role === "nha_tuyen_dung"
        ? nhaTuyenDung
        : admin;

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
      {/* Mobile toggle */}
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

      {/* ============================================================
          SIDEBAR — nền màu theo role
          ============================================================ */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 sm:w-64 z-50 flex flex-col transition-transform overflow-hidden ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: theme.bg }}
      >
        {/* Decorative orb */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-20 w-48 h-48 rounded-full bg-white/5 blur-3xl" />

        {/* Header */}
        <div
          className={`relative p-5 border-b ${theme.border} flex items-center gap-3`}
        >
          <div
            className={`w-10 h-10 rounded-xl ${theme.logoBg} flex items-center justify-center flex-shrink-0 shadow-lg`}
          >
            {role === "quan_tri_vien" ? (
              <Shield className="w-5 h-5 text-white" />
            ) : (
              <Home className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-white truncate">
              {theme.brand}
            </div>
            <div className={`text-xs ${theme.groupText} truncate`}>
              {theme.sub}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className={`lg:hidden ml-auto p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav
          className={`relative flex-1 overflow-y-auto p-3 space-y-0.5 no-scrollbar`}
        >
          {items.map((item) => {
            const Icon = ICONS[item.icon] || Home;
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? `${theme.activeBg} ${theme.activeText}`
                    : `${theme.text} ${theme.hoverBg} ${theme.textHover}`
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    active
                      ? ICON_ACTIVE_COLOR[role]
                      : `${ICON_COLOR[role]} group-hover:text-white`
                  }`}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer user */}
        <div className={`relative p-3 border-t ${theme.border}`}>
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl ${theme.hoverBg} transition`}
          >
            <div
              className={`w-9 h-9 rounded-full ${theme.avatarBg} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}
            >
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-white truncate">
                {userName}
              </div>
              <div className={`text-[11px] ${theme.groupText} truncate`}>
                {user?.email || ""}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-white/60 hover:text-red-300 hover:bg-red-500/20 transition"
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