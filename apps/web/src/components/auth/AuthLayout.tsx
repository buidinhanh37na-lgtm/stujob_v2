
import { GraduationCap, Building2, Shield } from "lucide-react";
import type { ReactNode } from "react";

type Role = "student" | "employer" | "admin";

interface AuthLayoutProps {
  role: Role;
  children: ReactNode;
}

const THEME: Record<
  Role,
  {
    gradient: string;
    icon: typeof GraduationCap;
    logoBg: string;
    title: string;
    subtitle: string;
    heroTitle: string;
    heroDesc: string;
    accent: string;
  }
> = {
  student: {
    gradient: "from-indigo-500 via-indigo-600 to-purple-700",
    icon: GraduationCap,
    logoBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
    title: "Stujob",
    subtitle: "Dành cho Sinh viên",
    heroTitle: "Tìm việc làm phù hợp với lịch học",
    heroDesc:
      "Hàng nghìn công việc bán thời gian đang chờ bạn. Minh bạch, an toàn, thông minh.",
    accent: "text-indigo-600",
  },
  employer: {
    gradient: "from-sky-500 via-sky-600 to-indigo-700",
    icon: Building2,
    logoBg: "bg-gradient-to-br from-sky-500 to-indigo-600",
    title: "Stujob",
    subtitle: "Dành cho Nhà tuyển dụng",
    heroTitle: "Kết nối với sinh viên tài năng",
    heroDesc:
      "Đăng tin nhanh, nhận gợi ý ứng viên thông minh, bảo đảm thanh toán với escrow.",
    accent: "text-sky-600",
  },
  admin: {
    gradient: "from-purple-600 via-purple-700 to-purple-900",
    icon: Shield,
    logoBg: "bg-gradient-to-br from-purple-600 to-purple-800",
    title: "Stujob Admin",
    subtitle: "Quản trị hệ thống",
    heroTitle: "Trung tâm điều hành sàn",
    heroDesc:
      "Kiểm duyệt nội dung, xác thực sinh viên, xử lý tranh chấp minh bạch.",
    accent: "text-purple-700",
  },
};

export function AuthLayout({ role, children }: AuthLayoutProps) {
  const theme = THEME[role];
  const Icon = theme.icon;

  return (
    <div className="min-h-screen flex">
      {/* LEFT — FORM */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-10">
        {/* Logo top */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className={`w-11 h-11 rounded-xl ${theme.logoBg} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-lg leading-none text-slate-900">
              {theme.title}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {theme.subtitle}
            </div>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 mt-8">
          © 2026 Stujob — Nền tảng việc làm sinh viên
        </div>
      </div>

      {/* RIGHT — HERO (hidden mobile) */}
      <div
        className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${theme.gradient} relative overflow-hidden items-center justify-center p-12`}
      >
        {/* Blur circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 max-w-md text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold mb-4 leading-tight">
            {theme.heroTitle}
          </h1>
          <p className="text-white/80 leading-relaxed">{theme.heroDesc}</p>

          {/* Feature list */}
          <div className="mt-8 space-y-3 text-sm">
            {role === "student" && (
              <>
                <Feature text="Gợi ý việc làm theo lịch học của bạn" />
                <Feature text="Ví điện tử & rút tiền minh bạch" />
                <Feature text="Chat trực tiếp với nhà tuyển dụng" />
              </>
            )}
            {role === "employer" && (
              <>
                <Feature text="Đăng tin miễn phí 5 lần đầu" />
                <Feature text="Gợi ý ứng viên phù hợp tự động" />
                <Feature text="Bảo đảm thanh toán với escrow" />
              </>
            )}
            {role === "admin" && (
              <>
                <Feature text="Kiểm duyệt nội dung tự động" />
                <Feature text="Xác thực sinh viên qua DB trường" />
                <Feature text="Dashboard doanh thu realtime" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-white/90">{text}</span>
    </div>
  );
}