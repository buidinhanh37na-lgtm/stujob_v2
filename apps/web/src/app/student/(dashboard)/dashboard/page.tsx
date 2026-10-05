"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Briefcase,
  Send,
  Wallet,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";
import { fmtMoney } from "@/lib/utils";
import { StaggerList, StaggerItem, FadeIn } from "@/components/motion";

interface Stats {
  so_viec_phu_hop: number;
  so_da_ung_tuyen: number;
  so_dang_lam: number;
  so_du_vi: number;
}

interface JobPreview {
  id: number;
  tieu_de: string;
  ten_cong_ty: string;
  luong_min: number;
  luong_max: number;
  diem_phu_hop: number;
  loai_cong_viec: string;
}

export default function StudentDashboardPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");
  const sinhVien = useAuthStore((s) => s.sinhVien);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    so_viec_phu_hop: 0,
    so_da_ung_tuyen: 0,
    so_dang_lam: 0,
    so_du_vi: 0,
  });
  const [jobs, setJobs] = useState<JobPreview[]>([]);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const jobsRes = await api.get("/api/student/jobs");
        if (jobsRes.data.success) {
          const fit = jobsRes.data.phu_hop || [];
          setJobs(fit.slice(0, 4));
          setStats((s) => ({ ...s, so_viec_phu_hop: fit.length }));
        }

        const walletRes = await api.get("/api/student/wallet");
        if (walletRes.data.success) {
          setStats((s) => ({ ...s, so_du_vi: walletRes.data.so_du || 0 }));
        }

        const appRes = await api.get("/api/student/applications");
        if (appRes.data.success) {
          setStats((s) => ({
            ...s,
            so_da_ung_tuyen: appRes.data.items?.length || 0,
          }));
        }

        const taskRes = await api.get("/api/student/tasks");
        if (taskRes.data.success) {
          const items = taskRes.data.items || [];
          setStats((s) => ({
            ...s,
            so_dang_lam: items.filter(
              (t: { trang_thai: string }) => t.trang_thai === "dang_lam"
            ).length,
          }));
        }
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
      <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1 break-words">
          Xin chào, {sinhVien.ho_ten}! 🎓
        </h2>
        <p className="text-indigo-50 text-sm">
          {sinhVien.truong || "Chưa cập nhật trường"} • {sinhVien.email}
        </p>
      </div>

      {/* Stats */}
      <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard
            label="Việc phù hợp"
            value={stats.so_viec_phu_hop.toString()}
            icon={<Briefcase className="w-5 h-5" />}
            color="indigo"
            href="/student/jobs"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Đã ứng tuyển"
            value={stats.so_da_ung_tuyen.toString()}
            icon={<Send className="w-5 h-5" />}
            color="purple"
            href="/student/applications"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Đang làm"
            value={stats.so_dang_lam.toString()}
            icon={<ClipboardList className="w-5 h-5" />}
            color="emerald"
            href="/student/tasks"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Số dư ví"
            value={fmtMoney(stats.so_du_vi)}
            icon={<Wallet className="w-5 h-5" />}
            color="amber"
            href="/student/wallet"
          />
        </StaggerItem>
      </StaggerList>

      {/* Jobs phù hợp */}
      <FadeIn delay={0.15}>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              ⭐ Việc làm phù hợp với bạn
            </h3>
            <Link
              href="/student/jobs"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Đang tải...
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Chưa có việc làm phù hợp</p>
              <Link
                href="/student/profile"
                className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
              >
                Cập nhật hồ sơ để nhận gợi ý tốt hơn →
              </Link>
            </div>
          ) : (
            <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jobs.map((j) => (
                <StaggerItem key={j.id}>
                  <Link
                    href="/student/jobs"
                    className="block p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition h-full"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-semibold text-sm text-slate-900 line-clamp-1">
                        {j.tieu_de}
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex-shrink-0">
                        🎯 {j.diem_phu_hop}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {j.ten_cong_ty}
                    </div>
                    <div className="text-sm text-emerald-700 font-semibold mt-1">
                      💰{" "}
                      {j.luong_min === j.luong_max
                        ? fmtMoney(j.luong_min)
                        : `${fmtMoney(j.luong_min)} - ${fmtMoney(j.luong_max)}`}
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </FadeIn>
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
  color: "indigo" | "purple" | "emerald" | "amber";
  href: string;
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-md hover:border-slate-300 transition block h-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </Link>
  );
}