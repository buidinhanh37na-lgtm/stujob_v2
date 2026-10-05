"use client";

import { useEffect, useState } from "react";
import { Loader2, Link2, Star, Eye, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDateTime } from "@/lib/utils";
import { StaggerList, StaggerItem } from "@/components/motion";

interface Connection {
  id: number;
  trang_thai: string;
  created_at: string;
  sinh_vien_id: number;
  sv_ten: string;
  ma_sinh_vien: string;
  truong: string;
  diem_danh_gia: number;
  so_lan_danh_gia: number;
  viec_lam_id: number;
  tieu_de: string;
  luong_min: number;
  luong_max: number;
  loai_cong_viec: string;
  ntd_id: number;
  ten_cong_ty: string;
  ntd_loai: string;
  escrow_tien: number | null;
  escrow_trang_thai: string | null;
  ngay_giai_ngan: string | null;
  danh_gia_diem: number | null;
  danh_gia_nhan_xet: string | null;
}

interface Stats {
  stats: { dang_lam: number; hoan_thanh: number; tong: number };
  money: number;
  sv_count: number;
  ntd_count: number;
}

interface Detail {
  item: {
    id: number;
    trang_thai: string;
    created_at: string;
    sv_ten: string;
    ma_sinh_vien: string;
    truong: string;
    chuyen_nganh: string;
    gpa: number | null;
    sv_email: string;
    sv_sdt: string;
    tieu_de: string;
    mo_ta: string;
    luong_min: number;
    luong_max: number;
    loai_cong_viec: string;
    ten_cong_ty: string;
    ntd_email: string;
    so_tien: number;
    escrow_trang_thai: string | null;
    ngay_giai_ngan: string | null;
  };
}

type Filter = "all" | "da_chap_nhan" | "hoan_thanh";

export default function AdminConnectionsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Connection[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadStats() {
    try {
      const { data } = await api.get("/api/admin/connections/stats");
      if (data.success) setStats(data);
    } catch {}
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/admin/connections?status=${filter}&q=${encodeURIComponent(search)}`
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
  }, [authLoading, filter]);

  async function viewDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const { data } = await api.get(`/api/admin/connections/detail?id=${id}`);
      if (data.success) setDetail(data);
    } catch {
      toast.error("Không tải được chi tiết");
    } finally {
      setDetailLoading(false);
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
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Kết nối thành công</h2>
        <p className="text-slate-500 text-sm mt-1">
          Danh sách các cặp Sinh viên ↔ Nhà tuyển dụng đã ghép việc
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <StatBox
              label="Tổng kết nối"
              value={stats.stats.tong}
              color="purple"
            />
          </StaggerItem>
          <StaggerItem>
            <StatBox
              label="Đang làm việc"
              value={stats.stats.dang_lam}
              color="blue"
            />
          </StaggerItem>
          <StaggerItem>
            <StatBox
              label="Đã hoàn thành"
              value={stats.stats.hoan_thanh}
              color="emerald"
            />
          </StaggerItem>
          <StaggerItem>
            <StatBox
              label="Tiền đã giải ngân"
              value={stats.money}
              color="amber"
              isMoney
            />
          </StaggerItem>
        </StaggerList>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { v: "all" as Filter, label: "Tất cả" },
          { v: "da_chap_nhan" as Filter, label: "⚙️ Đang làm" },
          { v: "hoan_thanh" as Filter, label: "🎉 Hoàn thành" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
              filter === f.v
                ? "border-purple-600 bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1 min-w-[200px] relative ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Tìm SV, NTD, công việc..."
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
          <Link2 className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có kết nối nào</p>
          <p className="text-xs mt-1">
            Kết nối xuất hiện khi NTD duyệt ứng tuyển của SV
          </p>
        </div>
      ) : (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((c) => {
            const svInit = (c.sv_ten || "?").charAt(0).toUpperCase();
            const ntdInit = (c.ten_cong_ty || "?").charAt(0).toUpperCase();
            const isDone = c.trang_thai === "hoan_thanh";

            const salary =
              c.luong_min === c.luong_max
                ? fmtMoney(c.luong_min)
                : `${fmtMoney(c.luong_min)} - ${fmtMoney(c.luong_max)}`;

            const typeLabel: Record<string, string> = {
              remote: "🌐 Online",
              onsite: "🏢 Offline",
              hybrid: "🔀 Kết hợp",
            };

            return (
              <StaggerItem key={c.id}>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition relative overflow-hidden h-full">
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      isDone
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : "bg-gradient-to-r from-purple-400 to-indigo-500"
                    }`}
                  />

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {svInit}
                      </div>
                      <Link2 className="w-4 h-4 text-amber-500" />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {ntdInit}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isDone ? "🎉 Hoàn thành" : "⚙️ Đang làm"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {c.sv_ten}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {c.ma_sinh_vien}
                      </div>
                    </div>
                    <div className="text-purple-500 font-bold">↔</div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {c.ten_cong_ty}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {c.ntd_loai === "ca_nhan"
                          ? "Cá nhân"
                          : c.ntd_loai === "ho_kinh_doanh"
                            ? "Hộ KD"
                            : "Doanh nghiệp"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 rounded-lg bg-blue-50 border-l-2 border-blue-400">
                    <div className="text-xs text-blue-700 truncate">
                      📌 <b>{c.tieu_de}</b>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {typeLabel[c.loai_cong_viec] || c.loai_cong_viec}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                      💰 {salary}
                    </span>
                    {c.ngay_giai_ngan && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold">
                        💸 Đã trả
                      </span>
                    )}
                  </div>

                  {c.danh_gia_diem !== null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(c.danh_gia_diem || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">
                        ({c.danh_gia_diem}/5)
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {fmtDateTime(c.created_at)}
                    </span>
                    <button
                      onClick={() => viewDetail(c.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}

      {/* Detail modal */}
      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-lg">🔗 Chi tiết kết nối</h3>
                  <button
                    onClick={() => setDetail(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-sm">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(detail.item.sv_ten || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{detail.item.sv_ten}</div>
                      <div className="text-xs text-slate-500">
                        {detail.item.ma_sinh_vien} • {detail.item.truong}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-purple-500 font-bold">🔗</div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(detail.item.ten_cong_ty || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{detail.item.ten_cong_ty}</div>
                      <div className="text-xs text-slate-500">
                        {detail.item.ntd_email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Công việc" value={detail.item.tieu_de} />
                    <Info
                      label="Hình thức"
                      value={
                        detail.item.loai_cong_viec === "remote"
                          ? "🌐 Online"
                          : detail.item.loai_cong_viec === "onsite"
                            ? "🏢 Offline"
                            : "🔀 Kết hợp"
                      }
                    />
                    <Info
                      label="Thù lao"
                      value={`${fmtMoney(detail.item.luong_min)} - ${fmtMoney(detail.item.luong_max)}`}
                    />
                    <Info
                      label="Trạng thái"
                      value={
                        detail.item.trang_thai === "hoan_thanh"
                          ? "🎉 Hoàn thành"
                          : "⚙️ Đang làm"
                      }
                    />
                    <Info
                      label="Tiền escrow"
                      value={fmtMoney(detail.item.so_tien)}
                    />
                    <Info
                      label="Ngày kết nối"
                      value={fmtDateTime(detail.item.created_at)}
                    />
                    {detail.item.ngay_giai_ngan && (
                      <Info
                        label="Ngày giải ngân"
                        value={fmtDateTime(detail.item.ngay_giai_ngan)}
                      />
                    )}
                    {detail.item.gpa && (
                      <Info
                        label="GPA SV"
                        value={Number(detail.item.gpa).toFixed(2)}
                      />
                    )}
                  </div>

                  {detail.item.mo_ta && (
                    <div>
                      <div className="font-semibold mb-1">📝 Mô tả</div>
                      <div className="bg-slate-50 p-3 rounded-xl text-xs whitespace-pre-line">
                        {detail.item.mo_ta}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
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
  value: number | string;
  color: "purple" | "blue" | "emerald" | "amber";
  isMoney?: boolean;
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]} h-full`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1 truncate">
        {isMoney ? fmtMoney(Number(value)) : value}
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