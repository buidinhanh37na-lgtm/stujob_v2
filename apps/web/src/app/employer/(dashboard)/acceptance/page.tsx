"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Check, X, Eye, FileText, Clock, Wallet, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtMoney, fmtDateTime } from "@/lib/utils";

interface Task {
  id: number;
  sinh_vien_id: number;
  viec_lam_id: number | null;
  ten_nhiem_vu: string;
  mo_ta: string | null;
  han_nop: string | null;
  trang_thai_nv: string;
  file_goc: string | null;
  file_xem_truoc: string | null;
  created_at: string;
  ho_ten: string;
  ma_sinh_vien: string | null;
  tieu_de: string;
  thu_lao: number;
}

type Tab = "cho_duyet" | "hoan_thanh" | "all";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  dang_lam: { label: "🔄 Đang làm", cls: "bg-blue-100 text-blue-800" },
  cho_duyet: { label: "⏳ Chờ nghiệm thu", cls: "bg-amber-100 text-amber-800" },
  hoan_thanh: { label: "✅ Đã nghiệm thu", cls: "bg-emerald-100 text-emerald-800" },
  qua_han: { label: "⚠️ Quá hạn", cls: "bg-red-100 text-red-700" },
};

export default function AcceptancePage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>("cho_duyet");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [acceptModal, setAcceptModal] = useState<Task | null>(null);
  const [nhanXet, setNhanXet] = useState("");
  const [chapNhan, setChapNhan] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/employer/acceptance");
      if (data.success) setTasks(data.items || []);
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

  async function submitAccept(task: Task) {
    setBusyId(task.id);
    try {
      const { data } = await api.post(`/api/employer/acceptance/${task.id}`, {
        chap_nhan: chapNhan,
        nhan_xet: nhanXet,
      });
      if (data.success) {
        toast.success(data.message);
        setAcceptModal(null);
        setNhanXet("");
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  const counts = {
    all: tasks.length,
    cho_duyet: tasks.filter((t) => t.trang_thai_nv === "cho_duyet").length,
    hoan_thanh: tasks.filter((t) => t.trang_thai_nv === "hoan_thanh").length,
  };

  const filtered = tasks.filter((t) => {
    if (tab === "all") return true;
    return t.trang_thai_nv === tab;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Nghiệm thu bài nộp</h2>
        <p className="text-slate-500 text-sm mt-1">
          Xem và nghiệm thu bài nộp của sinh viên — chấp nhận sẽ giải ngân
        </p>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <b>Chú ý:</b> Bạn chỉ xem được <b>toàn bộ file</b> sau khi nghiệm thu
          chấp nhận. Trước đó chỉ xem trước.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: "cho_duyet" as Tab, label: `⏳ Chờ nghiệm thu (${counts.cho_duyet})` },
          { v: "hoan_thanh" as Tab, label: `✅ Đã nghiệm thu (${counts.hoan_thanh})` },
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
          <FileText className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có bài nộp nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => {
            const st = STATUS_MAP[t.trang_thai_nv] || STATUS_MAP.dang_lam;
            const initial = (t.ho_ten || "?").charAt(0).toUpperCase();
            const hasFile = !!t.file_goc;
            const canAccept = t.trang_thai_nv === "cho_duyet" && hasFile;

            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition ${
                  t.trang_thai_nv === "hoan_thanh" ? "opacity-90" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {t.ho_ten}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {t.ma_sinh_vien || ""}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 ${st.cls}`}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border-l-2 border-sky-400">
                  <div className="text-xs text-slate-500">Nhiệm vụ:</div>
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {t.ten_nhiem_vu}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold">
                    <Wallet className="w-3 h-3" />
                    {fmtMoney(t.thu_lao)}
                  </span>
                  {t.han_nop && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      <Clock className="w-3 h-3" />
                      Hạn: {fmtDateTime(t.han_nop)}
                    </span>
                  )}
                  {hasFile ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      📎 Có file
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      Chưa nộp
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  {hasFile && (
                    <button
                      onClick={() => setPreviewTask(t)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t.trang_thai_nv === "hoan_thanh" ? "Xem file" : "Xem trước"}
                    </button>
                  )}
                  {canAccept && (
                    <button
                      onClick={() => {
                        setAcceptModal(t);
                        setChapNhan(true);
                        setNhanXet("");
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Nghiệm thu
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewTask && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewTask(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 truncate">
                  Bài nộp: {previewTask.ten_nhiem_vu}
                </div>
                <div className="text-xs text-slate-500">
                  {previewTask.ho_ten} • {previewTask.ma_sinh_vien}
                </div>
              </div>
              <button
                onClick={() => setPreviewTask(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {previewTask.file_goc?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={`http://localhost:4000/api/employer/acceptance/${previewTask.id}/file`}
                  className="w-full h-full min-h-[600px] rounded-lg bg-white"
                  title="Preview PDF"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`http://localhost:4000/api/employer/acceptance/${previewTask.id}/file`}
                  alt="Bài nộp"
                  className="max-w-full mx-auto rounded-lg shadow-lg"
                />
              )}

              {previewTask.trang_thai_nv !== "hoan_thanh" && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center text-sm text-amber-800">
                  ⚠️ Đây là bản xem trước. Nghiệm thu để xem toàn bộ.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accept modal */}
      {acceptModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => busyId === null && setAcceptModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200">
              <div className="font-bold text-lg">Nghiệm thu bài nộp</div>
              <div className="text-xs text-slate-500 mt-1">
                {acceptModal.ho_ten} • {acceptModal.ten_nhiem_vu}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quyết định
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChapNhan(true)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                      chapNhan
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    ✅ Chấp nhận & giải ngân
                  </button>
                  <button
                    type="button"
                    onClick={() => setChapNhan(false)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                      !chapNhan
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    ❌ Yêu cầu chỉnh sửa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nhận xét {chapNhan ? "(tùy chọn)" : "*"}
                </label>
                <textarea
                  value={nhanXet}
                  onChange={(e) => setNhanXet(e.target.value)}
                  rows={3}
                  placeholder={
                    chapNhan
                      ? "VD: Sản phẩm đạt yêu cầu, code sạch..."
                      : "VD: Cần chỉnh sửa phần..."
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-y"
                />
              </div>

              {chapNhan && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  💰 Số tiền <b>{fmtMoney(acceptModal.thu_lao)}</b> sẽ được giải
                  ngân cho SV ngay sau khi xác nhận.
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setAcceptModal(null)}
                disabled={busyId !== null}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                onClick={() => submitAccept(acceptModal)}
                disabled={busyId !== null || (!chapNhan && !nhanXet.trim())}
                className={`px-5 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60 inline-flex items-center gap-2 ${
                  chapNhan
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {busyId !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : chapNhan ? (
                  <>
                    <Check className="w-4 h-4" />
                    Xác nhận nghiệm thu
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Gửi yêu cầu chỉnh sửa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}