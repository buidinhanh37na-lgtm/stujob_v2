"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Briefcase, Users, Wallet, Calendar, MapPin,
  Eye, Trash2, Lock, Unlock, Plus,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDate } from "@/lib/utils";

interface Job {
  id: number;
  tieu_de: string;
  mo_ta: string | null;
  ky_nang_can: string | null;
  luong_min: number;
  luong_max: number;
  loai_cong_viec: string;
  so_luong_can: number;
  so_buoi: number;
  gio_uoc_tinh: number;
  han_chot: string | null;
  han_nop_file: string | null;
  ngay_bat_dau: string | null;
  ngay_ket_thuc: string | null;
  dia_chi_lam_viec: string | null;
  phi_dich_vu: number;
  trang_thai: string;
  created_at: string;
  so_ung_tuyen: number;
  ten_nhom: string | null;
  icon: string | null;
}

type Status = "all" | "dang_mo" | "da_dong";

export default function MyJobsPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<Status>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/employer/my-jobs?status=${status}`
      );
      if (data.success) setJobs(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, status]);

  async function toggleStatus(job: Job) {
    const newStatus = job.trang_thai === "dang_mo" ? "da_dong" : "dang_mo";
    const action = newStatus === "da_dong" ? "đóng" : "mở lại";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} tin "${job.tieu_de}"?`))
      return;

    setBusyId(job.id);
    try {
      const { data } = await api.put("/api/employer/my-jobs", {
        id: job.id,
        trang_thai: newStatus,
      });
      if (data.success) {
        toast.success(data.message);
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(job: Job) {
    if (job.so_ung_tuyen > 0) {
      toast.error(`Không thể xóa: đã có ${job.so_ung_tuyen} ứng tuyển`);
      return;
    }
    if (!confirm(`Xóa vĩnh viễn tin "${job.tieu_de}"?`)) return;

    setBusyId(job.id);
    try {
      const { data } = await api.delete(`/api/employer/my-jobs/${job.id}`);
      if (data.success) {
        toast.success("Đã xóa");
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  const counts = {
    all: jobs.length,
    dang_mo: jobs.filter((j) => j.trang_thai === "dang_mo").length,
    da_dong: jobs.filter((j) => j.trang_thai === "da_dong").length,
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tin việc của tôi</h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý các tin tuyển dụng đã đăng
          </p>
        </div>
        <Link
          href="/employer/post-job"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Đăng tin mới
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: "all" as Status, label: `Tất cả (${counts.all})` },
          { v: "dang_mo" as Status, label: `🟢 Đang mở (${counts.dang_mo})` },
          { v: "da_dong" as Status, label: `🔴 Đã đóng (${counts.da_dong})` },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setStatus(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              status === f.v
                ? "border-sky-600 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có tin việc nào</p>
          <Link
            href="/employer/post-job"
            className="inline-block mt-3 text-sm text-sky-600 hover:underline font-medium"
          >
            Đăng tin đầu tiên →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => {
            const isOpen = j.trang_thai === "dang_mo";
            const salary =
              j.luong_min === j.luong_max
                ? fmtMoney(j.luong_min)
                : `${fmtMoney(j.luong_min)} - ${fmtMoney(j.luong_max)}`;

            const typeMap: Record<string, string> = {
              remote: "🌐 Online",
              onsite: "🏢 Offline",
            };

            return (
              <div
                key={j.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br ${
                      isOpen
                        ? "from-sky-500 to-indigo-600"
                        : "from-slate-400 to-slate-500"
                    }`}
                  >
                    <Briefcase className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {j.tieu_de}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          {j.icon && <span>{j.icon}</span>}
                          <span>{j.ten_nhom || "Khác"}</span>
                          <span>•</span>
                          <span>Đăng {fmtDate(j.created_at)}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          isOpen
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {isOpen ? "🟢 Đang mở" : "🔴 Đã đóng"}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 my-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                        {typeMap[j.loai_cong_viec] || j.loai_cong_viec}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        {salary}
                      </span>
                      {j.so_luong_can > 1 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                          👥 {j.so_luong_can} người
                        </span>
                      )}
                      {j.han_chot && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Hạn {fmtDate(j.han_chot)}
                        </span>
                      )}
                      {j.dia_chi_lam_viec && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs inline-flex items-center gap-1 max-w-[200px] truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{j.dia_chi_lam_viec}</span>
                        </span>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-sm mt-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-600" />
                        <span className="font-semibold text-slate-900">
                          {j.so_ung_tuyen}
                        </span>
                        <span className="text-slate-500 text-xs">ứng tuyển</span>
                      </div>
                      {j.phi_dich_vu > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">
                            Phí DV:
                          </span>
                          <span className="text-xs font-semibold text-red-600">
                            {fmtMoney(j.phi_dich_vu)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                      {j.so_ung_tuyen > 0 && (
                        <Link
                          href={`/employer/applications?job_id=${j.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem {j.so_ung_tuyen} ứng viên
                        </Link>
                      )}
                      <button
                        onClick={() => toggleStatus(j)}
                        disabled={busyId === j.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
                          isOpen
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {busyId === j.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isOpen ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        {isOpen ? "Đóng tin" : "Mở lại"}
                      </button>
                      <button
                        onClick={() => handleDelete(j)}
                        disabled={busyId === j.id || j.so_ung_tuyen > 0}
                        title={
                          j.so_ung_tuyen > 0
                            ? `Không thể xóa khi có ${j.so_ung_tuyen} ứng tuyển`
                            : "Xóa tin"
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}