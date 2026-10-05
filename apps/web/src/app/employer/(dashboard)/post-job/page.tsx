"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2,
  AlertCircle,
  Send,
  Wallet,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface Category {
  id: number;
  ten_nhom: string;
  icon: string | null;
}

interface Template {
  id: number;
  ten_mau: string;
  tieu_de_goi_y: string | null;
  mo_ta_goi_y: string | null;
  ky_nang_goi_y: string | null;
  luong_min: number | null;
  luong_max: number | null;
}

type JobType = "remote" | "onsite";

interface JobDraft {
  nhom_viec?: string;
  tieu_de?: string;
  mo_ta?: string;
  ky_nang_can?: string;
  thu_lao?: number;
  loai_cong_viec?: string;
  so_luong_can?: number;
  so_buoi?: number;
  gio_uoc_tinh?: number;
  han_chot?: string;
  han_nop_file?: string;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  dia_chi_lam_viec?: string;
}

const JOB_DRAFT_KEY = "stujob_job_draft";

const EMPTY_FORM = {
  nhom_viec_id: "",
  tieu_de: "",
  mo_ta: "",
  ky_nang_can: "",
  thu_lao: "",
  so_luong_can: "1",
  so_buoi: "1",
  gio_uoc_tinh: "0",
  // Remote
  han_chot: "",
  han_nop_remote: "",
  // Onsite
  han_chot_onsite: "",
  ngay_bat_dau: "",
  ngay_ket_thuc: "",
  han_nop_onsite: "",
  dia_chi_lam_viec: "",
};

export default function PostJobPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [jobType, setJobType] = useState<JobType>("remote");

  const [form, setForm] = useState({ ...EMPTY_FORM });

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const { data } = await api.get("/api/employer/templates/categories");
        if (data.success) setCategories(data.items || []);
      } catch {
        toast.error("Không tải được danh mục");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  // ============================================================
  // AUTO-FILL TỪ CHATBOT
  // Chỉ chạy khi: auth OK + categories đã load
  // ============================================================
  useEffect(() => {
    if (authLoading || loading) return;

    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(JOB_DRAFT_KEY);
    } catch {
      // ignore
    }
    if (!raw) return;

    // Đọc + xóa ngay để không fill lại khi re-render
    try {
      sessionStorage.removeItem(JOB_DRAFT_KEY);
    } catch {}

    let draft: JobDraft;
    try {
      draft = JSON.parse(raw);
    } catch {
      console.warn("[Auto-fill] JSON parse error");
      return;
    }

    // Xác định loại công việc
    const isOnsite = draft.loai_cong_viec === "onsite";
    setJobType(isOnsite ? "onsite" : "remote");

    // Set form fields
    setForm((prev) => ({
      ...prev,
      tieu_de: draft.tieu_de || prev.tieu_de,
      mo_ta: draft.mo_ta || prev.mo_ta,
      ky_nang_can: draft.ky_nang_can || prev.ky_nang_can,
      thu_lao: draft.thu_lao != null ? String(draft.thu_lao) : prev.thu_lao,
      so_luong_can:
        draft.so_luong_can != null ? String(draft.so_luong_can) : prev.so_luong_can,
      so_buoi: draft.so_buoi != null ? String(draft.so_buoi) : prev.so_buoi,
      gio_uoc_tinh:
        draft.gio_uoc_tinh != null ? String(draft.gio_uoc_tinh) : prev.gio_uoc_tinh,

      // Dates (map cho cả 2 loại)
      han_chot: draft.han_chot || prev.han_chot,
      han_nop_remote: draft.han_nop_file || prev.han_nop_remote,
      han_chot_onsite: draft.han_chot || prev.han_chot_onsite,
      ngay_bat_dau: draft.ngay_bat_dau || prev.ngay_bat_dau,
      ngay_ket_thuc: draft.ngay_ket_thuc || prev.ngay_ket_thuc,
      han_nop_onsite: draft.han_nop_file || prev.han_nop_onsite,
      dia_chi_lam_viec: draft.dia_chi_lam_viec || prev.dia_chi_lam_viec,
    }));

    // Match nhóm việc: tìm category khớp tên → auto load template
    if (draft.nhom_viec && categories.length > 0) {
      const target = draft.nhom_viec.toLowerCase().trim();
      const matched = categories.find((c) => {
        const name = c.ten_nhom.toLowerCase().trim();
        return name === target || name.includes(target) || target.includes(name);
      });

      if (matched) {
        setForm((prev) => ({ ...prev, nhom_viec_id: String(matched.id) }));
        // Load templates cho nhóm này
        api
          .get(`/api/employer/templates/templates?nhom_viec_id=${matched.id}`)
          .then(({ data }) => {
            if (data.success) setTemplates(data.items || []);
          })
          .catch(() => {});
      }
    }

    // Toast + scroll
    setTimeout(() => {
      toast.success("✅ Đã điền thông tin từ chatbot!");
      document
        .getElementById("jobForm")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, loading, categories]);

  // ============================================================
  // HANDLERS
  // ============================================================
  async function onCategoryChange(nhomId: string) {
    setForm((prev) => ({ ...prev, nhom_viec_id: nhomId }));
    setTemplates([]);
    if (!nhomId) return;
    try {
      const { data } = await api.get(
        `/api/employer/templates/templates?nhom_viec_id=${nhomId}`
      );
      if (data.success) setTemplates(data.items || []);
    } catch {
      // ignore
    }
  }

  function applyTemplate(tplId: string) {
    if (!tplId) return;
    const t = templates.find((x) => x.id === Number(tplId));
    if (!t) return;
    setForm((prev) => ({
      ...prev,
      tieu_de: t.tieu_de_goi_y || prev.tieu_de,
      mo_ta: t.mo_ta_goi_y || prev.mo_ta,
      ky_nang_can: t.ky_nang_goi_y || prev.ky_nang_can,
      thu_lao: t.luong_min?.toString() || prev.thu_lao,
    }));
    toast.success("Đã điền mẫu tin");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.tieu_de.trim()) return setError("Nhập tiêu đề");
    if (!form.thu_lao || Number(form.thu_lao) <= 0)
      return setError("Nhập thù lao");

    const payload: Record<string, unknown> = {
      nhom_viec_id: form.nhom_viec_id ? Number(form.nhom_viec_id) : null,
      tieu_de: form.tieu_de,
      mo_ta: form.mo_ta,
      ky_nang_can: form.ky_nang_can,
      thu_lao: Number(form.thu_lao),
      loai_cong_viec: jobType,
      so_luong_can: Number(form.so_luong_can) || 1,
      so_buoi: Number(form.so_buoi) || 1,
      gio_uoc_tinh: Number(form.gio_uoc_tinh) || 0,
    };

    if (jobType === "remote") {
      if (!form.han_chot) return setError("Chọn hạn ứng tuyển");
      if (!form.han_nop_remote) return setError("Chọn hạn nộp sản phẩm");
      if (form.han_nop_remote < form.han_chot)
        return setError("Hạn nộp phải sau hạn ứng tuyển");
      payload.han_chot = form.han_chot;
      payload.han_nop_file = form.han_nop_remote;
      payload.ngay_bat_dau = null;
      payload.ngay_ket_thuc = null;
      payload.dia_chi_lam_viec = "";
    } else {
      if (!form.han_chot_onsite) return setError("Chọn hạn ứng tuyển");
      if (!form.ngay_bat_dau || !form.ngay_ket_thuc)
        return setError("Chọn ngày bắt đầu và kết thúc");
      if (!form.han_nop_onsite) return setError("Chọn hạn nộp sản phẩm");
      if (!form.dia_chi_lam_viec.trim()) return setError("Nhập địa chỉ");
      if (form.ngay_bat_dau > form.ngay_ket_thuc)
        return setError("Ngày kết thúc phải sau ngày bắt đầu");
      if (form.han_chot_onsite > form.ngay_bat_dau)
        return setError("Hạn ứng tuyển phải trước ngày bắt đầu");
      if (form.han_nop_onsite < form.ngay_ket_thuc)
        return setError("Hạn nộp phải sau ngày kết thúc");
      payload.han_chot = form.han_chot_onsite;
      payload.ngay_bat_dau = form.ngay_bat_dau;
      payload.ngay_ket_thuc = form.ngay_ket_thuc;
      payload.han_nop_file = form.han_nop_onsite;
      payload.dia_chi_lam_viec = form.dia_chi_lam_viec;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/api/employer/post-job", payload);
      if (data.success) {
        toast.success(data.message);
        setForm({ ...EMPTY_FORM });
        setTemplates([]);
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
    <form
      id="jobForm"
      onSubmit={handleSubmit}
      className="space-y-5 max-w-4xl mx-auto"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Đăng tin việc</h2>
        <p className="text-slate-500 text-sm mt-1">
          Điền thông tin để đăng tin tuyển dụng
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Chọn nhóm + mẫu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">
          1️⃣ Chọn nhóm việc & mẫu tin
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nhóm việc
            </label>
            <select
              id="j_nhom"
              value={form.nhom_viec_id}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">-- Chọn nhóm --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || "📁"} {c.ten_nhom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mẫu tin (tùy chọn)
            </label>
            <select
              id="j_mau"
              onChange={(e) => applyTemplate(e.target.value)}
              disabled={!templates.length}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-50"
            >
              <option value="">
                {templates.length
                  ? "-- Chọn mẫu --"
                  : "-- Chọn nhóm trước --"}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ten_mau}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Nội dung */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">
          2️⃣ Nội dung tin việc
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tiêu đề *
            </label>
            <input
              id="j_tieude"
              type="text"
              required
              value={form.tieu_de}
              onChange={(e) => setForm({ ...form, tieu_de: e.target.value })}
              placeholder="VD: Gia sư Toán lớp 10"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mô tả
            </label>
            <textarea
              id="j_mota"
              value={form.mo_ta}
              onChange={(e) => setForm({ ...form, mo_ta: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kỹ năng cần (cách nhau dấu phẩy)
            </label>
            <input
              id="j_kynang"
              type="text"
              value={form.ky_nang_can}
              onChange={(e) =>
                setForm({ ...form, ky_nang_can: e.target.value })
              }
              placeholder="VD: Toán, Sư phạm"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Loại công việc — CHỈ remote + onsite, KHÔNG hybrid */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Hình thức làm việc *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "remote" as JobType, label: "🌐 Online" },
                { v: "onsite" as JobType, label: "🏢 Offline" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  id={`j_loai_${opt.v}`}
                  type="button"
                  onClick={() => setJobType(opt.v)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                    jobType === opt.v
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thù lao */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Thù lao (VNĐ) *
            </label>
            <div className="relative">
              <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="j_thulao"
                type="number"
                required
                min={0}
                step={1000}
                value={form.thu_lao}
                onChange={(e) =>
                  setForm({ ...form, thu_lao: e.target.value })
                }
                placeholder="VD: 2000000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Remote dates */}
          {jobType === "remote" && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ⏰ Hạn ứng tuyển *
                </label>
                <input
                  id="j_han"
                  type="date"
                  required
                  value={form.han_chot}
                  onChange={(e) =>
                    setForm({ ...form, han_chot: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  📤 Hạn nộp sản phẩm *
                </label>
                <input
                  id="j_han_nop_r"
                  type="date"
                  required
                  value={form.han_nop_remote}
                  onChange={(e) =>
                    setForm({ ...form, han_nop_remote: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>
          )}

          {/* Onsite dates */}
          {jobType === "onsite" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ⏰ Hạn ứng tuyển *
                </label>
                <input
                  id="j_han_onsite"
                  type="date"
                  required
                  value={form.han_chot_onsite}
                  onChange={(e) =>
                    setForm({ ...form, han_chot_onsite: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    📅 Ngày bắt đầu *
                  </label>
                  <input
                    id="j_ngay_bd"
                    type="date"
                    required
                    value={form.ngay_bat_dau}
                    onChange={(e) =>
                      setForm({ ...form, ngay_bat_dau: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    📅 Ngày kết thúc *
                  </label>
                  <input
                    id="j_ngay_kt"
                    type="date"
                    required
                    value={form.ngay_ket_thuc}
                    onChange={(e) =>
                      setForm({ ...form, ngay_ket_thuc: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  📤 Hạn nộp sản phẩm *
                </label>
                <input
                  id="j_han_nop_o"
                  type="date"
                  required
                  value={form.han_nop_onsite}
                  onChange={(e) =>
                    setForm({ ...form, han_nop_onsite: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  📍 Địa chỉ làm việc *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="j_diachi"
                    type="text"
                    required
                    value={form.dia_chi_lam_viec}
                    onChange={(e) =>
                      setForm({ ...form, dia_chi_lam_viec: e.target.value })
                    }
                    placeholder="VD: 123 Lê Lợi, Q.1, TP.HCM"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Số lượng + buổi + giờ */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số lượng
              </label>
              <input
                id="j_soluong"
                type="number"
                min={1}
                value={form.so_luong_can}
                onChange={(e) =>
                  setForm({ ...form, so_luong_can: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số buổi
              </label>
              <input
                id="j_sobuoi"
                type="number"
                min={1}
                value={form.so_buoi}
                onChange={(e) =>
                  setForm({ ...form, so_buoi: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Giờ ước tính
              </label>
              <input
                id="j_giouoc"
                type="number"
                min={0}
                value={form.gio_uoc_tinh}
                onChange={(e) =>
                  setForm({ ...form, gio_uoc_tinh: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-4 bg-white/80 backdrop-blur p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-lg shadow-sky-600/20 disabled:opacity-60 transition"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đăng...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Đăng tin
            </>
          )}
        </button>
        <span className="text-xs text-slate-500">
          5 tin đầu miễn phí • Từ tin 6 phí 10%
        </span>
      </div>
    </form>
  );
}