import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = "Stujob";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stujob — Sàn việc làm sinh viên",
    template: "%s | Stujob",
  },
  description:
    "Stujob — Nền tảng kết nối sinh viên với nhà tuyển dụng uy tín. Tìm việc part-time, remote, onsite, hybrid phù hợp với lịch học.",
  keywords: [
    "việc làm sinh viên",
    "tìm việc part-time",
    "việc làm thêm",
    "tuyển dụng sinh viên",
    "remote",
    "stujob",
  ],
  authors: [{ name: "Stujob Team" }],
  creator: "Stujob",
  publisher: "Stujob",
  applicationName: SITE_NAME,
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Stujob — Sàn việc làm sinh viên",
    description:
      "Nền tảng kết nối sinh viên với nhà tuyển dụng uy tín. Tìm việc part-time, remote, onsite, hybrid.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stujob — Sàn việc làm sinh viên",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stujob — Sàn việc làm sinh viên",
    description:
      "Nền tảng kết nối sinh viên với nhà tuyển dụng uy tín.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}