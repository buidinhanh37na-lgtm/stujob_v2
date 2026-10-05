"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import {
  Loader2, Upload, FileText, Trash2, Eye, Plus, X, Calendar,
  Building2, Award, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDate } from "@/lib/utils";

interface Certificate {
  id: number;
  ten_chung_chi: string;
  to_chuc: string | null;
  ngay_cap: string | null;
  file_url: string | null;
  created_at: string;
}

export default function CertificatesPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");

  const [list, setList] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ten_chung_chi: "",
    to_chuc: "",
    ngay_cap: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ LOAD LIST ============
  async function load() {
    try {
      const { data } = await api.get("/api/student/certificates");
      if (data.success) setList(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading]);

  // ============ SUBMIT ============
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.ten_chung_chi.trim()) return setError("Vui lòng nhập tên chứng chỉ");
    if (!file) return setError("Vui lòng chọn file");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("ten_chung_chi", form.ten_chung_chi);
      fd.append("to_chuc", form.to_chuc);
      fd.append("ngay_cap", form.ngay_cap);
      fd.append("file", file);

      const { data } = await api.post("/api/student/certificates", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data.success) {
        setError(data.message || "Tải lên thất bại");
        return;
      }

      toast.success("Đã tải lên chứng chỉ!");
      resetForm();
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm({ ten_chung_chi: "", to_chuc: "", ngay_cap: "" });
    setFile(null);
    setShowForm(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ============ DELETE ============
  async function handleDelete(id: number, name: string) {
    if (!confirm(`Xóa chứng chỉ "${name}"?`)) return;
    try {
      const { data } = await api.delete(`/api/student/certificates/${id}`);
      if (data.success) {
        toast.success("Đã xóa");
        load();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  }

  // ============ LOADING ============
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
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chứng chỉ</h2>
          <p className="text-slate-500 text-sm mt-1">
            Tải lên các chứng chỉ, bằng cấp, giải thưởng của bạn
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm chứng chỉ
          </button>
        )}
      </div>

      {/* FORM UPLOAD */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Tải lên chứng chỉ mới
            </h3>
            <button
              onClick={resetForm}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
                Tên chứng chỉ *
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={form.ten_chung_chi}
                  onChange={(e) =>
                    setForm({ ...form, ten_chung_chi: e.target.value })
                  }
                  placeholder="VD: IELTS 6.5, Google Data Analytics..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tổ chức cấp
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={form.to_chuc}
                    onChange={(e) =>
                      setForm({ ...form, to_chuc: e.target.value })
                    }
                    placeholder="VD: British Council"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày cấp
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={form.ngay_cap}
                    onChange={(e) =>
                      setForm({ ...form, ngay_cap: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* File input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                File đính kèm * (ảnh/PDF, tối đa 10MB)
              </label>
              <label
                htmlFor="file-input"
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition"
              >
                <Upload className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {file ? (
                    <>
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-slate-700">
                        Chọn file ảnh hoặc PDF
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        JPG, PNG, WEBP, PDF • Tối đa 10MB
                      </div>
                    </>
                  )}
                </div>
                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </label>
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Tải lên
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">
          Danh sách chứng chỉ ({list.length})
        </h3>

        {list.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Chưa có chứng chỉ nào</p>
            <p className="text-xs mt-1">
  Nhấn &quot;Thêm chứng chỉ&quot; để bắt đầu tải lên
</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((cert) => (
              <div
                key={cert.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {cert.ten_chung_chi}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {cert.to_chuc || "Không rõ tổ chức"}
                    {cert.ngay_cap && ` • Cấp ngày ${fmtDate(cert.ngay_cap)}`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {cert.file_url && (
                    <a
                      href={`http://localhost:4000/${cert.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Xem file"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(cert.id, cert.ten_chung_chi)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}