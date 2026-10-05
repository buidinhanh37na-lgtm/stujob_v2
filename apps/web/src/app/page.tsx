import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const SPARKLES = [
  { top: "12%", left: "8%", delay: "0s", size: 3 },
  { top: "22%", left: "88%", delay: "0.6s", size: 4 },
  { top: "65%", left: "5%", delay: "1.2s", size: 3 },
  { top: "78%", left: "93%", delay: "1.8s", size: 4 },
  { top: "45%", left: "48%", delay: "0.9s", size: 3 },
  { top: "88%", left: "25%", delay: "2.1s", size: 3 },
  { top: "8%", left: "70%", delay: "1.5s", size: 4 },
  { top: "55%", left: "95%", delay: "0.3s", size: 3 },
];

export default function HomePage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden text-white animate-gradient"
      style={{
        background:
          "linear-gradient(-45deg, #0a0524 0%, #1e1b4b 25%, #3730a3 50%, #6d28d9 75%, #0a0524 100%)",
      }}
    >
      {/* ORBS */}
      <div
        className="pointer-events-none absolute -top-[400px] -right-[300px] w-[850px] h-[850px] rounded-full blur-[120px] animate-float-1"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-[400px] -left-[300px] w-[750px] h-[750px] rounded-full blur-[120px] animate-float-2"
        style={{
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0) 70%)",
        }}
      />

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Sparkles */}
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full bg-white animate-sparkle"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            boxShadow: "0 0 10px rgba(255,255,255,0.9)",
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* ============================================================
          CONTENT
          ============================================================ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-6xl">
          {/* ========= HERO ========= */}
          <div className="text-center mb-14">
            {/* Logo */}
            <div className="inline-flex items-center justify-center mb-7">
              <div className="relative">
                <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-purple-500 to-blue-500 blur-xl opacity-70 animate-pulse" />
                <div className="relative w-[76px] h-[76px] rounded-[22px] bg-gradient-to-br from-purple-500/40 via-indigo-500/30 to-blue-500/40 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center animate-pulse-glow">
                  <GraduationCap
                    className="w-11 h-11 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]"
                    strokeWidth={2.2}
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
              <span className="text-white">Chào mừng đến với </span>
              <span
                className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.1)" }}
              >
                Stujob
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-purple-100/80 max-w-2xl mx-auto leading-relaxed mb-3">
              Nền tảng kết nối sinh viên với công việc bán thời gian
            </p>
            <p className="text-sm sm:text-base lg:text-lg">
              <span className="text-white font-semibold">Minh bạch</span>
              <span className="mx-3 text-purple-300/50">•</span>
              <span className="text-white font-semibold">An toàn</span>
              <span className="mx-3 text-purple-300/50">•</span>
              <span className="text-white font-semibold">Thông minh</span>
            </p>
          </div>

          {/* ========= SECTION LABEL ========= */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-300/60" />
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-purple-200">
                Chọn vai trò của bạn
              </span>
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-300/60" />
            </div>
          </div>

          {/* ========= ROLE CARDS ========= */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <RoleCard
              href="/login"
              icon={
                <GraduationCap
                  className="w-8 h-8 text-white"
                  strokeWidth={2.2}
                />
              }
              gradient="from-indigo-500 via-purple-500 to-violet-600"
              glowColor="rgba(139, 92, 246, 0.6)"
              title="Sinh viên"
              desc="Tìm việc phù hợp lịch học, ví tiền minh bạch, chat trực tiếp với NTD."
            />

            <RoleCard
              href="/employer/login"
              icon={
                <Building2 className="w-8 h-8 text-white" strokeWidth={2.2} />
              }
              gradient="from-blue-500 via-cyan-500 to-sky-600"
              glowColor="rgba(59, 130, 246, 0.6)"
              title="Nhà tuyển dụng"
              desc="Đăng tin nhanh, gợi ý ứng viên thông minh, escrow bảo đảm."
            />

            <RoleCard
              href="/admin/login"
              icon={<Shield className="w-8 h-8 text-white" strokeWidth={2.2} />}
              gradient="from-fuchsia-500 via-purple-600 to-indigo-700"
              glowColor="rgba(217, 70, 239, 0.6)"
              title="Quản trị viên"
              desc="Xác thực SV, kiểm duyệt tin tự động, xử lý tranh chấp."
            />
          </div>

          

          {/* ========= FOOTER ========= */}
          <div className="text-center text-xs sm:text-sm text-purple-200/60">
            © 2026 Stujob — Nền tảng việc làm sinh viên •{" "}
            <a
              href="mailto:support@stujob.vn"
              className="text-purple-200 hover:text-white underline transition"
            >
              support@stujob.vn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROLE CARD
// ============================================================
function RoleCard({
  href,
  icon,
  gradient,
  glowColor,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative backdrop-blur-xl bg-white/[0.06] rounded-3xl p-7 border border-white/15 hover:border-white/35 hover:bg-white/[0.1] hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden"
      style={{ boxShadow: "0 10px 35px rgba(0,0,0,0.2)" }}
    >
      {/* Shine */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div
          className="absolute -top-full -left-full w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ transform: "rotate(25deg)" }}
        />
      </div>

      {/* Icon */}
      <div className="relative mb-5 flex items-center justify-center">
        <div
          className="absolute w-[72px] h-[72px] rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: glowColor }}
        />
        <div
          className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl group-hover:animate-icon-bounce`}
          style={{
            boxShadow: `0 12px 30px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.35)`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
          {icon}
        </div>
      </div>

      {/* Title + desc */}
      <h3 className="relative text-xl font-bold text-white text-center mb-2">
        {title}
      </h3>
      <p className="relative text-[13px] text-purple-100/70 leading-relaxed text-center mb-6 flex-1">
        {desc}
      </p>

      {/* CTA */}
      <div className="relative inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white/10 border border-white/25 text-sm font-bold text-white group-hover:bg-white group-hover:text-indigo-700 group-hover:border-white transition-all duration-300">
        Đăng nhập
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>

      {/* Bottom accent */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </Link>
  );
}

