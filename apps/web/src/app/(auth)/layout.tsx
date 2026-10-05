import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description:
    "Đăng nhập vào Stujob — Sàn việc làm sinh viên. Tìm việc part-time, remote, hybrid phù hợp với lịch học.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}