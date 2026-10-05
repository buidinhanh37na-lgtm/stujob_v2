"use client";

import { useEffect, useState } from "react";
import {
  Loader2, TrendingUp, TrendingDown, Shield, Download, Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDate } from "@/lib/utils";

interface ReportData {
  period: { from: string; to: string };
  tong: { tong: number; phi: number; so_gd: number };
  dang_giu: { tong: number; phi: number; so_gd: number };
  chi_tiet: Array<{
    id: number;
    ma_giao_dich: string | null;
    so_tien: number;
    phi_dich_vu: number;
    trang_thai: string;
    created_at: string;
    ngay_giai_ngan: string | null;
    tieu_de: string;
    ho_ten: string;
    ma_sinh_vien: string | null;
  }>;
}

const STATUS_LABEL: Record<string, string> = {
  cho_nap: "⏳ Chờ nạp",
  da_nap: "🔒 Đã ký quỹ",
  cho_nghiem_thu: "⏳ Chờ nghiệm thu",
  da_giai_ngan: "✅ Đã giải ngân",
  hoan_tien: "↩️ Hoàn tiền",
  huy: "❌ Huỷ",
};

export default function ReportsPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [from, setFrom] = useState(firstDay.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  async function load() {
    setLoading(true);
    try {
      const { data: res } = await api.get(
        `/api/employer/reports?from=${from}&to=${to}`
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
    window.location.href = `http://localhost:4000/api/employer/reports/export?from=${from}&to=${to}`;
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
        <h2 className="text-2xl font-bold text-slate-900">Báo cáo chi phí</h2>
        <p className="text-slate-500 text-sm mt-1">
          Thống kê chi phí tuyển dụng và escrow theo khoảng thời gian
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
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
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
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 transition"
        >
          <Search className="w-4 h-4" />
          Xem báo cáo
        </button>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
        >
          <Download className="w-4 h-4" />
          Xuất CSV
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Tổng chi"
              value={fmtMoney(data.tong.tong)}
              sub={`${data.tong.so_gd} giao dịch`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="sky"
            />
            <StatCard
              label="Phí dịch vụ"
              value={fmtMoney(data.tong.phi)}
              sub="Phí sàn đã trả"
              icon={<Wallet className="w-5 h-5" />}
              color="amber"
            />
            <StatCard
              label="Đang giữ escrow"
              value={fmtMoney(data.dang_giu.tong)}
              sub={`${data.dang_giu.so_gd} giao dịch`}
              icon={<Shield className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              label="Phí escrow"
              value={fmtMoney(data.dang_giu.phi)}
              sub="Phí chưa trả"
              icon={<TrendingDown className="w-5 h-5" />}
              color="purple"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-4">
              📊 Chi tiết giao dịch ({data.chi_tiet.length})
            </h3>
            {data.chi_tiet.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Không có giao dịch trong khoảng thời gian này
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">
                        Mã GD
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">
                        Công việc
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">
                        SV
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-500 uppercase">
                        Thù lao
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-bold text-slate-500 uppercase">
                        Phí
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-slate-500 uppercase">
                        Ngày
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.chi_tiet.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="py-2.5 px-3 text-xs font-mono text-slate-500">
                          {t.ma_giao_dich}
                        </td>
                        <td className="py-2.5 px-3 truncate max-w-[200px]">
                          {t.tieu_de}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-sm">{t.ho_ten}</div>
                          <div className="text-[10px] text-slate-400">
                            {t.ma_sinh_vien}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                          {fmtMoney(t.so_tien)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-xs text-amber-600">
                          {t.phi_dich_vu > 0 ? fmtMoney(t.phi_dich_vu) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-xs">
                          {STATUS_LABEL[t.trang_thai] || t.trang_thai}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500">
                          {t.ngay_giai_ngan
                            ? fmtDate(t.ngay_giai_ngan)
                            : fmtDate(t.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
  sub: string;
  icon: React.ReactNode;
  color: "sky" | "amber" | "emerald" | "purple";
}) {
  const colors = {
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold text-slate-900 truncate">{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
    </div>
  );
}