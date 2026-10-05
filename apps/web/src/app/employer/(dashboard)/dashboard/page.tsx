"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Briefcase, Send, Shield, Users, ArrowRight, Star,
} from "lucide-react";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";
import { fmtMoney } from "@/lib/utils";

interface AppItem {
  id: number;
  sinh_vien_id: number;
  ho_ten: string;
  ma_sinh_vien: string | null;
  truong: string | null;
  diem_danh_gia: number;
  so_lan_danh_gia: number;
  viec_lam_id: number;
  tieu_de: string;
  trang_thai: string;
  created_at: string;
  ky_nang: string[];
}

interface Stats {
  open_jobs: number;
  pending_apps: number;
  total_escrow: number;
  working_count: number;
}

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  cho_duyet: { cls: "bg-amber-100 text-amber-800", label: "⏳ Chờ duyệt" },
  da_chap_nhan: { cls: "bg-emerald-100 text-emerald-800", label: "✅ Đã nhận" },
  tu_choi: { cls: "bg-red-100 text-red-700", label: "❌ Từ chối" },
  hoan_thanh: { cls: "bg-purple-100 text-purple-800", label: "🎉 Hoàn thành" },
};

export default function EmployerDashboardPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");
  const nhaTuyenDung = useAuthStore((s) => s.nhaTuyenDung);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    open_jobs: 0,
    pending_apps: 0,
    total_escrow: 0,
    working_count: 0,
  });
  const [apps, setApps] = useState<AppItem[]>([]);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const { data } = await api.get("/api/employer/dashboard");
        if (data.success) {
          setStats(data.stats);
          setApps(data.recent_apps || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  if (authLoading || !nhaTuyenDung) {
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
      <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1 break-words">
          Xin chào, {nhaTuyenDung.ten_cong_ty}! 🏢
        </h2>
        <p className="text-sky-50 text-sm">
          {nhaTuyenDung.linh_vuc || "Chưa cập nhật lĩnh vực"} •{" "}
          {nhaTuyenDung.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tin đang mở"
          value={stats.open_jobs.toString()}
          icon={<Briefcase className="w-5 h-5" />}
          color="sky"
          href="/employer/my-jobs"
        />
        <StatCard
          label="Ứng tuyển mới"
          value={stats.pending_apps.toString()}
          icon={<Send className="w-5 h-5" />}
          color="amber"
          href="/employer/applications"
        />
        <StatCard
          label="Bảo đảm đã ký"
          value={fmtMoney(stats.total_escrow)}
          icon={<Shield className="w-5 h-5" />}
          color="emerald"
          href="/employer/escrow"
        />
        <StatCard
          label="SV đang làm"
          value={stats.working_count.toString()}
          icon={<Users className="w-5 h-5" />}
          color="purple"
          href="/employer/applications"
        />
      </div>

      {/* Recent applications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            ⚡ Ứng tuyển mới nhất
          </h3>
          <Link
            href="/employer/applications"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:underline"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải...
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Chưa có ứng tuyển nào</p>
            <Link
              href="/employer/post-job"
              className="text-xs text-sky-600 hover:underline mt-1 inline-block"
            >
              Đăng tin để nhận ứng viên →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {apps.map((a) => {
              const st = STATUS_MAP[a.trang_thai] || STATUS_MAP.cho_duyet;
              const initial = (a.ho_ten || "?").charAt(0).toUpperCase();
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-sky-200 transition"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {a.ho_ten}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {a.ma_sinh_vien} • {a.truong || "Chưa cập nhật"}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(a.diem_danh_gia)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({a.so_lan_danh_gia})
                      </span>
                    </div>
                    {a.ky_nang.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {a.ky_nang.slice(0, 2).map((k, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
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
  color: "sky" | "amber" | "emerald" | "purple";
  href: string;
}) {
  const colors = {
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-md hover:border-slate-300 transition block"
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