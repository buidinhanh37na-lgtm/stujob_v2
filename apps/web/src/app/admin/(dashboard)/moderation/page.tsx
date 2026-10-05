"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Shield, AlertTriangle, CheckCircle2, XCircle, Search,
  Sparkles, Eye, X, Building2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDateTime } from "@/lib/utils";

interface JobItem {
  id: number;
  tieu_de: string;
  mo_ta: string | null;
  ky_nang_can: string | null;
  luong_min: number;
  luong_max: number;
  trang_thai: string;
  created_at: string;
  ntd_id: number;
  ten_cong_ty: string;
  diem_rui_ro: number;
  tu_khoa_phat_hien: string;
  goi_y: string;
  kd_id: number | null;
  kd_hanh_dong: string | null;
}

interface Analysis {
  job: {
    id: number;
    tieu_de: string;
    mo_ta: string | null;
    ky_nang_can: string | null;
    nha_tuyen_dung_id: number;
    ten_cong_ty: string;
  };
  risk: {
    diem: number;
    tu_khoa: string[];
    goi_y: string;
    nguong_chan: number;
    nguong_canh_bao: number;
  };
}

type Filter = "all" | "risky" | "warned" | "blocked";

export default function ModerationPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JobItem[]>([]);
  const [filter, setFilter] = useState<Filter>("risky");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [scanBusy, setScanBusy] = useState(false);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/admin/moderation/pending?filter=${filter}&q=${encodeURIComponent(search)}`
      );
      if (data.success) setItems(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, filter]);

  async function analyze(jobId: number) {
    setAnalysisLoading(true);
    setAnalysis(null);
    try {
      const { data } = await api.get(`/api/admin/moderation/analyze?job_id=${jobId}`);
      if (data.success) setAnalysis(data);
    } catch {
      toast.error("Lỗi phân tích");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function approve(id: number) {
    if (!confirm("Duyệt tin này?")) return;
    setBusyId(id);
    try {
      const { data } = await api.post("/api/admin/moderation/approve", {
        viec_lam_id: id,
        ly_do: "",
      });
      if (data.success) {
        toast.success(data.message);
        setAnalysis(null);
        load();
      } else toast.error(data.message);
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function block(item: JobItem) {
    const reason = prompt("Lý do chặn:", "Vi phạm chính sách nội dung");
    if (!reason) return;
    setBusyId(item.id);
    try {
      const { data } = await api.post("/api/admin/moderation/block", {
        viec_lam_id: item.id,
        ly_do: reason,
        diem_rui_ro: item.diem_rui_ro || 10,
        tu_khoa: item.tu_khoa_phat_hien || "",
      });
      if (data.success) {
        toast.success(data.message);
        setAnalysis(null);
        load();
      } else toast.error(data.message);
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function warn(item: JobItem) {
    const reason = prompt(
      "Lý do cảnh báo:",
      "Nội dung có dấu hiệu không phù hợp"
    );
    if (!reason) return;
    setBusyId(item.id);
    try {
      const { data } = await api.post("/api/admin/moderation/warn", {
        viec_lam_id: item.id,
        ly_do: reason,
        diem_rui_ro: item.diem_rui_ro || 5,
        tu_khoa: item.tu_khoa_phat_hien || "",
      });
      if (data.success) {
        toast.success(data.message);
        setAnalysis(null);
        load();
      } else toast.error(data.message);
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function autoScan() {
    if (!confirm("Quét tự động toàn bộ tin chưa kiểm duyệt?")) return;
    setScanBusy(true);
    try {
      const { data } = await api.post("/api/admin/moderation/auto-scan");
      if (data.success) {
        toast.success(data.message);
        load();
      } else toast.error(data.message);
    } catch {
      toast.error("Lỗi");
    } finally {
      setScanBusy(false);
    }
  }

  function riskBadge(score: number) {
    if (score >= 8)
      return { cls: "bg-red-100 text-red-700 border-red-200", icon: "🚨" };
    if (score >= 5)
      return { cls: "bg-amber-100 text-amber-700 border-amber-200", icon: "⚠️" };
    return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" };
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kiểm duyệt tin việc</h2>
          <p className="text-slate-500 text-sm mt-1">
            Phát hiện tin có dấu hiệu lừa đảo hoặc không phù hợp
          </p>
        </div>
        <button
          onClick={autoScan}
          disabled={scanBusy}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 disabled:opacity-60 transition"
        >
          {scanBusy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Quét tự động
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { v: "risky" as Filter, label: "🚨 Rủi ro cao" },
          { v: "warned" as Filter, label: "⚠️ Đã cảnh báo" },
          { v: "blocked" as Filter, label: "🚫 Đã chặn" },
          { v: "all" as Filter, label: "Tất cả" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              filter === f.v
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1 min-w-[200px] relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Tìm tiêu đề, NTD..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Shield className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có tin nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const rb = riskBadge(it.diem_rui_ro);
            return (
              <div
                key={it.id}
                className={`bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition border-l-4 ${
                  it.diem_rui_ro >= 8
                    ? "border-l-red-500"
                    : it.diem_rui_ro >= 5
                      ? "border-l-amber-500"
                      : "border-l-emerald-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 mb-1">
                      {it.tieu_de}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {it.ten_cong_ty}
                      </span>
                      <span>•</span>
                      <span>{fmtDateTime(it.created_at)}</span>
                    </div>
                    {it.mo_ta && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {it.mo_ta}
                      </p>
                    )}
                    {it.tu_khoa_phat_hien && (
                      <div className="text-xs text-red-600 mt-2">
                        ⚠️ Từ khóa: <b>{it.tu_khoa_phat_hien}</b>
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${rb.cls}`}
                  >
                    {rb.icon} {it.diem_rui_ro}/10
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => analyze(it.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Phân tích
                  </button>
                  <button
                    onClick={() => approve(it.id)}
                    disabled={busyId === it.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Duyệt
                  </button>
                  <button
                    onClick={() => warn(it)}
                    disabled={busyId === it.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition disabled:opacity-60"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Cảnh báo
                  </button>
                  <button
                    onClick={() => block(it)}
                    disabled={busyId === it.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Chặn
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analysis modal */}
      {(analysis || analysisLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setAnalysis(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {analysisLoading || !analysis ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                <p className="text-sm text-slate-500 mt-2">Đang phân tích...</p>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-lg">Phân tích rủi ro</h3>
                  <button
                    onClick={() => setAnalysis(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="text-sm font-semibold">
                    {analysis.job.tieu_de}
                  </div>

                  <div className="text-center py-4">
                    <div
                      className={`text-5xl font-extrabold ${
                        analysis.risk.diem >= 8
                          ? "text-red-500"
                          : analysis.risk.diem >= 5
                            ? "text-amber-500"
                            : "text-emerald-500"
                      }`}
                    >
                      {analysis.risk.diem}
                      <span className="text-2xl text-slate-300">/10</span>
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Điểm rủi ro
                    </div>
                  </div>

                  {analysis.risk.tu_khoa.length > 0 ? (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                      <div className="text-xs font-bold text-red-800 mb-1">
                        🚨 Từ khóa phát hiện
                      </div>
                      <div className="text-sm text-red-700">
                        {analysis.risk.tu_khoa.join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
                      ✅ Không phát hiện từ khóa rủi ro
                    </div>
                  )}

                  <div className="text-xs text-slate-500">
                    Ngưỡng chặn: <b>{analysis.risk.nguong_chan}</b> • Ngưỡng
                    cảnh báo: <b>{analysis.risk.nguong_canh_bao}</b>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}