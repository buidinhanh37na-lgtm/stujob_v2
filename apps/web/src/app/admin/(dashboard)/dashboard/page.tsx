"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  Building2,
  Briefcase,
  Send,
  Shield,
  TrendingUp,
  Wallet,
  Star,
} from "lucide-react";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";
import { fmtMoney } from "@/lib/utils";
import { StaggerList, StaggerItem, FadeIn } from "@/components/motion";

interface Overview {
  total_sv: number;
  total_ntd: number;
  total_jobs: number;
  total_apps: number;
  pending_verify: number;
  pending_complaints: number;
  pending_jobs: number;
}

interface DashData {
  overview: Overview;
  match_rate: { matched: number; total: number; rate: number };
  escrow: { dang_giu: number; da_giai_ngan: number };
  revenue: {
    tong: number;
    tu_ntd: number;
    tu_sv: number;
    so_gd_ntd: number;
    so_gd_sv: number;
  };
  wallets: { ntd: number; sv: number; tong: number };
  chart: Array<{
    date: string;
    giai_ngan: number;
    nap_vao: number;
    phi: number;
  }>;
  top_ntd: Array<{
    id: number;
    ten_cong_ty: string;
    so_gd: number;
    doanh_thu: number;
  }>;
  top_sv: Array<{
    id: number;
    ho_ten: string;
    ma_sinh_vien: string;
    diem_danh_gia: number;
    so_lan_danh_gia: number;
  }>;
}

export default function AdminDashboardPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");
  const admin = useAuthStore((s) => s.admin);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const res = await api.get("/api/admin/dashboard");
        if (res.data.success) setData(res.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  if (authLoading || !admin) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải dashboard...
      </div>
    );
  }

  const o = data.overview;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1 break-words">
          Xin chào, {admin.ho_ten}! 🛡️
        </h2>
        <p className="text-purple-100 text-sm">
          Vai trò: <b>{admin.vai_tro}</b> • {admin.email}
        </p>
      </div>

      {/* Row 1 */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Sinh viên"
            value={o.total_sv.toLocaleString("vi-VN")}
            icon={<Users className="w-5 h-5" />}
            color="purple"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Nhà tuyển dụng"
            value={o.total_ntd.toLocaleString("vi-VN")}
            icon={<Building2 className="w-5 h-5" />}
            color="sky"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tin việc"
            value={o.total_jobs.toLocaleString("vi-VN")}
            icon={<Briefcase className="w-5 h-5" />}
            color="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Ứng tuyển"
            value={o.total_apps.toLocaleString("vi-VN")}
            icon={<Send className="w-5 h-5" />}
            color="emerald"
          />
        </StaggerItem>
      </StaggerList>

      {/* Row 2 */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Tỷ lệ ghép việc"
            value={`${data.match_rate.rate}%`}
            sub={`${data.match_rate.matched}/${data.match_rate.total}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Escrow đang giữ"
            value={fmtMoney(data.escrow.dang_giu)}
            sub={`Đã giải ngân: ${fmtMoney(data.escrow.da_giai_ngan)}`}
            icon={<Shield className="w-5 h-5" />}
            color="amber"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Doanh thu"
            value={fmtMoney(data.revenue.tong)}
            sub={`${data.revenue.so_gd_ntd + data.revenue.so_gd_sv} GD`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Tổng ví hệ thống"
            value={fmtMoney(data.wallets.tong)}
            sub={`NTD: ${fmtMoney(data.wallets.ntd)} • SV: ${fmtMoney(
              data.wallets.sv
            )}`}
            icon={<Wallet className="w-5 h-5" />}
            color="sky"
          />
        </StaggerItem>
      </StaggerList>

      {/* Alerts */}
      <FadeIn delay={0.1}>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3">⚠️ Cần xử lý</h3>
          <div className="flex flex-wrap gap-2">
            {o.pending_verify > 0 && (
              <Link
                href="/admin/verify"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition"
              >
                📋 {o.pending_verify} SV chờ xác thực
              </Link>
            )}
            {o.pending_complaints > 0 && (
              <Link
                href="/admin/complaints"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition"
              >
                🚨 {o.pending_complaints} khiếu nại cần xử lý
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              📝 {o.pending_jobs} tin đang mở
            </span>
          </div>
        </div>
      </FadeIn>

      {/* Chart */}
      <FadeIn delay={0.15}>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">
            📈 Dòng tiền 30 ngày qua
          </h3>
          <ChartChart data={data.chart} />
        </div>
      </FadeIn>

      {/* Top lists */}
      <StaggerList className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full">
            <h3 className="font-bold text-slate-900 mb-4">
              🏆 Top NTD theo doanh thu
            </h3>
            {data.top_ntd.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                Chưa có dữ liệu
              </div>
            ) : (
              <div className="space-y-2">
                {data.top_ntd.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {t.ten_cong_ty}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.so_gd} giao dịch
                      </div>
                    </div>
                    <div className="font-bold text-purple-600 text-sm">
                      {fmtMoney(t.doanh_thu)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full">
            <h3 className="font-bold text-slate-900 mb-4">⭐ Top sinh viên</h3>
            {data.top_sv.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                Chưa có SV được đánh giá
              </div>
            ) : (
              <div className="space-y-2">
                {data.top_sv.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {t.ho_ten}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.ma_sinh_vien}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">
                        {Number(t.diem_danh_gia).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({t.so_lan_danh_gia})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </StaggerItem>
      </StaggerList>
    </div>
  );
}

// ============================================================
// StatCard
// ============================================================
function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: "purple" | "sky" | "amber" | "emerald";
}) {
  const colors = {
    purple: "bg-purple-50 text-purple-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold text-slate-900 truncate">{value}</div>
      {sub && (
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
          {sub}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ChartChart — có tooltip hover
// ============================================================
interface ChartDataPoint {
  date: string;
  giai_ngan: number;
  nap_vao: number;
  phi: number;
}

function ChartChart({ data }: { data: ChartDataPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [hover, setHover] = useState<{
    idx: number;
    left: number;
    top: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  const W = 800;
  const H = 220;
  const PAD = 40;
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.giai_ngan, d.nap_vao, d.phi)),
    100000
  );
  const stepX = (W - PAD * 2) / Math.max(1, data.length - 1);
  const toY = (v: number) => H - PAD - (v / maxVal) * (H - PAD * 2);
  const toX = (i: number) => PAD + i * stepX;

  const lineGiaiNgan = data
    .map((d, i) => `${toX(i)},${toY(d.giai_ngan)}`)
    .join(" ");
  const lineNapVao = data
    .map((d, i) => `${toX(i)},${toY(d.nap_vao)}`)
    .join(" ");
  const linePhi = data.map((d, i) => `${toX(i)},${toY(d.phi)}`).join(" ");

  // Grid lines
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const y = PAD + ((H - PAD * 2) * i) / 4;
    grid += `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
  }

  // X labels
  const step = Math.max(1, Math.ceil(data.length / 8));
  let xLabels = "";
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      xLabels += `<text x="${toX(i)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#94a3b8">${d.date}</text>`;
    }
  });

  // ============================================================
  // MOUSE HANDLERS
  // ============================================================
  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !wrapperRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();

    // Convert clientX → SVG coords (viewBox)
    const scaleX = W / svgRect.width;
    const svgX = (e.clientX - svgRect.left) * scaleX;

    // Tính index gần nhất
    const idxRaw = Math.round((svgX - PAD) / stepX);
    const idx = Math.max(0, Math.min(data.length - 1, idxRaw));

    // Vị trí tooltip (relative to wrapper, dùng pixel để tránh scale lỗi)
    const pointXInSvg = toX(idx);
    const pointXInPx = (pointXInSvg / W) * svgRect.width;
    const tooltipLeft = Math.min(
      Math.max(pointXInPx, 90),
      wrapperRect.width - 90
    );

    setHover({ idx, left: tooltipLeft, top: 0 });
  }

  function handleMouseLeave() {
    setHover(null);
  }

  // ============================================================
  // RENDER
  // ============================================================
  const hoverData = hover ? data[hover.idx] : null;
  const hoverX = hover ? toX(hover.idx) : 0;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-56 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {grid}

          {/* Vertical hover line */}
          {hover && (
            <line
              x1={hoverX}
              y1={PAD}
              x2={hoverX}
              y2={H - PAD}
              stroke="#8b5cf6"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          )}

          {/* Lines */}
          <polyline
            points={lineNapVao}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polyline
            points={lineGiaiNgan}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polyline
            points={linePhi}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="5 5"
          />

          {/* Hover dots */}
          {hover && hoverData && (
            <>
              <circle
                cx={toX(hover.idx)}
                cy={toY(hoverData.nap_vao)}
                r="5"
                fill="#0ea5e9"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={toX(hover.idx)}
                cy={toY(hoverData.giai_ngan)}
                r="5"
                fill="#a855f7"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle
                cx={toX(hover.idx)}
                cy={toY(hoverData.phi)}
                r="4"
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth="2"
              />
            </>
          )}

          {xLabels}
        </svg>
      </div>

      {/* Tooltip */}
      {hover && hoverData && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 transition-opacity duration-100"
          style={{
            left: `${hover.left}px`,
            top: "10px",
          }}
        >
          <div className="bg-slate-900 text-white rounded-xl shadow-2xl px-3.5 py-2.5 text-xs min-w-[200px] border border-slate-700">
            <div className="font-bold text-[13px] mb-1.5 pb-1.5 border-b border-slate-700">
              📅 {hoverData.date}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Nạp vào
                </span>
                <span className="font-semibold text-sky-300">
                  {fmtMoney(hoverData.nap_vao)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Giải ngân
                </span>
                <span className="font-semibold text-purple-300">
                  {fmtMoney(hoverData.giai_ngan)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Phí DV
                </span>
                <span className="font-semibold text-amber-300">
                  {fmtMoney(hoverData.phi)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-5 mt-3 text-xs">
        <Legend color="#0ea5e9" label="Nạp vào" />
        <Legend color="#a855f7" label="Giải ngân" />
        <Legend color="#f59e0b" label="Phí DV" dashed />
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600">
      <div
        className="w-3 h-3 rounded-full"
        style={{
          backgroundColor: dashed ? "transparent" : color,
          border: dashed ? `2px dashed ${color}` : "none",
        }}
      />
      {label}
    </div>
  );
}