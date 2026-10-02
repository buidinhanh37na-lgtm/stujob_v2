"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SidebarItem } from "@/components/dashboard/Sidebar";

const ITEMS: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "Home" },
  { label: "Xác thực SV", href: "/admin/verify", icon: "CheckCircle" },
  { label: "Kiểm duyệt tin", href: "/admin/moderation", icon: "Shield" },
  { label: "Từ khóa chặn", href: "/admin/keywords", icon: "Key" },
  { label: "Tin việc", href: "/admin/jobs", icon: "ClipboardList" },
  { label: "Người dùng", href: "/admin/users", icon: "Users" },
  { label: "SV nhà trường", href: "/admin/sv-truong", icon: "Building2" },
  { label: "Khiếu nại", href: "/admin/complaints", icon: "AlertTriangle" },
  { label: "Hoàn tiền", href: "/admin/refunds", icon: "Wallet" },
  { label: "Doanh thu", href: "/admin/revenue", icon: "TrendingUp" },
  { label: "Kết nối", href: "/admin/connections", icon: "Link2" },
  { label: "Nhật ký", href: "/admin/logs", icon: "FileText" },
  { label: "Cài đặt", href: "/admin/settings", icon: "Settings" },
  { label: "Quản trị viên", href: "/admin/admins", icon: "Crown" },
  { label: "Thông báo", href: "/admin/notifications", icon: "Bell" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="quan_tri_vien" items={ITEMS} title="Stujob Admin">
      {children}
    </DashboardLayout>
  );
}