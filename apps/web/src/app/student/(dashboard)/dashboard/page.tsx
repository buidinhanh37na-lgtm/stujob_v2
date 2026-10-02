"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Briefcase, Wallet, ClipboardList, Send, ArrowRight,
} from "lucide-react";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";
import { fmtMoney } from "@/lib/utils";

export default function StudentDashboardPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");
  const sinhVien = useAuthStore((s) => s.sinhVien);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    fitJobs: 0,
    balance: 0,
    tasks: 0,
    applied: 0,
  });
  const [topJobs, setTopJobs] = useState<TopJob[]>([]);
  interface TopJob {
  id: number;
  tieu_de: string;
  ten_cong_ty: string;
  luong_min: number;
  diem_phu_hop: number;
}

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const [jobsRes, walletRes] = await Promise.all([
          api.get("/api/student/jobs"),
          api.get("/api/student/wallet").catch(() => ({ data: { so_du: 0 } })),
        ]);

        setStats({
          fitJobs: jobsRes.data.phu_hop?.length || 0,
          balance: walletRes.data.so_du || 0,
          tasks: 0,
          applied: jobsRes.data.da_ung_tuyen?.length || 0,
        });
        setTopJobs((jobsRes.data.phu_hop || []).slice(0, 3));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  if (authLoading || !sinhVien) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1 break-words">
          Xin chào, {sinhVien.ho_ten}! 👋
        </h2>
        <p className="text-emerald-50 text-sm">
          MSSV: {sinhVien.ma_sinh_vien} •{" "}
          {sinhVien.truong || "Chưa cập nhật trường"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Việc phù hợp"
          value={stats.fitJobs.toString()}
          icon={<Briefcase className="w-5 h-5" />}
          color="emerald"
          href="/student/jobs"
        />
        <StatCard
          label="Số dư ví"
          value={fmtMoney(stats.balance)}
          icon={<Wallet className="w-5 h-5" />}
          color="blue"
          href="/student/wallet"
        />
        <StatCard
          label="Nhiệm vụ"
          value={stats.tasks.toString()}
          icon={<ClipboardList className="w-5 h-5" />}
          color="amber"
          href="/student/tasks"
        />
        <StatCard
          label="Đã ứng tuyển"
          value={stats.applied.toString()}
          icon={<Send className="w-5 h-5" />}
          color="purple"
          href="/student/applications"
        />
      </div>

      {/* Top jobs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            ⚡ Việc làm phù hợp với bạn
          </h3>
          <Link
            href="/student/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải...
          </div>
        ) : topJobs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Chưa có việc phù hợp</p>
            <Link
              href="/student/profile"
              className="text-xs text-emerald-600 hover:underline mt-1 inline-block"
            >
              Cập nhật hồ sơ để nhận gợi ý →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {topJobs.map((j) => (
              <Link
                key={j.id}
                href="/student/jobs"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {(j.ten_cong_ty || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {j.tieu_de}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {j.ten_cong_ty} • {fmtMoney(j.luong_min)}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex-shrink-0">
                  {j.diem_phu_hop}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "amber" | "purple";
  href: string;
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-md hover:border-slate-300 transition block"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </Link>
  );
}