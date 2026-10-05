"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, Mail, CheckCircle, XCircle,
  Wallet, Eye,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDate } from "@/lib/utils";

interface Invitation {
  id: number;
  loi_nhan: string | null;
  trang_thai: string;
  created_at: string;
  ngay_moi: string | null;
  viec_lam_id: number;
  tieu_de: string;
  mo_ta: string | null;
  ky_nang_can: string | null;
  luong_min: number;
  luong_max: number;
  loai_cong_viec: string | null;
  thu_lam_viec: string | null;
  han_chot: string | null;
  ngay_bat_dau: string | null;
  ngay_ket_thuc: string | null;
  ntd_id: number;
  ten_cong_ty: string;
  logo: string | null;
  linh_vuc: string | null;
}

type Status = "cho_duyet" | "da_chap_nhan" | "tu_choi" | "all";

export default function InvitationsPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Invitation[]>([]);
  const [status, setStatus] = useState<Status>("cho_duyet");
  const [selected, setSelected] = useState<Invitation | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/student/invitations?status=${status}`
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
}, [authLoading, status]);

  async function handleAccept(id: number) {
    if (!confirm("Chấp nhận lời mời này?\nNTD sẽ ký quỹ và bạn có thể bắt đầu làm việc."))
      return;
    setActionLoading(true);
    try {
      const { data } = await api.post(`/api/student/invitations/${id}/accept`);
      if (data.success) {
        toast.success(data.message);
        setSelected(null);
        load();
      } else {
        toast.error(data.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Lỗi");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(id: number) {
    const reason = prompt("Lý do từ chối (tùy chọn):");
    if (reason === null) return;
    setActionLoading(true);
    try {
      const { data } = await api.post(`/api/student/invitations/${id}/reject`, {
        ly_do: reason,
      });
      if (data.success) {
        toast.success("Đã từ chối");
        setSelected(null);
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setActionLoading(false);
    }
  }

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    cho_duyet: { label: "⏳ Chờ trả lời", cls: "bg-amber-100 text-amber-800" },
    da_chap_nhan: { label: "✅ Đã chấp nhận", cls: "bg-indigo-100 text-indigo-800" },
    tu_choi: { label: "❌ Đã từ chối", cls: "bg-red-100 text-red-700" },
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lời mời làm việc</h2>
          <p className="text-slate-500 text-sm mt-1">
            NTD chủ động mời bạn tham gia công việc
          </p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="cho_duyet">⏳ Chờ trả lời</option>
          <option value="da_chap_nhan">✅ Đã chấp nhận</option>
          <option value="tu_choi">❌ Đã từ chối</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Mail className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có lời mời nào</p>
          <p className="text-xs mt-1">
            Khi NTD mời bạn làm việc, lời mời sẽ xuất hiện ở đây
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const st = STATUS_MAP[it.trang_thai] || STATUS_MAP.cho_duyet;
            const initial = (it.ten_cong_ty || "?").charAt(0).toUpperCase();
            const salary =
              it.luong_min === it.luong_max
                ? fmtMoney(it.luong_min)
                : `${fmtMoney(it.luong_min)} - ${fmtMoney(it.luong_max)}`;
            const typeLabel: Record<string, string> = {
              remote: "🌐 Online",
              onsite: "🏢 Offline",
              hybrid: "🔀 Kết hợp",
            };

            return (
              <div
                key={it.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-600 truncate">
                          {it.ten_cong_ty}
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          📌 {it.tieu_de}
                        </div>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {it.loai_cong_viec && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                          {typeLabel[it.loai_cong_viec] || it.loai_cong_viec}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold inline-flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        {salary}
                      </span>
                      {it.ngay_bat_dau && it.ngay_ket_thuc && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                          📅 {fmtDate(it.ngay_bat_dau)} → {fmtDate(it.ngay_ket_thuc)}
                        </span>
                      )}
                    </div>

                    {it.loi_nhan && (
                      <div className="text-xs text-slate-600 bg-blue-50 p-2.5 rounded-lg border-l-2 border-blue-400 mb-2">
                        <b>💬 Lời nhắn:</b> {it.loi_nhan}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => setSelected(it)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Chi tiết
                      </button>
                      {it.trang_thai === "cho_duyet" && (
                        <>
                          <button
                            onClick={() => handleAccept(it.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-60"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Chấp nhận
                          </button>
                          <button
                            onClick={() => handleReject(it.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition disabled:opacity-60"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Từ chối
                          </button>
                        </>
                      )}
                      {it.trang_thai === "da_chap_nhan" && (
                        <Link
                          href="/student/tasks"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Xem nhiệm vụ
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal chi tiết */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(selected.ten_cong_ty || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">{selected.ten_cong_ty}</div>
                <div className="text-xs text-slate-500">
                  {selected.linh_vuc || "Chưa cập nhật"}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <h3 className="font-bold text-lg">📌 {selected.tieu_de}</h3>

              {selected.loi_nhan && (
                <div className="bg-blue-50 p-3 rounded-xl border-l-2 border-blue-400 text-sm">
                  <b>💬 Lời nhắn từ NTD:</b>
                  <div className="mt-1 text-slate-700">{selected.loi_nhan}</div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <Row
                  icon="💰"
                  label="Thù lao"
                  value={
                    selected.luong_min === selected.luong_max
                      ? fmtMoney(selected.luong_min)
                      : `${fmtMoney(selected.luong_min)} - ${fmtMoney(selected.luong_max)}`
                  }
                  bold
                />
                {selected.loai_cong_viec && (
                  <Row
                    icon="🎯"
                    label="Hình thức"
                    value={
                      { remote: "Online", onsite: "Offline", hybrid: "Kết hợp" }[
                        selected.loai_cong_viec
                      ] || selected.loai_cong_viec
                    }
                  />
                )}
                {selected.han_chot && (
                  <Row icon="⏰" label="Hạn chót" value={fmtDate(selected.han_chot)} />
                )}
                {selected.ngay_bat_dau && (
                  <Row
                    icon="📅"
                    label="Thời gian"
                    value={`${fmtDate(selected.ngay_bat_dau)} → ${fmtDate(selected.ngay_ket_thuc)}`}
                  />
                )}
              </div>

              {selected.mo_ta && (
                <div>
                  <div className="text-sm font-semibold mb-1">📝 Mô tả:</div>
                  <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 whitespace-pre-line">
                    {selected.mo_ta}
                  </div>
                </div>
              )}

              {selected.ky_nang_can && (
                <div>
                  <div className="text-sm font-semibold mb-1">🛠️ Kỹ năng cần:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.ky_nang_can.split(",").map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {selected.trang_thai === "cho_duyet" && (
              <div className="p-5 border-t border-slate-200 flex gap-2 justify-end">
                <button
                  onClick={() => handleReject(selected.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 disabled:opacity-60"
                >
                  ❌ Từ chối
                </button>
                <button
                  onClick={() => handleAccept(selected.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  {actionLoading ? "Đang xử lý..." : "✅ Chấp nhận"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  bold,
}: {
  icon: string;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className={bold ? "font-bold text-indigo-600" : "text-slate-700"}>
        {value}
      </span>
    </div>
  );
}