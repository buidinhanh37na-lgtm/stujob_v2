import Link from "next/link";
import {
  Building2, ArrowRight, PenSquare, Target, MessageSquare, Shield,
  CheckCircle2, Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Stujob — Dành cho Nhà tuyển dụng",
  description:
    "Tìm sinh viên tài năng, đăng tin nhanh, chat an toàn và thanh toán minh bạch với escrow.",
};

export default function EmployerLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/15 backdrop-blur-lg border-2 border-white/25 shadow-2xl mb-6">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2} />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Stujob —{" "}
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              Cho Nhà tuyển dụng
            </span>
          </h1>

          <p className="text-base sm:text-lg text-sky-50 max-w-2xl mx-auto leading-relaxed">
            Tìm sinh viên tài năng, đăng tin nhanh, chat an toàn và thanh toán
            minh bạch với escrow bảo đảm.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            href="/employer/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-sky-700 font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            Đăng nhập
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/employer/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-transparent border-2 border-white/60 text-white font-bold text-base hover:bg-white/10 hover:border-white transition-all"
          >
            Đăng ký ngay
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          <FeatureCard
            icon={<PenSquare className="w-6 h-6 text-white" />}
            iconBg="from-sky-400 to-sky-600"
            title="Đăng tin nhanh"
            desc="Mẫu tin có sẵn cho 8 nhóm việc. Đăng tin trong 2 phút."
          />
          <FeatureCard
            icon={<Target className="w-6 h-6 text-white" />}
            iconBg="from-indigo-400 to-indigo-600"
            title="Gợi ý ứng viên"
            desc="Matching 4 tiêu chí: kỹ năng, GPA, đánh giá, khoảng cách."
          />
          <FeatureCard
            icon={<MessageSquare className="w-6 h-6 text-white" />}
            iconBg="from-emerald-400 to-emerald-600"
            title="Chat an toàn"
            desc="Chỉ mở khóa sau khi duyệt ứng viên. Chống spam hiệu quả."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6 text-white" />}
            iconBg="from-amber-400 to-amber-600"
            title="Escrow bảo đảm"
            desc="Ký quỹ trước khi giao việc. Nghiệm thu xong mới giải ngân."
          />
        </div>

        {/* Benefits */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h2 className="text-lg font-bold text-white">
              Tại sao chọn Stujob?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Benefit text="5 tin đăng đầu tiên miễn phí 100%" />
            <Benefit text="Sinh viên được xác thực qua DB nhà trường" />
            <Benefit text="Kiểm duyệt tin tự động bằng AI" />
            <Benefit text="Nhận gợi ý ứng viên phù hợp tức thì" />
            <Benefit text="Ví điện tử & báo cáo chi phí minh bạch" />
            <Benefit text="Hỗ trợ tranh chấp 24/7 từ admin" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12 text-center">
          <Stat value="1,000+" label="Sinh viên" />
          <Stat value="500+" label="Doanh nghiệp" />
          <Stat value="10,000+" label="Việc làm" />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-white/70 pt-8 border-t border-white/20">
          <p className="mb-2">
            Bạn là sinh viên?{" "}
            <Link
              href="/login"
              className="text-white font-semibold underline hover:text-amber-300"
            >
              Đăng nhập tại đây
            </Link>
          </p>
          <p>
            © 2026 Stujob — Nền tảng việc làm sinh viên •{" "}
            <a
              href="mailto:support@stujob.vn"
              className="hover:text-white underline"
            >
              support@stujob.vn
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  iconBg,
  title,
  desc,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 hover:bg-white/15 hover:-translate-y-1 transition-all">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center mb-4 shadow-lg`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-white mb-1.5 text-base">{title}</h3>
      <p className="text-sm text-white/75 leading-relaxed">{desc}</p>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle2 className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
      <span className="text-sm text-white/90">{text}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-white/70 uppercase tracking-wider font-semibold">
        {label}
      </div>
    </div>
  );
}