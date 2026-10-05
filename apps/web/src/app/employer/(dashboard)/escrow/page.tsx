"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Wallet, Shield, Plus,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDateTime } from "@/lib/utils";

interface EscrowItem {
  id: number;
  so_tien: number;
  phi_dich_vu: number;
  ma_giao_dich: string | null;
  trang_thai: string;
  ngay_giai_ngan: string | null;
  created_at: string;
  sinh_vien_id: number;
  ho_ten: string;
  ma_sinh_vien: string | null;
  viec_lam_id: number | null;
  tieu_de: string;
}

const PAYMENT_MAP: Record<string, { label: string; cls: string }> = {
  cho_nap: { label: "⏳ Chờ nạp", cls: "bg-amber-100 text-amber-800" },
  da_nap: { label: "🔒 Đã ký quỹ", cls: "bg-blue-100 text-blue-800" },
  cho_nghiem_thu: { label: "⏳ Chờ nghiệm thu", cls: "bg-amber-100 text-amber-800" },
  da_giai_ngan: { label: "✅ Đã giải ngân", cls: "bg-emerald-100 text-emerald-800" },
  hoan_tien: { label: "↩️ Hoàn tiền", cls: "bg-slate-100 text-slate-700" },
  huy: { label: "❌ Huỷ", cls: "bg-red-100 text-red-700" },
};

export default function EscrowPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(0);
  const [totalEscrow, setTotalEscrow] = useState(0);
  const [items, setItems] = useState<EscrowItem[]>([]);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    try {
      const [w, list] = await Promise.all([
        api.get("/api/employer/escrow/wallet"),
        api.get("/api/employer/escrow"),
      ]);
      if (w.data.success) setWallet(w.data.so_du || 0);
      if (list.data.success) {
        setItems(list.data.items || []);
        setTotalEscrow(list.data.tong_ky_quy || 0);
      }
    } catch {
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 10000) {
      toast.error("Số tiền tối thiểu 10.000đ");
      return;
    }
    setDepositing(true);
    try {
      const { data } = await api.post("/api/employer/escrow/deposit", {
        so_tien: amount,
      });
      if (data.success) {
        toast.success(data.message);
        setDepositAmount("");
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi");
    } finally {
      setDepositing(false);
    }
  }

  async function activate(id: number) {
    if (!confirm("Trích tiền từ ví để kích hoạt bảo đảm thanh toán?")) return;
    setBusyId(id);
    try {
      const { data } = await api.post("/api/employer/escrow/activate", { id });
      if (data.success) {
        toast.success(data.message);
        load();
      } else {
        toast.error(data.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Lỗi");
    } finally {
      setBusyId(null);
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
        <h2 className="text-2xl font-bold text-slate-900">Bảo đảm thanh toán</h2>
        <p className="text-slate-500 text-sm mt-1">
          Ký quỹ trước khi giao việc cho sinh viên
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium opacity-90">Số dư ví</span>
            <Wallet className="w-5 h-5 opacity-90" />
          </div>
          <div className="text-3xl font-bold">{fmtMoney(wallet)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">
              Đang giữ (escrow)
            </span>
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {fmtMoney(totalEscrow)}
          </div>
        </div>
      </div>

      {/* Deposit */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-sky-600" />
          Nạp ví (giả lập)
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={10000}
            step={1000}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Số tiền muốn nạp (≥10.000đ)"
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          <button
            onClick={handleDeposit}
            disabled={depositing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 disabled:opacity-60"
          >
            {depositing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Nạp ví
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[100000, 500000, 1000000, 5000000].map((v) => (
            <button
              key={v}
              onClick={() => setDepositAmount(v.toString())}
              className="px-3 py-1 rounded-lg bg-slate-100 text-xs font-semibold hover:bg-slate-200"
            >
              {v.toLocaleString("vi-VN")}đ
            </button>
          ))}
        </div>
      </div>

      {/* List escrow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4">
          🛡️ Danh sách bảo đảm ({items.length})
        </h3>

        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Chưa có bảo đảm thanh toán nào</p>
            <p className="text-xs mt-1">
              Duyệt ứng viên để tạo bảo đảm thanh toán
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((e) => {
              const st = PAYMENT_MAP[e.trang_thai] || PAYMENT_MAP.cho_nap;
              const canActivate = e.trang_thai === "cho_nap";
              const total = e.so_tien + e.phi_dich_vu;

              return (
                <div
                  key={e.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {e.tieu_de}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {e.ho_ten} {e.ma_sinh_vien && `(${e.ma_sinh_vien})`}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                      <span>
                        Thù lao: <b>{fmtMoney(e.so_tien)}</b>
                      </span>
                      {e.phi_dich_vu > 0 && (
                        <span>
                          Phí: <b>{fmtMoney(e.phi_dich_vu)}</b>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Mã: {e.ma_giao_dich} • {fmtDateTime(e.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                    {canActivate && (
                      <button
                        onClick={() => activate(e.id)}
                        disabled={busyId === e.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold disabled:opacity-60"
                      >
                        {busyId === e.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Shield className="w-3.5 h-3.5" />
                        )}
                        Kích hoạt {fmtMoney(total)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}