import Link from "next/link";
import { GraduationCap, Building2, Shield, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <GraduationCap className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Chào mừng đến với{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Stujob
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Nền tảng kết nối sinh viên với công việc bán thời gian — minh bạch,
            an toàn và thông minh.
          </p>
        </div>

        {/* Role cards */}
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Chọn vai trò của bạn
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Student */}
          <RoleCard
            href="/login"
            icon={<GraduationCap className="w-8 h-8 text-white" strokeWidth={2.5} />}
            iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
            title="Sinh viên"
            desc="Tìm việc phù hợp lịch học, nhận thù lao minh bạch, quản lý ví tiền."
            accent="group-hover:border-emerald-400"
            barClass="from-emerald-500 to-teal-600"
            ctaClass="group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600"
          />

          {/* Employer */}
          <RoleCard
            href="/employer/login"
            icon={<Building2 className="w-8 h-8 text-white" strokeWidth={2.5} />}
            iconBg="bg-gradient-to-br from-orange-500 to-rose-600"
            title="Nhà tuyển dụng"
            desc="Đăng tin nhanh, gợi ý ứng viên thông minh, bảo đảm escrow."
            accent="group-hover:border-orange-400"
            barClass="from-orange-500 to-rose-600"
            ctaClass="group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600"
          />

          {/* Admin */}
          <RoleCard
            href="/admin/login"
            icon={<Shield className="w-8 h-8 text-white" strokeWidth={2.5} />}
            iconBg="bg-gradient-to-br from-slate-700 to-slate-900"
            title="Quản trị viên"
            desc="Kiểm duyệt tin, xác thực SV, xử lý khiếu nại & doanh thu."
            accent="group-hover:border-slate-500"
            barClass="from-slate-700 to-slate-900"
            ctaClass="group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-slate-400">
          © 2026 Stujob — Nền tảng việc làm sinh viên •{" "}
          <a
            href="mailto:support@stujob.vn"
            className="text-slate-600 hover:text-slate-900 underline"
          >
            support@stujob.vn
          </a>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  href,
  icon,
  iconBg,
  title,
  desc,
  accent,
  barClass,
  ctaClass,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  accent: string;
  barClass: string;
  ctaClass: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative bg-white rounded-3xl p-7 border-2 border-slate-200 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col ${accent}`}
    >
      {/* Top gradient bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${barClass} rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity`}
      />

      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg mb-5`}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-6">
        {desc}
      </p>

      {/* CTA */}
      <div
        className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-700 transition-all ${ctaClass}`}
      >
        Đăng nhập
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}