import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import type { SidebarItem } from "@/components/dashboard/Sidebar";

export const metadata: Metadata = {
  title: "Sinh viên",
  description:
    "Bảng điều khiển sinh viên Stujob — Tìm việc làm thêm, quản lý hồ sơ, ứng tuyển, ví tiền.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

const ITEMS: SidebarItem[] = [
  { label: "Tổng quan", href: "/student/dashboard", icon: "Home" },
  { label: "Hồ sơ & Kỹ năng", href: "/student/profile", icon: "User" },
  { label: "Chứng chỉ", href: "/student/certificates", icon: "FileText" },
  { label: "Lịch học & Lịch rảnh", href: "/student/schedule", icon: "Calendar" },
  { label: "Việc làm", href: "/student/jobs", icon: "Briefcase" },
  { label: "Đã ứng tuyển", href: "/student/applications", icon: "Send" },
  { label: "Lời mời", href: "/student/invitations", icon: "Mail" },
  { label: "Nhiệm vụ", href: "/student/tasks", icon: "ClipboardList" },
  { label: "Ví tiền", href: "/student/wallet", icon: "Wallet" },
  { label: "Tin nhắn", href: "/student/chat", icon: "MessageSquare" },
  { label: "Xác thực SV", href: "/student/verify", icon: "ShieldCheck" },
  { label: "Thông báo", href: "/student/notifications", icon: "Bell" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role="sinh_vien" items={ITEMS} title="Stujob Sinh viên">
      {children}
    </DashboardLayout>
  );
}