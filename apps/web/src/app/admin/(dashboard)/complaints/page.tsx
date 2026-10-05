"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, AlertTriangle, Search, Eye, X, Check, Lock,  Scale, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDateTime } from "@/lib/utils";

interface Complaint {
  id: number;
  tieu_de: string;
  noi_dung: string | null;
  bang_chung: string | null;
  trang_thai: string;
  uu_tien: string;
  nguoi_gui_loai: string;
  nguoi_gui_id: number;
  nguoi_gui_ten: string;
  doi_tuong_loai: string | null;
  doi_tuong_id: number | null;
  doi_tuong_ten: string;
  viec_lam_id: number | null;
  ten_viec: string;
  ket_qua: string | null;
  huong_xu_ly: string | null;
  so_tien_hoan: number;
  created_at: string;
  resolved_at: string | null;
}

interface Detail {
  khieu_nai: Complaint;
  escrow: {
    id: number;
    so_tien: number;
    phi_dich_vu: number;
    trang_thai: string;
    ma_giao_dich: string | null;
  } | null;
  lich_su_hoan_tien: Array<{
    id: number;
    so_tien: number;
    nguoi_nhan_loai: string;
    ly_do: string | null;
    created_at: string;
  }>;
}

interface Stats {
  khieu_nai: {
    cho_xu_ly: number;
    dang_xu_ly: number;
    da_giai_quyet: number;
    da_dong: number;
    khan_cap: number;
    cao: number;
    trung_binh: number;
    thap: number;
    tong: number;
  };
  tong_hoan_tien: number;
}

type StatusFilter = "all" | "cho_xu_ly" | "dang_xu_ly" | "da_giai_quyet" | "da_dong";
type PriorityFilter = "all" | "khan_cap" | "cao" | "trung_binh" | "thap";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  cho_xu_ly: { label: "⏳ Chờ xử lý", cls: "bg-amber-100 text-amber-800" },
  dang_xu_ly: { label: "🔄 Đang xử lý", cls: "bg-blue-100 text-blue-800" },
  da_giai_quyet: { label: "✅ Đã giải quyết", cls: "bg-emerald-100 text-emerald-800" },
  da_dong: { label: "🔒 Đã đóng", cls: "bg-slate-100 text-slate-700" },
};

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  khan_cap: { label: "🚨 Khẩn cấp", cls: "bg-red-100 text-red-700" },
  cao: { label: "⚠️ Cao", cls: "bg-amber-100 text-amber-700" },
  trung_binh: { label: "Trung bình", cls: "bg-blue-100 text-blue-700" },
  thap: { label: "Thấp", cls: "bg-slate-100 text-slate-600" },
};

export default function AdminComplaintsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showResolve, setShowResolve] = useState<Complaint | null>(null);
  const [resolveForm, setResolveForm] = useState({
    ket_qua: "",
    huong_xu_ly: "khong_hoan",
    so_tien_hoan: "0",
  });
  const [resolving, setResolving] = useState(false);

  async function loadStats() {
    try {
      const { data } = await api.get("/api/admin/complaints/stats");
      if (data.success) setStats(data);
    } catch {}
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/admin/complaints?status=${status}&priority=${priority}&q=${encodeURIComponent(search)}`
      );
      if (data.success) setItems(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      load();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, status, priority]);

  async function viewDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const { data } = await api.get(`/api/admin/complaints/detail?id=${id}`);
      if (data.success) setDetail(data);
    } catch {
      toast.error("Không tải được chi tiết");
    } finally {
      setDetailLoading(false);
    }
  }

  async function take(id: number) {
    const priorities = ["thap", "trung_binh", "cao", "khan_cap"];
    const p = prompt(
      "Mức ưu tiên (thap/trung_binh/cao/khan_cap):",
      "trung_binh"
    );
    if (!p || !priorities.includes(p)) return;

    setBusyId(id);
    try {
      const { data } = await api.post("/api/admin/complaints/take", {
        id,
        uu_tien: p,
      });
      if (data.success) {
        toast.success(data.message);
        load();
        loadStats();
      } else toast.error(data.message);
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function closeComplaint(id: number) {
    const reason = prompt("Lý do đóng:", "Đóng khiếu nại");
    if (!reason) return;

    setBusyId(id);
    try {
      const { data } = await api.post("/api/admin/complaints/close", {
        id,
        ly_do: reason,
      });
      if (data.success) {
        toast.success(data.message);
        setDetail(null);
        load();
        loadStats();
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function submitResolve(e: FormEvent) {
    e.preventDefault();
    if (!showResolve) return;
    if (!resolveForm.ket_qua.trim())
      return toast.error("Vui lòng nhập kết quả");

    setResolving(true);
    try {
      const { data } = await api.post("/api/admin/complaints/resolve", {
        id: showResolve.id,
        ket_qua: resolveForm.ket_qua,
        huong_xu_ly: resolveForm.huong_xu_ly,
        so_tien_hoan: Number(resolveForm.so_tien_hoan) || 0,
      });
      if (data.success) {
        toast.success(data.message);
        setShowResolve(null);
        setDetail(null);
        load();
        loadStats();
      } else toast.error(data.message);
    } catch {
      toast.error("Lỗi");
    } finally {
      setResolving(false);
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

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Khiếu nại</h2>
        <p className="text-slate-500 text-sm mt-1">
          Xử lý tranh chấp giữa sinh viên và nhà tuyển dụng
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox label="Chờ xử lý" value={stats.khieu_nai.cho_xu_ly} color="amber" />
          <StatBox label="Đang xử lý" value={stats.khieu_nai.dang_xu_ly} color="blue" />
          <StatBox label="Đã giải quyết" value={stats.khieu_nai.da_giai_quyet} color="emerald" />
          <StatBox
            label="Tổng hoàn tiền"
            value={stats.tong_hoan_tien}
            color="purple"
            isMoney
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Tất cả</option>
              <option value="cho_xu_ly">⏳ Chờ xử lý</option>
              <option value="dang_xu_ly">🔄 Đang xử lý</option>
              <option value="da_giai_quyet">✅ Đã giải quyết</option>
              <option value="da_dong">🔒 Đã đóng</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Ưu tiên</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityFilter)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">Mọi mức</option>
              <option value="khan_cap">🚨 Khẩn cấp</option>
              <option value="cao">⚠️ Cao</option>
              <option value="trung_binh">Trung bình</option>
              <option value="thap">Thấp</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && load()}
                placeholder="Tìm tiêu đề, nội dung..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
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
          <AlertTriangle className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có khiếu nại nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((k) => {
            const st = STATUS_MAP[k.trang_thai] || STATUS_MAP.cho_xu_ly;
            const pr = PRIORITY_MAP[k.uu_tien] || PRIORITY_MAP.trung_binh;
            return (
              <div
                key={k.id}
                className={`bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition border-l-4 ${
                  k.uu_tien === "khan_cap"
                    ? "border-l-red-500"
                    : k.uu_tien === "cao"
                      ? "border-l-amber-500"
                      : "border-l-purple-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 mb-1">
                      {k.tieu_de}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                      <span>👤 {k.nguoi_gui_ten}</span>
                      <span>→</span>
                      <span>{k.doi_tuong_ten}</span>
                      {k.ten_viec && <span>• 📌 {k.ten_viec}</span>}
                    </div>
                    {k.noi_dung && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {k.noi_dung}
                      </p>
                    )}
                    <div className="text-xs text-slate-400 mt-2">
                      {fmtDateTime(k.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${pr.cls}`}>
                      {pr.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => viewDetail(k.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Chi tiết
                  </button>
                  {k.trang_thai === "cho_xu_ly" && (
                    <button
                      onClick={() => take(k.id)}
                      disabled={busyId === k.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition disabled:opacity-60"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Tiếp nhận
                    </button>
                  )}
                  {(k.trang_thai === "cho_xu_ly" || k.trang_thai === "dang_xu_ly") && (
                    <>
                      <button
                        onClick={() => {
                          setShowResolve(k);
                          setResolveForm({
                            ket_qua: "",
                            huong_xu_ly: "khong_hoan",
                            so_tien_hoan: "0",
                          });
                        }}
                        disabled={busyId === k.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-60"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        Hòa giải
                      </button>
                      <button
                        onClick={() => closeComplaint(k.id)}
                        disabled={busyId === k.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-60"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Đóng
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
      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">
                      Chi tiết khiếu nại #{detail.khieu_nai.id}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmtDateTime(detail.khieu_nai.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_MAP[detail.khieu_nai.trang_thai]?.cls}`}
                    >
                      {STATUS_MAP[detail.khieu_nai.trang_thai]?.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_MAP[detail.khieu_nai.uu_tien]?.cls}`}
                    >
                      {PRIORITY_MAP[detail.khieu_nai.uu_tien]?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Người gửi" value={detail.khieu_nai.nguoi_gui_ten} />
                    <Info label="Đối tượng" value={detail.khieu_nai.doi_tuong_ten} />
                    {detail.khieu_nai.ten_viec && (
                      <Info label="Công việc" value={detail.khieu_nai.ten_viec} />
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-base mb-1">
                      {detail.khieu_nai.tieu_de}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl text-slate-700 whitespace-pre-line">
                      {detail.khieu_nai.noi_dung}
                    </div>
                  </div>

                  {detail.khieu_nai.bang_chung && (
                    <div>
                      <div className="font-semibold mb-1">📎 Bằng chứng</div>
                      <div className="text-slate-700">{detail.khieu_nai.bang_chung}</div>
                    </div>
                  )}

                  {detail.escrow && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="font-semibold text-blue-800 mb-1">
                        💰 Escrow liên quan
                      </div>
                      <div className="text-xs text-blue-700">
                        Số tiền: <b>{fmtMoney(detail.escrow.so_tien)}</b> • Trạng thái:{" "}
                        <b>{detail.escrow.trang_thai}</b>
                      </div>
                    </div>
                  )}

                  {detail.khieu_nai.ket_qua && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="font-semibold text-emerald-800 mb-1">
                        ✅ Kết quả giải quyết
                      </div>
                      <div className="text-xs text-emerald-700 whitespace-pre-line">
                        {detail.khieu_nai.ket_qua}
                      </div>
                    </div>
                  )}

                  {detail.lich_su_hoan_tien.length > 0 && (
                    <div>
                      <div className="font-semibold mb-2">↩️ Lịch sử hoàn tiền</div>
                      <div className="space-y-2">
                        {detail.lich_su_hoan_tien.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs"
                          >
                            <Wallet className="w-4 h-4 text-emerald-600" />
                            <span>
                              <b>{fmtMoney(r.so_tien)}</b> cho{" "}
                              {r.nguoi_nhan_loai === "sinh_vien" ? "SV" : "NTD"}
                            </span>
                            <span className="text-slate-400 ml-auto">
                              {fmtDateTime(r.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(detail.khieu_nai.trang_thai === "cho_xu_ly" ||
                  detail.khieu_nai.trang_thai === "dang_xu_ly") && (
                  <div className="p-5 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                    {detail.khieu_nai.trang_thai === "cho_xu_ly" && (
                      <button
                        onClick={() => take(detail.khieu_nai.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold"
                      >
                        <Check className="w-4 h-4" />
                        Tiếp nhận
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowResolve(detail.khieu_nai);
                        setResolveForm({
                          ket_qua: "",
                          huong_xu_ly: "khong_hoan",
                          so_tien_hoan: "0",
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                    >
                      <Scale className="w-4 h-4" />
                      Hòa giải
                    </button>
                    <button
                      onClick={() => closeComplaint(detail.khieu_nai.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                    >
                      <Lock className="w-4 h-4" />
                      Đóng
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Resolve modal */}
      {showResolve && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => !resolving && setShowResolve(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200">
              <div className="font-bold text-lg">⚖️ Hòa giải khiếu nại</div>
              <div className="text-xs text-slate-500 mt-1">
                #{showResolve.id} — {showResolve.tieu_de}
              </div>
            </div>
            <form onSubmit={submitResolve} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kết quả hòa giải *
                </label>
                <textarea
                  required
                  value={resolveForm.ket_qua}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, ket_qua: e.target.value })
                  }
                  rows={3}
                  placeholder="VD: Hai bên đã thống nhất hoàn 50%..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hướng xử lý *
                </label>
                <select
                  value={resolveForm.huong_xu_ly}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, huong_xu_ly: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="hoan_tien_sv">↩️ Hoàn tiền cho Sinh viên</option>
                  <option value="hoan_tien_ntd">↩️ Hoàn tiền cho Nhà tuyển dụng</option>
                  <option value="chia_doi">⚖️ Chia đôi</option>
                  <option value="khong_hoan">❌ Không hoàn</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              {["hoan_tien_sv", "hoan_tien_ntd", "chia_doi"].includes(
                resolveForm.huong_xu_ly
              ) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số tiền hoàn (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={resolveForm.so_tien_hoan}
                    onChange={(e) =>
                      setResolveForm({
                        ...resolveForm,
                        so_tien_hoan: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolve(null)}
                  disabled={resolving}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {resolving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  isMoney,
}: {
  label: string;
  value: number;
  color: "purple" | "amber" | "blue" | "emerald";
  isMoney?: boolean;
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">
        {isMoney ? fmtMoney(value) : value}
      </div>
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