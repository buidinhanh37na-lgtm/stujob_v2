"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import {
  Loader2, Plus, Trash2, Upload, Eye, X, AlertCircle,
  Calendar, FileText, Clock,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDateTime, fmtDate } from "@/lib/utils";

interface Task {
  id: number;
  viec_lam_id: number | null;
  ten_nhiem_vu: string;
  mo_ta: string | null;
  han_nop: string | null;
  trang_thai: string;
  file_san_pham: string | null;
  file_xem_truoc: string | null;
  created_at: string;
  ten_viec: string | null;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  dang_lam: { label: "🔄 Đang làm", cls: "bg-blue-100 text-blue-800" },
  cho_duyet: { label: "⏳ Chờ duyệt", cls: "bg-amber-100 text-amber-800" },
  hoan_thanh: { label: "✅ Hoàn thành", cls: "bg-emerald-100 text-emerald-800" },
  qua_han: { label: "⚠️ Quá hạn", cls: "bg-red-100 text-red-700" },
};

export default function TasksPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTaskIdRef = useRef<number | null>(null);

  const [form, setForm] = useState({
    ten_nhiem_vu: "",
    mo_ta: "",
    han_nop: "",
  });

  async function load() {
    try {
      const { data } = await api.get("/api/student/tasks");
      if (data.success) setItems(data.items || []);
    } catch {
      toast.error("Không tải được nhiệm vụ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading]);

  // ============ TẠO NHIỆM VỤ ============
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.ten_nhiem_vu.trim()) return setError("Nhập tên nhiệm vụ");

    setSubmitting(true);
    try {
      const { data } = await api.post("/api/student/tasks", {
        ten_nhiem_vu: form.ten_nhiem_vu,
        mo_ta: form.mo_ta,
        han_nop: form.han_nop ? form.han_nop.replace("T", " ") + ":00" : null,
      });
      if (data.success) {
        toast.success("Đã thêm nhiệm vụ");
        setShowForm(false);
        setForm({ ten_nhiem_vu: "", mo_ta: "", han_nop: "" });
        load();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  // ============ NỘP BÀI ============
  function openSubmitDialog(taskId: number) {
    currentTaskIdRef.current = taskId;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentTaskIdRef.current) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File tối đa 20MB");
      e.target.value = "";
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      const { data } = await api.post(
        `/api/student/tasks/${currentTaskIdRef.current}/submit`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (data.success) {
        toast.success("Đã nộp bài thành công!");
        load();
      } else {
        toast.error(data.message);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Lỗi");
    } finally {
      e.target.value = "";
      currentTaskIdRef.current = null;
    }
  }

  // ============ XÓA ============
  async function handleDelete(id: number, name: string) {
    if (!confirm(`Xóa nhiệm vụ "${name}"?`)) return;
    try {
      const { data } = await api.delete(`/api/student/tasks/${id}`);
      if (data.success) {
        toast.success("Đã xóa");
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi");
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

  // Stats
  const stats = {
    total: items.length,
    dang_lam: items.filter((i) => i.trang_thai === "dang_lam").length,
    cho_duyet: items.filter((i) => i.trang_thai === "cho_duyet").length,
    hoan_thanh: items.filter((i) => i.trang_thai === "hoan_thanh").length,
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nhiệm vụ</h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý công việc và nộp bài
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Thêm nhiệm vụ
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatBox label="Tổng" value={stats.total} color="slate" />
        <StatBox label="Đang làm" value={stats.dang_lam} color="blue" />
        <StatBox label="Chờ duyệt" value={stats.cho_duyet} color="amber" />
        <StatBox label="Hoàn thành" value={stats.hoan_thanh} color="emerald" />
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Thêm nhiệm vụ cá nhân</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên nhiệm vụ *
              </label>
              <input
                type="text"
                required
                value={form.ten_nhiem_vu}
                onChange={(e) => setForm({ ...form, ten_nhiem_vu: e.target.value })}
                placeholder="VD: Hoàn thành báo cáo tuần"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                value={form.mo_ta}
                onChange={(e) => setForm({ ...form, mo_ta: e.target.value })}
                rows={3}
                placeholder="Chi tiết..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hạn nộp
              </label>
              <input
                type="datetime-local"
                value={form.han_nop}
                onChange={(e) => setForm({ ...form, han_nop: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Thêm
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có nhiệm vụ nào</p>
          <p className="text-xs mt-1">
            Nhiệm vụ sẽ tự động xuất hiện khi bạn được nhận vào làm
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => {
            const st = STATUS_MAP[t.trang_thai] || STATUS_MAP.dang_lam;
            const isDone = t.trang_thai === "hoan_thanh";
            const canSubmit = !isDone && t.trang_thai !== "cho_duyet";

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {t.ten_nhiem_vu}
                        </div>
                        {t.ten_viec && (
                          <div className="text-xs text-slate-500 mt-0.5 truncate">
                            📁 {t.ten_viec}
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    {t.mo_ta && (
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                        {t.mo_ta}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                      {t.han_nop && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Hạn: {fmtDateTime(t.han_nop)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Tạo: {fmtDate(t.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                      {canSubmit && (
                        <button
                          onClick={() => openSubmitDialog(t.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {t.file_san_pham ? "Nộp lại" : "Nộp bài"}
                        </button>
                      )}
                      {t.file_san_pham && (
                        <a
                          href={`http://localhost:4000/${t.file_san_pham}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem file
                        </a>
                      )}
                      {!t.viec_lam_id && (
                        <button
                          onClick={() => handleDelete(t.id, t.ten_nhiem_vu)}
                          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
  color: "slate" | "blue" | "amber" | "emerald";
}) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-xl font-bold mt-0.5">{value}</div>
    </div>
  );
}