import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import type { SidebarItem } from "@/components/dashboard/Sidebar";

export const metadata: Metadata = {
  title: "Nhà tuyển dụng",
  description:
    "Bảng điều khiển nhà tuyển dụng Stujob — Đăng tin, tìm ứng viên, quản lý escrow và nghiệm thu.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

const ITEMS: SidebarItem[] = [
  { label: "Tổng quan", href: "/employer/dashboard", icon: "Home" },
  { label: "Hồ sơ NTD", href: "/employer/profile", icon: "Building2" },
  { label: "Đăng tin", href: "/employer/post-job", icon: "PenSquare" },
  { label: "Tin đã đăng", href: "/employer/my-jobs", icon: "Briefcase" },
  { label: "Tìm ứng viên", href: "/employer/candidates", icon: "Users" },
  { label: "Ứng tuyển", href: "/employer/applications", icon: "Send" },
  { label: "Tin nhắn", href: "/employer/chat", icon: "MessageSquare" },
  { label: "Bảo đảm (Escrow)", href: "/employer/escrow", icon: "Shield" },
  { label: "Nghiệm thu", href: "/employer/acceptance", icon: "CheckCircle" },
  { label: "Đánh giá SV", href: "/employer/ratings", icon: "Star" },
  { label: "Báo cáo", href: "/employer/reports", icon: "FileText" },
  { label: "Thông báo", href: "/employer/notifications", icon: "Bell" },
];

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      role="nha_tuyen_dung"
      items={ITEMS}
      title="Stujob Nhà tuyển dụng"
    >
      {children}
    </DashboardLayout>
  );
}