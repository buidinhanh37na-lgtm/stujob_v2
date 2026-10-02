"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SidebarItem } from "@/components/dashboard/Sidebar";

const ITEMS: SidebarItem[] = [
  { label: "Tổng quan", href: "/employer/dashboard", icon: "Home" },
  { label: "Hồ sơ công ty", href: "/employer/profile", icon: "Building2" },
  { label: "Đăng tin việc", href: "/employer/post-job", icon: "PenSquare" },
  { label: "Tin việc của tôi", href: "/employer/my-jobs", icon: "ClipboardList" },
  { label: "Gợi ý ứng viên", href: "/employer/candidates", icon: "Target" },
  { label: "Ứng tuyển", href: "/employer/applications", icon: "Send" },
  { label: "Tin nhắn", href: "/employer/chat", icon: "MessageSquare" },
  { label: "Bảo đảm TT", href: "/employer/escrow", icon: "Shield" },
  { label: "Nghiệm thu", href: "/employer/acceptance", icon: "CheckCircle" },
  { label: "Đánh giá SV", href: "/employer/ratings", icon: "Users" },
  { label: "Báo cáo chi phí", href: "/employer/reports", icon: "TrendingUp" },
  { label: "Thông báo", href: "/employer/notifications", icon: "Bell" },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="nha_tuyen_dung" items={ITEMS} title="Stujob Nhà tuyển dụng">
      {children}
    </DashboardLayout>
  );
}