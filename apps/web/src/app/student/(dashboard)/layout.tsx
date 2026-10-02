"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SidebarItem } from "@/components/dashboard/Sidebar";

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
  { label: "Thông báo", href: "/student/notifications", icon: "Bell" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="sinh_vien" items={ITEMS} title="Stujob Sinh viên">
      {children}
    </DashboardLayout>
  );
}