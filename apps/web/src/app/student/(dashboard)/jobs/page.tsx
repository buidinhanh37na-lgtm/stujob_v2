"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Briefcase, Building2, Clock, Calendar,
  Wallet, Send, CheckCircle, XCircle,
} from "lucide-react";

import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDate, thuName } from "@/lib/utils";

interface Job {
  id: number;
  nha_tuyen_dung_id: number;
  tieu_de: string;
  mo_ta: string | null;
  ky_nang_can: string | null;
  luong_min: number;
  luong_max: number;
  don_vi_luong: string | null;
  loai_cong_viec: string;
  thu_lam_viec: string | null;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  han_chot: string | null;
  han_nop_file: string | null;
  ngay_bat_dau: string | null;
  ngay_ket_thuc: string | null;
  dia_chi_lam_viec: string | null;
  ten_cong_ty: string;
  ten_nhom: string | null;
  icon: string | null;
  diem_phu_hop: number;
  chi_tiet_diem: {
    thoi_gian: number;
    ky_nang: number;
    chuyen_nganh: number;
  } | null;
}

type Tab = "phuhop" | "tatca";
type Filter = "all" | "remote" | "onsite" | "hybrid";

export default function JobsPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("phuhop");
  const [filter, setFilter] = useState<Filter>("all");

  const [jobsFit, setJobsFit] = useState<Job[]>([]);
  const [jobsAll, setJobsAll] = useState<Job[]>([]);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [appliedStatus, setAppliedStatus] = useState<Record<number, string>>({});

  async function loadJobs() {
    try {
      const { data } = await api.get("/api/student/jobs");
      if (data.success) {
        setJobsFit(data.phu_hop || []);
        setJobsAll(data.tat_ca || []);
        setAppliedIds(data.da_ung_tuyen || []);
        setAppliedStatus(data.trang_thai_ung_tuyen || {});
      }
    } catch {
      toast.error("Không tải được việc làm");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadJobs();
  }, [authLoading]);

  async function handleApply(jobId: number) {
    if (!confirm("Ứng tuyển công việc này?")) return;
    try {
      const { data } = await api.post("/api/student/applications", {
        viec_lam_id: jobId,
      });
      if (data.success) {
        toast.success("Đã gửi ứng tuyển!");
        await loadJobs();
      } else {
        toast.error(data.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Lỗi");
    }
  }

  function renderJobCard(j: Job) {
    const applied = appliedIds.includes(j.id);
    const status = appliedStatus[j.id];
    const canChat = status === "da_chap_nhan" || status === "hoan_thanh";

    const skillTags = (j.ky_nang_can || "")
      .split(",")
      .filter(Boolean)
      .slice(0, 4)
      .map((s, i) => (
        <span
          key={i}
          className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs"
        >
          {s.trim()}
        </span>
      ));

    const dayTags = (j.thu_lam_viec || "")
      .split(",")
      .filter(Boolean)
      .map((d, i) => (
        <span
          key={i}
          className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs"
        >
          {thuName(parseInt(d, 10))}
        </span>
      ));

    // Match badge
    let matchBadge = null;
    if (j.diem_phu_hop > 0) {
      const cls =
        j.diem_phu_hop >= 80
          ? "bg-emerald-100 text-emerald-800"
          : j.diem_phu_hop >= 65
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";
      const icon = j.diem_phu_hop >= 80 ? "🎯" : j.diem_phu_hop >= 65 ? "👍" : "📌";
      let tooltip = "";
      if (j.chi_tiet_diem) {
        tooltip = `Thời gian: ${j.chi_tiet_diem.thoi_gian}/40 | Kỹ năng: ${j.chi_tiet_diem.ky_nang}/35 | Chuyên ngành: ${j.chi_tiet_diem.chuyen_nganh}/25`;
      }
      matchBadge = (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}
          title={tooltip}
        >
          {icon} {j.diem_phu_hop}%
        </span>
      );
    }

    // Type badge
    const typeMap: Record<string, { label: string; cls: string }> = {
      remote: { label: "🌐 Online", cls: "bg-blue-50 text-blue-700" },
      onsite: { label: "🏢 Offline", cls: "bg-orange-50 text-orange-700" },
      hybrid: { label: "🔀 Kết hợp", cls: "bg-purple-50 text-purple-700" },
    };
    const typeInfo = typeMap[j.loai_cong_viec] || typeMap.remote;

    // Salary
    const salary =
      j.luong_min === j.luong_max
        ? fmtMoney(j.luong_min)
        : `${fmtMoney(j.luong_min)} - ${fmtMoney(j.luong_max)}`;

    // Action button
    let actionBtn = null;
    if (!applied) {
      actionBtn = (
        <button
          onClick={() => handleApply(j.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
        >
          <Send className="w-3.5 h-3.5" />
          Ứng tuyển
        </button>
      );
    } else if (status === "cho_duyet") {
      actionBtn = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          Chờ duyệt
        </span>
      );
    } else if (status === "tu_choi") {
      actionBtn = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5" />
          Từ chối
        </span>
      );
    } else if (canChat) {
      actionBtn = (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          Đã nhận
        </span>
      );
    }

    const initial = (j.ten_cong_ty || "?").charAt(0).toUpperCase();

    return (
      <div
        key={j.id}
        className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-emerald-200 transition"
      >
        <div className="flex gap-4">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initial}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{j.tieu_de}</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{j.ten_cong_ty}</span>
                </div>
              </div>
              {matchBadge}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 my-3">
              <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.cls}`}>
                {typeInfo.label}
              </span>
              {dayTags}
              {j.gio_bat_dau && j.gio_ket_thuc && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                  <Clock className="w-3 h-3" />
                  {j.gio_bat_dau}-{j.gio_ket_thuc}
                </span>
              )}
            </div>

            {/* Desc */}
            {j.mo_ta && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{j.mo_ta}</p>
            )}

            {/* Skills */}
            {skillTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">{skillTags}</div>
            )}

            {/* Meta + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Wallet className="w-3.5 h-3.5" />
                  {salary}
                </span>
                {j.han_chot && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Hạn: {fmtDate(j.han_chot)}
                  </span>
                )}
              </div>
              {actionBtn}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  // Filter
  const filterFn = (j: Job) =>
    filter === "all" || j.loai_cong_viec === filter;

  const fitFiltered = jobsFit.filter(filterFn);
  const allFiltered = jobsAll.filter(filterFn);

  const currentList = tab === "phuhop" ? fitFiltered : allFiltered;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Việc làm</h2>
        <p className="text-slate-500 text-sm mt-1">
          Khám phá cơ hội việc làm phù hợp với bạn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("phuhop")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
            tab === "phuhop"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          ⭐ Đề xuất phù hợp ({jobsFit.length})
        </button>
        <button
          onClick={() => setTab("tatca")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
            tab === "tatca"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          📢 Tất cả ({jobsAll.length})
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {([
          { value: "all" as Filter, label: "📋 Tất cả" },
          { value: "remote" as Filter, label: "🌐 Online" },
          { value: "onsite" as Filter, label: "🏢 Offline" },
          { value: "hybrid" as Filter, label: "🔀 Kết hợp" },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              filter === f.value
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {tab === "phuhop"
              ? "Chưa có việc phù hợp. Hãy cập nhật hồ sơ & lịch học để nhận gợi ý tốt hơn."
              : "Không có việc làm nào"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">{currentList.map(renderJobCard)}</div>
      )}
    </div>
  );
}