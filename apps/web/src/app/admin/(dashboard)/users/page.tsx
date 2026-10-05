"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Users,
  Search,
  Eye,
  Lock,
  Unlock,
  GraduationCap,
  Building2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useConfirm } from "@/components/ui";
import { fmtDate, fmtMoney } from "@/lib/utils";

type UserType = "sinh_vien" | "nha_tuyen_dung";

interface UserItem {
  id: number;
  code: string;
  name: string;
  email: string;
  extra: string;
  verified: string;
  locked: boolean;
  created_at: string;
}

interface Stats {
  tong: number;
  da_xac_thuc: number;
  chua_xac_thuc: number;
  bi_khoa: number;
}

interface DetailData {
  user: {
    id: number;
    [key: string]: unknown;
  };
  type: UserType;
}

export default function AdminUsersPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");
  const confirm = useConfirm();

  const [type, setType] = useState<UserType>("sinh_vien");
  const [items, setItems] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/api/admin/users?type=${type}&q=${encodeURIComponent(search)}`
      );
      if (data.success) setItems(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, [type, search]);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/api/admin/users/stats");
      if (data.success) {
        const s =
          type === "sinh_vien" ? data.sinh_vien : data.nha_tuyen_dung;
        setStats(s);
      }
    } catch {}
  }, [type]);

  useEffect(() => {
    if (!authLoading) {
      load();
      loadStats();
    }
  }, [authLoading, load, loadStats]);

  async function viewDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const { data } = await api.get(
        `/api/admin/users/detail?type=${type}&id=${id}`
      );
      if (data.success) setDetail(data);
    } catch {
      toast.error("Không tải được chi tiết");
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleStatus(u: UserItem) {
    const isLocked = u.locked;

    const reason = await confirm({
      title: isLocked ? "Mở khóa tài khoản?" : "Khóa tài khoản?",
      message: isLocked
        ? `Tài khoản "${u.name}" sẽ được mở khóa và có thể đăng nhập lại.`
        : `Tài khoản "${u.name}" sẽ bị khóa. Vui lòng nhập lý do.`,
      variant: isLocked ? "info" : "danger",
      confirmLabel: isLocked ? "Mở khóa" : "Khóa tài khoản",
      withReason: !isLocked,
      reasonLabel: "Lý do khóa",
      reasonPlaceholder: "VD: Vi phạm điều khoản sử dụng...",
      reasonRequired: !isLocked,
    });

    if (reason === null) return;

    try {
      setBusyId(u.id);
      const { data } = await api.post("/api/admin/users/toggle-status", {
        type,
        id: u.id,
        ly_do: reason,
      });
      if (data.success) {
        toast.success(data.message || "Đã cập nhật");
        load();
        loadStats();
      } else {
        toast.error(data.message || "Lỗi");
      }
    } catch {
      toast.error("Lỗi cập nhật");
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

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500" />
          Quản lý người dùng
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Xem, khóa/mở khóa tài khoản sinh viên và nhà tuyển dụng
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatBox label="Tổng" value={stats.tong} color="purple" />
          <StatBox
            label="Đã xác thực"
            value={stats.da_xac_thuc}
            color="emerald"
          />
          <StatBox
            label="Chưa xác thực"
            value={stats.chua_xac_thuc}
            color="amber"
          />
          <StatBox label="Đã khóa" value={stats.bi_khoa} color="red" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-slate-200">
        <button
          onClick={() => setType("sinh_vien")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-[3px] -mb-0.5 transition ${
            type === "sinh_vien"
              ? "text-purple-600 border-purple-500"
              : "text-slate-500 border-transparent hover:text-purple-500"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Sinh viên
        </button>
        <button
          onClick={() => setType("nha_tuyen_dung")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-[3px] -mb-0.5 transition ${
            type === "nha_tuyen_dung"
              ? "text-purple-600 border-purple-500"
              : "text-slate-500 border-transparent hover:text-purple-500"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Nhà tuyển dụng
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            type === "sinh_vien"
              ? "Tìm MSSV, tên, email..."
              : "Tìm tên công ty, email..."
          }
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-14 h-14 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Không có người dùng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wide">
                  <th className="text-left p-3 font-bold">
                    {type === "sinh_vien" ? "MSSV" : "Loại"}
                  </th>
                  <th className="text-left p-3 font-bold">Tên</th>
                  <th className="text-left p-3 font-bold">Email</th>
                  <th className="text-left p-3 font-bold">
                    {type === "sinh_vien" ? "Trường" : "Ngành"}
                  </th>
                  <th className="text-center p-3 font-bold">Xác thực</th>
                  <th className="text-left p-3 font-bold">Ngày tạo</th>
                  <th className="text-right p-3 font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3 font-semibold text-slate-700">
                      {u.code}
                    </td>
                    <td className="p-3 text-slate-700">{u.name}</td>
                    <td className="p-3 text-slate-500 text-xs">{u.email}</td>
                    <td className="p-3 text-slate-500 text-xs truncate max-w-[180px]">
                      {u.extra || "—"}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.verified === "da_xac_thuc"
                            ? "bg-emerald-100 text-emerald-700"
                            : u.verified === "chua"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {u.verified === "da_xac_thuc"
                          ? "✅"
                          : u.verified === "chua"
                            ? "🔴"
                            : "🟡"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-xs whitespace-nowrap">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewDetail(u.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                          title="Chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          disabled={busyId === u.id}
                          className={`p-1.5 rounded-lg disabled:opacity-60 ${
                            u.locked
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                          title={u.locked ? "Mở khóa" : "Khóa"}
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : u.locked ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setDetail(null)}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
            {detailLoading || !detail ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <h3 className="font-bold text-lg">
                    👤 Chi tiết {detail.type === "sinh_vien" ? "sinh viên" : "nhà tuyển dụng"}
                  </h3>
                  <button
                    onClick={() => setDetail(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {detail.type === "sinh_vien" ? (
                    <SinhVienDetail user={detail.user} />
                  ) : (
                    <NTDDetail user={detail.user} />
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

// ============================================================
// StatBox
// ============================================================
function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "purple" | "emerald" | "amber" | "red";
}) {
  const colors = {
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">
        {value.toLocaleString("vi-VN")}
      </div>
    </div>
  );
}

// ============================================================
// Sinh viên detail
// ============================================================
function SinhVienDetail({ user }: { user: Record<string, unknown> }) {
  const u = user as {
    ho_ten?: string;
    ma_sinh_vien?: string;
    email?: string;
    so_dien_thoai?: string;
    truong?: string;
    khoa?: string;
    chuyen_nganh?: string;
    nam_hoc?: number;
    gpa?: number | string | null;
    diem_danh_gia?: number | string | null;
    mo_ta?: string;
    ky_nang?: Array<{ ten_ky_nang: string; muc_do: string }>;
    chung_chi?: Array<{ ten_chung_chi: string; to_chuc?: string }>;
    thong_ke?: {
      so_ung_tuyen?: number;
      so_viec_hoan_thanh?: number;
      tong_thu_nhap?: number;
    };
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
          {(u.ho_ten || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">{u.ho_ten || "—"}</div>
          <div className="text-xs text-slate-500">
            {u.ma_sinh_vien} • {u.email}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Info label="MSSV" value={u.ma_sinh_vien || "—"} />
        <Info label="SĐT" value={u.so_dien_thoai || "—"} />
        <Info label="Trường" value={u.truong || "—"} />
        <Info label="Khoa" value={u.khoa || "—"} />
        <Info label="Chuyên ngành" value={u.chuyen_nganh || "—"} />
        <Info
          label="Năm học"
          value={u.nam_hoc?.toString() || "—"}
        />
        <Info
          label="GPA"
          value={u.gpa != null ? Number(u.gpa).toFixed(2) : "—"}
        />
        <Info
          label="Đánh giá"
          value={`${Number(u.diem_danh_gia || 0).toFixed(1)}/5`}
        />
      </div>

      {u.mo_ta && (
        <div>
          <div className="text-xs text-slate-500 mb-1">Giới thiệu</div>
          <div className="bg-slate-50 p-3 rounded-xl text-sm whitespace-pre-line">
            {u.mo_ta}
          </div>
        </div>
      )}

      {u.ky_nang && u.ky_nang.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Kỹ năng</div>
          <div className="flex flex-wrap gap-1.5">
            {u.ky_nang.map((k, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold"
              >
                {k.ten_ky_nang}
              </span>
            ))}
          </div>
        </div>
      )}

      {u.thong_ke && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="text-center">
            <div className="text-[11px] text-slate-500 uppercase">
              Ứng tuyển
            </div>
            <div className="font-bold text-lg text-slate-800">
              {u.thong_ke.so_ung_tuyen || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-500 uppercase">
              Hoàn thành
            </div>
            <div className="font-bold text-lg text-slate-800">
              {u.thong_ke.so_viec_hoan_thanh || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-500 uppercase">
              Thu nhập
            </div>
            <div className="font-bold text-sm text-emerald-700">
              {fmtMoney(Number(u.thong_ke.tong_thu_nhap || 0))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// NTD detail
// ============================================================
function NTDDetail({ user }: { user: Record<string, unknown> }) {
  const u = user as {
    ten_cong_ty?: string;
    email?: string;
    loai?: string;
    nguoi_dai_dien?: string;
    so_dien_thoai?: string;
    dia_chi?: string;
    linh_vuc?: string;
    ma_so_thue?: string;
    ma_so_hkd?: string;
    cccd?: string;
    website?: string;
    mo_ta?: string;
    so_du?: number | string;
    so_tin_da_dang?: number;
    thong_ke?: {
      so_tin_viec?: number;
      tong_da_tra?: number;
    };
  };

  const loaiLabel =
    u.loai === "ca_nhan"
      ? "Cá nhân"
      : u.loai === "ho_kinh_doanh"
        ? "Hộ kinh doanh"
        : "Doanh nghiệp";

  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
          {(u.ten_cong_ty || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">{u.ten_cong_ty || "—"}</div>
          <div className="text-xs text-slate-500">
            {loaiLabel} • {u.email}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Info label="Người đại diện" value={u.nguoi_dai_dien || "—"} />
        <Info label="SĐT" value={u.so_dien_thoai || "—"} />
        <Info label="Lĩnh vực" value={u.linh_vuc || "—"} />
        <Info label="Mã số thuế" value={u.ma_so_thue || "—"} />
        <Info label="Mã số HKD" value={u.ma_so_hkd || "—"} />
        <Info label="Website" value={u.website || "—"} />
        <Info label="Địa chỉ" value={u.dia_chi || "—"} />
        <Info
          label="Số dư ví"
          value={fmtMoney(Number(u.so_du || 0))}
        />
      </div>

      {u.mo_ta && (
        <div>
          <div className="text-xs text-slate-500 mb-1">Mô tả</div>
          <div className="bg-slate-50 p-3 rounded-xl text-sm whitespace-pre-line">
            {u.mo_ta}
          </div>
        </div>
      )}

      {u.thong_ke && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="text-center">
            <div className="text-[11px] text-slate-500 uppercase">
              Số tin việc
            </div>
            <div className="font-bold text-lg text-slate-800">
              {u.thong_ke.so_tin_viec || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-500 uppercase">
              Tổng đã trả
            </div>
            <div className="font-bold text-sm text-emerald-700">
              {fmtMoney(Number(u.thong_ke.tong_da_tra || 0))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// Info row
// ============================================================
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-sm text-slate-800 break-words">
        {value}
      </div>
    </div>
  );
}