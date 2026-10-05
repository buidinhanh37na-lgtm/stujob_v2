"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, Wallet, TrendingUp, TrendingDown, Plus, X,
  AlertCircle, ArrowDownRight, ArrowUpRight, Building2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDateTime } from "@/lib/utils";

interface TxItem {
  id: number;
  so_tien: number;
  phi_san: number;
  loai: string;
  mo_ta: string | null;
  trang_thai: string;
  created_at: string;
}

interface WithdrawItem {
  id: number;
  so_tien: number;
  ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
  trang_thai: string;
  ly_do_tu_choi: string | null;
  created_at: string;
}

const BANKS = [
  "Vietcombank", "Techcombank", "BIDV", "VietinBank", "MB Bank",
  "ACB", "Sacombank", "TPBank", "VPBank", "Agribank",
  "Momo", "ZaloPay",
];

export default function WalletPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");

  const [loading, setLoading] = useState(true);
  const [soDu, setSoDu] = useState(0);
  const [tongThu, setTongThu] = useState(0);
  const [tongChi, setTongChi] = useState(0);
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawItem[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    so_tien: "",
    ngan_hang: "",
    so_tai_khoan: "",
    chu_tai_khoan: "",
  });

  async function loadAll() {
    try {
      const [wRes, hRes] = await Promise.all([
        api.get("/api/student/wallet"),
        api.get("/api/student/wallet/withdraw-history"),
      ]);
      if (wRes.data.success) {
        setSoDu(wRes.data.so_du || 0);
        setTongThu(wRes.data.tong_thu || 0);
        setTongChi(wRes.data.tong_chi || 0);
        setTxs(wRes.data.items || []);
      }
      if (hRes.data.success) setWithdraws(hRes.data.items || []);
    } catch {
      toast.error("Không tải được ví");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadAll();
  }, [authLoading]);

  function openWithdraw() {
    if (soDu < 50000) {
      toast.error("Số dư tối thiểu 50.000đ để rút");
      return;
    }
    setForm({ so_tien: "", ngan_hang: "", so_tai_khoan: "", chu_tai_khoan: "" });
    setError("");
    setShowModal(true);
  }

  function setAmount(v: number) {
    setForm({ ...form, so_tien: Math.floor(v).toString() });
  }

  async function handleWithdraw(e: FormEvent) {
    e.preventDefault();
    setError("");

    const amount = parseFloat(form.so_tien) || 0;
    if (amount < 50000) return setError("Số tiền tối thiểu 50.000đ");
    if (amount > soDu) return setError("Số dư không đủ");
    if (!form.ngan_hang) return setError("Chọn ngân hàng");
    if (!form.so_tai_khoan) return setError("Nhập số tài khoản");
    if (!form.chu_tai_khoan) return setError("Nhập chủ tài khoản");

    setSubmitting(true);
    try {
      const { data } = await api.post("/api/student/wallet/withdraw", {
        so_tien: amount,
        ngan_hang: form.ngan_hang,
        so_tai_khoan: form.so_tai_khoan,
        chu_tai_khoan: form.chu_tai_khoan,
      });
      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        loadAll();
      } else {
        setError(data.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Ví tiền</h2>
        <p className="text-slate-500 text-sm mt-1">
          Quản lý số dư và rút tiền về tài khoản ngân hàng
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium opacity-90">Số dư khả dụng</span>
            <Wallet className="w-5 h-5 opacity-90" />
          </div>
          <div className="text-3xl font-bold">{fmtMoney(soDu)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Tổng thu</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{fmtMoney(tongThu)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">Tổng chi</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{fmtMoney(tongChi)}</div>
        </div>
      </div>

      {/* WITHDRAW BUTTON */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-semibold text-slate-900">Rút tiền về ngân hàng</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Tối thiểu 50.000đ • Tối đa 50.000.000đ
          </div>
        </div>
        <button
          onClick={openWithdraw}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Rút tiền
        </button>
      </div>

      {/* WITHDRAW HISTORY */}
      {withdraws.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">📤 Yêu cầu rút tiền</h3>
          <div className="space-y-2">
            {withdraws.map((w) => {
              const stMap: Record<string, { cls: string; label: string }> = {
                cho_xu_ly: { cls: "bg-amber-100 text-amber-800", label: "⏳ Chờ duyệt" },
                da_duyet: { cls: "bg-blue-100 text-blue-800", label: "✅ Đã duyệt" },
                da_chuyen: { cls: "bg-emerald-100 text-emerald-800", label: "💸 Đã chuyển" },
                tu_choi: { cls: "bg-red-100 text-red-700", label: "❌ Từ chối" },
              };
              const st = stMap[w.trang_thai] || stMap.cho_xu_ly;
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900">
                      {fmtMoney(w.so_tien)}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {w.ngan_hang} • {w.so_tai_khoan} • {w.chu_tai_khoan}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {fmtDateTime(w.created_at)}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4">💸 Lịch sử giao dịch</h3>
        {txs.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((t) => {
              const plus = t.loai === "thu_nhap";
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      plus ? "bg-emerald-100" : "bg-red-100"
                    }`}
                  >
                    {plus ? (
                      <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {t.mo_ta || (plus ? "Thu nhập" : "Rút tiền")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {fmtDateTime(t.created_at)}
                      {t.phi_san > 0 && ` • Phí: ${fmtMoney(t.phi_san)}`}
                    </div>
                  </div>
                  <div
                    className={`font-bold text-sm flex-shrink-0 ${
                      plus ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {plus ? "+" : "-"}
                    {fmtMoney(t.so_tien)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WITHDRAW MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg">💰 Rút tiền</h3>
              <button
                onClick={() => !submitting && setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="text-xs text-slate-600">Số dư khả dụng</div>
                <div className="text-2xl font-bold text-indigo-600">{fmtMoney(soDu)}</div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số tiền muốn rút *
                </label>
                <input
                  type="number"
                  required
                  min={50000}
                  max={50000000}
                  step={10000}
                  value={form.so_tien}
                  onChange={(e) => setForm({ ...form, so_tien: e.target.value })}
                  placeholder="Tối thiểu 50.000đ"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setAmount(soDu)}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold hover:bg-slate-200"
                  >
                    Rút hết
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(100000)}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold hover:bg-slate-200"
                  >
                    100K
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(500000)}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold hover:bg-slate-200"
                  >
                    500K
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(1000000)}
                    className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold hover:bg-slate-200"
                  >
                    1TR
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngân hàng *
                </label>
                <select
                  required
                  value={form.ngan_hang}
                  onChange={(e) => setForm({ ...form, ngan_hang: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số tài khoản *
                </label>
                <input
                  type="text"
                  required
                  value={form.so_tai_khoan}
                  onChange={(e) => setForm({ ...form, so_tai_khoan: e.target.value })}
                  placeholder="VD: 0123456789"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chủ tài khoản *
                </label>
                <input
                  type="text"
                  required
                  value={form.chu_tai_khoan}
                  onChange={(e) => setForm({ ...form, chu_tai_khoan: e.target.value })}
                  placeholder="VD: NGUYEN VAN A"
                  style={{ textTransform: "uppercase" }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                ⚠️ Yêu cầu sẽ được xử lý trong 1-2 ngày làm việc. Tiền sẽ được chuyển vào tài khoản đã đăng ký.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "📤 Gửi yêu cầu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}