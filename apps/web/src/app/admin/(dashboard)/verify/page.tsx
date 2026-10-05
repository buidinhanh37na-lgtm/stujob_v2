"use client";

import { useEffect, useState } from "react";
import {
  Loader2, CheckCircle2, XCircle, User, Search, Sparkles, Eye, X, School, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDateTime } from "@/lib/utils";

interface RequestItem {
  id: number;
  sinh_vien_id: number;
  trang_thai: string;
  ghi_chu: string | null;
  ly_do_tu_choi: string | null;
  created_at: string;
  ma_sinh_vien: string;
  ho_ten: string;
  email: string;
  truong: string;
  chuyen_nganh: string;
  nam_hoc: number | null;
}

interface Stats {
  yeu_cau: {
    cho_duyet: number;
    da_xac_thuc: number;
    tu_choi: number;
  };
}

interface Detail {
  yeu_cau: {
    id: number;
    sinh_vien_id: number;
    ma_sinh_vien: string;
    ho_ten: string;
    email: string;
    truong: string | null;
    trang_thai: string;
    created_at: string;
  };
  nha_truong: {
    ma_sinh_vien: string;
    ho_ten: string;
    khoa: string | null;
    chuyen_nganh: string | null;
    nam_hoc: number | null;
    lop: string | null;
    trang_thai: string;
  } | null;
  so_khop: {
    ho_ten: { he_thong: string; nha_truong: string; khop: boolean };
    chuyen_nganh: { he_thong: string | null; nha_truong: string | null; khop: boolean };
    nam_hoc: { he_thong: number | null; nha_truong: number | null; khop: boolean };
    trang_thai_truong: string;
  } | null;
}

type Tab = "cho_duyet" | "da_xac_thuc" | "tu_choi" | "all";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  cho_duyet: { label: "⏳ Chờ duyệt", cls: "bg-amber-100 text-amber-800" },
  da_xac_thuc: { label: "✅ Đã xác thực", cls: "bg-emerald-100 text-emerald-800" },
  tu_choi: { label: "❌ Từ chối", cls: "bg-red-100 text-red-700" },
};

export default function AdminVerifyPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    yeu_cau: { cho_duyet: 0, da_xac_thuc: 0, tu_choi: 0 },
  });
  const [tab, setTab] = useState<Tab>("cho_duyet");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        api.get(`/api/admin/verify?status=${tab}&q=${encodeURIComponent(search)}`),
        api.get("/api/admin/verify/stats"),
      ]);
      if (list.data.success) setItems(list.data.items || []);
      if (s.data.success) setStats(s.data);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, tab]);

  function handleSearch() {
    load();
  }

  async function viewDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const { data } = await api.get(`/api/admin/verify/detail?id=${id}`);
      if (data.success) setDetail(data);
    } catch {
      toast.error("Không tải được chi tiết");
    } finally {
      setDetailLoading(false);
    }
  }

  async function approve(id: number) {
    const note = prompt("Ghi chú (tùy chọn):") ?? "";
    setBusyId(id);
    try {
      const { data } = await api.post("/api/admin/verify/approve", {
        id,
        ghi_chu: note,
      });
      if (data.success) {
        toast.success(data.message);
        setDetail(null);
        load();
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
    const reason = prompt("Lý do từ chối:");
    if (!reason) return;
    setBusyId(id);
    try {
      const { data } = await api.post("/api/admin/verify/reject", {
        id,
        ly_do: reason,
      });
      if (data.success) {
        toast.success(data.message);
        setDetail(null);
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setBusyId(null);
    }
  }

  async function autoVerify() {
    if (
      !confirm(
        "Tự động xác thực TẤT CẢ yêu cầu chờ duyệt (chỉ duyệt SV khớp DB trường)?"
      )
    )
      return;
    setAutoBusy(true);
    try {
      const { data } = await api.post("/api/admin/verify/auto-verify");
      toast.success(data.message);
      load();
    } catch {
      toast.error("Lỗi");
    } finally {
      setAutoBusy(false);
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
        <h2 className="text-2xl font-bold text-slate-900">Xác thực sinh viên</h2>
        <p className="text-slate-500 text-sm mt-1">
          Duyệt yêu cầu xác thực tài khoản sinh viên
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox label="Chờ duyệt" value={stats.yeu_cau.cho_duyet} color="amber" />
        <StatBox
          label="Đã xác thực"
          value={stats.yeu_cau.da_xac_thuc}
          color="emerald"
        />
        <StatBox label="Từ chối" value={stats.yeu_cau.tu_choi} color="red" />
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as Tab)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="cho_duyet">⏳ Chờ duyệt ({stats.yeu_cau.cho_duyet})</option>
          <option value="da_xac_thuc">✅ Đã xác thực ({stats.yeu_cau.da_xac_thuc})</option>
          <option value="tu_choi">❌ Từ chối ({stats.yeu_cau.tu_choi})</option>
          <option value="all">Tất cả</option>
        </select>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm MSSV, tên, email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        {tab === "cho_duyet" && stats.yeu_cau.cho_duyet > 0 && (
          <button
            onClick={autoVerify}
            disabled={autoBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/20 disabled:opacity-60 transition"
          >
            {autoBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Tự động xác thực
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <User className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                  MSSV
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                  Họ tên
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">
                  Trường
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase hidden lg:table-cell">
                  Ngày gửi
                </th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                  Trạng thái
                </th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const st = STATUS_MAP[it.trang_thai] || STATUS_MAP.cho_duyet;
                return (
                  <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">
                      {it.ma_sinh_vien}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{it.ho_ten}</div>
                      <div className="text-[11px] text-slate-400">{it.email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 hidden md:table-cell max-w-[200px] truncate">
                      {it.truong}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 hidden lg:table-cell">
                      {fmtDateTime(it.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-[11px] font-semibold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => viewDetail(it.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                          title="Chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {it.trang_thai === "cho_duyet" && (
                          <>
                            <button
                              onClick={() => approve(it.id)}
                              disabled={busyId === it.id}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
                              title="Duyệt"
                            >
                              {busyId === it.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => reject(it.id)}
                              disabled={busyId === it.id}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-60"
                              title="Từ chối"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !busyId && setDetail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                <p className="text-sm text-slate-500 mt-2">Đang tải...</p>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">Chi tiết yêu cầu #{detail.yeu_cau.id}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {detail.yeu_cau.ma_sinh_vien} • {detail.yeu_cau.ho_ten}
                    </div>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* SV info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info label="MSSV" value={detail.yeu_cau.ma_sinh_vien} />
                    <Info label="Họ tên" value={detail.yeu_cau.ho_ten} />
                    <Info label="Email" value={detail.yeu_cau.email} />
                    <Info label="Trường" value={detail.yeu_cau.truong || "—"} />
                  </div>

                  {/* Compare */}
                  {detail.so_khop ? (
                    <div>
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <School className="w-4 h-4 text-purple-600" />
                        So khớp với DB nhà trường
                      </div>
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs font-bold text-slate-500">Trường</th>
                              <th className="text-left py-2 px-3 text-xs font-bold text-slate-500">Hệ thống</th>
                              <th className="text-left py-2 px-3 text-xs font-bold text-slate-500">Nhà trường</th>
                              <th className="text-right py-2 px-3 text-xs font-bold text-slate-500">Kết quả</th>
                            </tr>
                          </thead>
                          <tbody>
                            <CompareRow
                              label="Họ tên"
                              ht={detail.so_khop.ho_ten.he_thong}
                              nt={detail.so_khop.ho_ten.nha_truong}
                              khop={detail.so_khop.ho_ten.khop}
                            />
                            <CompareRow
                              label="Chuyên ngành"
                              ht={detail.so_khop.chuyen_nganh.he_thong}
                              nt={detail.so_khop.chuyen_nganh.nha_truong}
                              khop={detail.so_khop.chuyen_nganh.khop}
                            />
                            <CompareRow
                              label="Năm học"
                              ht={String(detail.so_khop.nam_hoc.he_thong || "")}
                              nt={String(detail.so_khop.nam_hoc.nha_truong || "")}
                              khop={detail.so_khop.nam_hoc.khop}
                            />
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Trạng thái tại trường: <b>{detail.so_khop.trang_thai_truong}</b>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>⚠️ Không tìm thấy MSSV này trong DB nhà trường</span>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    onClick={() => setDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                  >
                    Đóng
                  </button>
                  {detail.yeu_cau.trang_thai === "cho_duyet" && (
                    <>
                      <button
                        onClick={() => reject(detail.yeu_cau.id)}
                        disabled={busyId !== null}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        Từ chối
                      </button>
                      <button
                        onClick={() => approve(detail.yeu_cau.id)}
                        disabled={busyId !== null}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Xác thực
                      </button>
                    </>
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
}: {
  label: string;
  value: number;
  color: "amber" | "emerald" | "red";
}) {
  const colors = {
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
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

function CompareRow({
  label,
  ht,
  nt,
  khop,
}: {
  label: string;
  ht: string | null | undefined;
  nt: string | null | undefined;
  khop: boolean;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 px-3 text-xs font-semibold">{label}</td>
      <td className="py-2 px-3 text-xs">{ht || "—"}</td>
      <td className="py-2 px-3 text-xs">{nt || "—"}</td>
      <td className="py-2 px-3 text-right">
        {khop ? (
          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
            ✅ Khớp
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
            ❌ Khác
          </span>
        )}
      </td>
    </tr>
  );
}