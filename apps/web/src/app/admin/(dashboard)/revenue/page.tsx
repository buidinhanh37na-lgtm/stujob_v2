"use client";

import { useEffect, useState } from "react";
import {
  Loader2, TrendingUp, Wallet, Users, Building2, Download, Search, Award,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney } from "@/lib/utils";

interface DayPoint {
  date: string;
  full_date: string;
  ntd: number;
  sv: number;
  tong: number;
}

interface MonthPoint {
  month: string;
  ntd: number;
  sv: number;
  tong: number;
}

interface TopItem {
  id: number;
  name: string;
  sub: string;
  so_gd: number;
  doanh_thu: number;
}

interface RevenueData {
  period: { from: string; to: string };
  total: {
    revenue: number;
    from_ntd: number;
    from_sv: number;
    count_ntd: number;
    count_sv: number;
    count_total: number;
  };
  chart: DayPoint[];
  monthly: MonthPoint[];
  top_ntd: Array<{ id: number; ten_cong_ty: string; so_gd: number; doanh_thu: number }>;
  top_sv: Array<{ id: number; ho_ten: string; ma_sinh_vien: string; so_gd: number; doanh_thu: number }>;
}

export default function AdminRevenuePage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom] = useState(firstDay.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  async function load() {
    setLoading(true);
    try {
      const { data: res } = await api.get(
        `/api/admin/revenue?from=${from}&to=${to}`
      );
      if (res.success) setData(res);
    } catch {
      toast.error("Không tải được báo cáo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  function exportCSV() {
    window.location.href = `http://localhost:4000/api/admin/revenue/export?from=${from}&to=${to}`;
    toast.success("Đang tải file CSV...");
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Doanh thu</h2>
        <p className="text-slate-500 text-sm mt-1">
          Thống kê phí dịch vụ thu từ NTD và SV
        </p>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Từ ngày
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Đến ngày
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 transition"
        >
          <Search className="w-4 h-4" />
          Xem
        </button>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
        >
          <Download className="w-4 h-4" />
          Xuất CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : !data ? null : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Tổng doanh thu"
              value={fmtMoney(data.total.revenue)}
              icon={<TrendingUp className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              label="Từ NTD (10%)"
              value={fmtMoney(data.total.from_ntd)}
              sub={`${data.total.count_ntd} giao dịch`}
              icon={<Building2 className="w-5 h-5" />}
              color="sky"
            />
            <StatCard
              label="Từ SV (3%)"
              value={fmtMoney(data.total.from_sv)}
              sub={`${data.total.count_sv} giao dịch`}
              icon={<Users className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              label="Tổng giao dịch"
              value={data.total.count_total.toString()}
              icon={<Wallet className="w-5 h-5" />}
              color="amber"
            />
          </div>

          {/* Daily chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">
              📈 Doanh thu theo ngày
            </h3>
            <DailyChart data={data.chart} />
          </div>

          {/* Monthly chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">
              📊 Doanh thu 6 tháng gần nhất
            </h3>
            <MonthlyChart data={data.monthly} />
          </div>

          {/* Top lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Top NTD đóng phí nhiều nhất
              </h3>
              {data.top_ntd.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Chưa có dữ liệu
                </div>
              ) : (
                <TopList
                  items={data.top_ntd.map((t) => ({
                    id: t.id,
                    name: t.ten_cong_ty,
                    sub: `${t.so_gd} giao dịch`,
                    so_gd: t.so_gd,
                    doanh_thu: t.doanh_thu,
                  }))}
                  color="purple"
                />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Top SV đóng phí nhiều nhất
              </h3>
              {data.top_sv.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Chưa có dữ liệu
                </div>
              ) : (
                <TopList
                  items={data.top_sv.map((t) => ({
                    id: t.id,
                    name: t.ho_ten,
                    sub: t.ma_sinh_vien,
                    so_gd: t.so_gd,
                    doanh_thu: t.doanh_thu,
                  }))}
                  color="emerald"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
  color: "purple" | "sky" | "emerald" | "amber";
}) {
  const colors = {
    purple: "bg-purple-50 text-purple-600",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200">
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
        <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function TopList({
  items,
  color,
}: {
  items: TopItem[];
  color: "purple" | "emerald";
}) {
  const bg = {
    purple: "bg-purple-100 text-purple-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  const text = {
    purple: "text-purple-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="space-y-2">
      {items.map((t, i) => (
        <div
          key={t.id}
          className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${bg[color]}`}
          >
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 truncate">
              {t.name}
            </div>
            <div className="text-[11px] text-slate-500">{t.sub}</div>
          </div>
          <div className={`font-bold text-sm ${text[color]}`}>
            {fmtMoney(t.doanh_thu)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Daily chart — 3 đường line
// ============================================================
function DailyChart({ data }: { data: DayPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  const W = 800;
  const H = 240;
  const PAD_L = 60;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 40;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...data.map((d) => Math.max(d.ntd, d.sv, d.tong)), 100000);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const toX = (i: number) => PAD_L + i * stepX;
  const toY = (v: number) => PAD_T + chartH - (v / maxVal) * chartH;

  const lineNTD = data.map((d, i) => `${toX(i)},${toY(d.ntd)}`).join(" ");
  const lineSV = data.map((d, i) => `${toX(i)},${toY(d.sv)}`).join(" ");
  const lineTong = data.map((d, i) => `${toX(i)},${toY(d.tong)}`).join(" ");

  // Grid
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const y = PAD_T + (chartH * i) / 4;
    const v = maxVal * (1 - i / 4);
    grid += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    grid += `<text x="${PAD_L - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8">${fmtShort(v)}</text>`;
  }

  // X labels
  const step = Math.max(1, Math.ceil(data.length / 10));
  let xLabels = "";
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      xLabels += `<text x="${toX(i)}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#94a3b8">${d.date}</text>`;
    }
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-60">
        {grid}
        <polyline points={lineTong} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={lineNTD} fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" />
        <polyline points={lineSV} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
        {xLabels}
      </svg>
      <div className="flex justify-center gap-5 mt-3 text-xs flex-wrap">
        <LegendDot color="#0ea5e9" label="Từ NTD" />
        <LegendDot color="#10b981" label="Từ SV" />
        <LegendDot color="#a855f7" label="Tổng" />
      </div>
    </div>
  );
}

// ============================================================
// Monthly chart — stacked bars
// ============================================================
function MonthlyChart({ data }: { data: MonthPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  const W = 800;
  const H = 240;
  const PAD_L = 60;
  const PAD_R = 20;
  const PAD_T = 30;
  const PAD_B = 40;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...data.map((d) => d.tong), 100000);
  const barW = (chartW / data.length) * 0.5;
  const gap = chartW / data.length;

  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const y = PAD_T + (chartH * i) / 4;
    const v = maxVal * (1 - i / 4);
    grid += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    grid += `<text x="${PAD_L - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8">${fmtShort(v)}</text>`;
  }

  let bars = "";
  data.forEach((d, i) => {
    const x = PAD_L + i * gap + (gap - barW) / 2;
    const hNTD = (d.ntd / maxVal) * chartH;
    const hSV = (d.sv / maxVal) * chartH;

    bars += `<rect x="${x}" y="${PAD_T + chartH - hNTD}" width="${barW}" height="${hNTD}" fill="#0ea5e9" rx="3" opacity="0.9"/>`;
    bars += `<rect x="${x}" y="${PAD_T + chartH - hNTD - hSV}" width="${barW}" height="${hSV}" fill="#10b981" rx="3" opacity="0.9"/>`;

    bars += `<text x="${x + barW / 2}" y="${H - 20}" text-anchor="middle" font-size="11" fill="#475569" font-weight="600">${d.month}</text>`;

    if (d.tong > 0) {
      bars += `<text x="${x + barW / 2}" y="${PAD_T + chartH - hNTD - hSV - 8}" text-anchor="middle" font-size="11" fill="#a855f7" font-weight="700">${fmtShort(d.tong)}</text>`;
    }
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-60">
        {grid}
        {bars}
      </svg>
      <div className="flex justify-center gap-5 mt-3 text-xs">
        <LegendDot color="#0ea5e9" label="Từ NTD" />
        <LegendDot color="#10b981" label="Từ SV" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600">
      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

function fmtShort(n: number): string {
  const v = Number(n || 0);
  if (v >= 1000000000) return (v / 1000000000).toFixed(1) + "B";
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(0) + "K";
  return v.toFixed(0);
}