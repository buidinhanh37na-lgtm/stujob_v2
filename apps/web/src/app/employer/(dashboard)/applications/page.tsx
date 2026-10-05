"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Send, Star, GraduationCap, Check, X, Eye,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface Application {
  id: number;
  sinh_vien_id: number;
  viec_lam_id: number;
  loai: string;
  trang_thai: string;
  created_at: string;
  ho_ten: string;
  ma_sinh_vien: string | null;
  truong: string | null;
  gpa: number | null;
  diem_danh_gia: number;
  so_lan_danh_gia: number;
  tieu_de: string;
  luong_min: number;
  luong_max: number;
  ky_nang: string[];
}

interface CandidateDetail {
  id: number;
  ho_ten: string;
  ma_sinh_vien: string;
  email: string;
  so_dien_thoai: string | null;
  truong: string | null;
  khoa: string | null;
  chuyen_nganh: string | null;
  nam_hoc: number | null;
  gpa: number | null;
  mo_ta: string | null;
  diem_danh_gia: number;
  so_lan_danh_gia: number;
  ky_nang: Array<{ ten_ky_nang: string; muc_do: string | null }>;
  chung_chi: Array<{ id: number; ten_chung_chi: string }>;
}

type Tab = "cho_duyet" | "da_chap_nhan" | "tu_choi" | "all";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  cho_duyet: { label: "⏳ Chờ duyệt", cls: "bg-amber-100 text-amber-800" },
  da_chap_nhan: { label: "✅ Đã nhận", cls: "bg-emerald-100 text-emerald-800" },
  tu_choi: { label: "❌ Từ chối", cls: "bg-red-100 text-red-700" },
  hoan_thanh: { label: "🎉 Hoàn thành", cls: "bg-purple-100 text-purple-800" },
};

export default function EmployerApplicationsPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [tab, setTab] = useState<Tab>("cho_duyet");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/employer/applications");
      if (data.success) setApps(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function approve(id: number) {
    if (!confirm("Duyệt ứng viên và tạo escrow? Bạn cần ký quỹ sau đó.")) return;
    setBusyId(id);
    try {
      const { data } = await api.post("/api/employer/applications/approve", {
        ung_tuyen_id: id,
      });
      if (data.success) {
        toast.success(data.message);
        load();
        setTimeout(() => {
          window.location.href = "/employer/escrow";
        }, 800);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: number) {
    if (!confirm("Từ chối ứng viên này?")) return;
    setBusyId(id);
    try {
      const { data } = await api.post("/api/employer/applications/reject", {
        ung_tuyen_id: id,
      });
      if (data.success) {
        toast.success("Đã từ chối");
        load();
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function viewDetail(svId: number) {
  try {
    const { data } = await api.get(
      `/api/employer/applications/candidate/${svId}`
    );
    if (data.success) setDetail(data.sinh_vien);
  } catch {
    toast.error("Không tải được hồ sơ");
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
    all: apps.length,
    cho_duyet: apps.filter((a) => a.trang_thai === "cho_duyet").length,
    da_chap_nhan: apps.filter((a) => a.trang_thai === "da_chap_nhan").length,
    tu_choi: apps.filter((a) => a.trang_thai === "tu_choi").length,
  };

  const filtered =
    tab === "all" ? apps : apps.filter((a) => a.trang_thai === tab);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Ứng tuyển</h2>
        <p className="text-slate-500 text-sm mt-1">
          Xem và duyệt các ứng viên ứng tuyển vào tin của bạn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: "cho_duyet" as Tab, label: `⏳ Chờ duyệt (${counts.cho_duyet})` },
          { v: "da_chap_nhan" as Tab, label: `✅ Đã nhận (${counts.da_chap_nhan})` },
          { v: "tu_choi" as Tab, label: `❌ Từ chối (${counts.tu_choi})` },
          { v: "all" as Tab, label: `Tất cả (${counts.all})` },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setTab(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              tab === f.v
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Send className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có ứng tuyển nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => {
            const st = STATUS_MAP[a.trang_thai] || STATUS_MAP.cho_duyet;
            const initial = (a.ho_ten || "?").charAt(0).toUpperCase();
            const canApprove = a.trang_thai === "cho_duyet";
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {a.ho_ten}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {a.ma_sinh_vien} • {a.truong || "—"}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold">
                        {a.diem_danh_gia.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({a.so_lan_danh_gia})
                      </span>
                      {a.gpa !== null && (
                        <>
                          <span className="mx-1 text-slate-300">•</span>
                          <GraduationCap className="w-3 h-3 text-blue-500" />
                          <span className="text-xs">GPA {a.gpa.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border-l-2 border-sky-400">
                  <div className="text-xs text-slate-500">Ứng tuyển vào:</div>
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {a.tieu_de}
                  </div>
                </div>

                {a.ky_nang.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.ky_nang.slice(0, 4).map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => viewDetail(a.sinh_vien_id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Hồ sơ
                  </button>
                  {canApprove && (
                    <>
                      <button
                        onClick={() => approve(a.id)}
                        disabled={busyId === a.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-60"
                      >
                        {busyId === a.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Duyệt
                      </button>
                      <button
                        onClick={() => reject(a.id)}
                        disabled={busyId === a.id}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition disabled:opacity-60"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {(detail.ho_ten || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">{detail.ho_ten}</div>
                <div className="text-xs text-slate-500">
                  {detail.ma_sinh_vien} • {detail.truong || "Chưa cập nhật"}
                </div>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Info label="Email" value={detail.email} />
                <Info label="SĐT" value={detail.so_dien_thoai || "—"} />
                <Info label="Khoa" value={detail.khoa || "—"} />
                <Info label="Ngành" value={detail.chuyen_nganh || "—"} />
                <Info label="Năm học" value={detail.nam_hoc?.toString() || "—"} />
                <Info
                  label="GPA"
                  value={detail.gpa != null ? Number(detail.gpa).toFixed(2) : "—"}
                />
              </div>
              {detail.ky_nang.length > 0 && (
                <div>
                  <div className="font-semibold mb-2">🛠️ Kỹ năng</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.ky_nang.map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs"
                      >
                        {k.ten_ky_nang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detail.mo_ta && (
                <div>
                  <div className="font-semibold mb-2">📝 Giới thiệu</div>
                  <div className="bg-slate-50 p-3 rounded-xl whitespace-pre-line">
                    {detail.mo_ta}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}