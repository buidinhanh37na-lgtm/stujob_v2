"use client";

import { useRef, useState } from "react";
import {
  Loader2, Upload, ShieldCheck, ShieldAlert, CheckCircle2,
  XCircle, AlertCircle, FileText, X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";
import Image from "next/image";

interface OCRParsed {
  ma_sinh_vien: string;
  ho_ten: string;
  truong: string;
  khoa: string;
  ngay_sinh: string;
  lop: string;
}

interface VerifyResult {
  success: boolean;
  request_id: number | null;
  ocr: {
    raw_text: string;
    parsed: OCRParsed;
  };
  match: {
    mssv_matches_profile: boolean;
    profile_mssv: string;
    ocr_mssv: string;
  };
  nha_truong: {
    ho_ten: string;
    chuyen_nganh: string | null;
    nam_hoc: number | null;
    trang_thai: string;
  } | null;
  message: string;
}

export default function StudentVerifyPage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");
  const sinhVien = useAuthStore((s) => s.sinhVien);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh tối đa 8MB");
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setError(null);

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!selectedFile) {
      toast.error("Vui lòng chọn ảnh thẻ sinh viên");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("image", selectedFile);

      const { data } = await api.post("/api/student/verify", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 2 phút cho OCR lần đầu
      });

      if (!data.success) {
        setError(data.message || "Lỗi xử lý OCR");
        return;
      }

      setResult(data);
      toast.success("Đã xử lý ảnh!");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        "Lỗi kết nối. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  if (authLoading || !sinhVien) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  // Đã xác thực rồi
  const alreadyVerified = sinhVien.trang_thai_xac_thuc === "da_xac_thuc";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          Xác thực sinh viên
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Upload ảnh thẻ sinh viên để xác thực tài khoản
        </p>
      </div>

      {/* Status banner */}
      {alreadyVerified && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-emerald-800 text-sm">
              Tài khoản đã được xác thực
            </div>
            <div className="text-emerald-700 text-xs mt-0.5">
              Bạn có thể ứng tuyển tất cả công việc trên sàn
            </div>
          </div>
        </div>
      )}

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          📷 Ảnh thẻ sinh viên
        </h3>

        {/* Preview / Upload */}
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
              <Image
  src={previewUrl}
  alt="Thẻ sinh viên"
  width={800}
  height={600}
  className="w-full max-h-[400px] object-contain"
  unoptimized // ⚠️ BẮT BUỘC: cho blob URL
/>
              <button
                type="button"
                onClick={clearFile}
                disabled={uploading}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur hover:bg-white shadow-md flex items-center justify-center transition disabled:opacity-40"
                aria-label="Xóa ảnh"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              {selectedFile?.name} •{" "}
              {((selectedFile?.size || 0) / 1024).toFixed(0)} KB
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl p-8 flex flex-col items-center justify-center gap-2 transition disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
              <Upload className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="font-semibold text-slate-700 text-sm">
              Chọn ảnh thẻ sinh viên
            </div>
            <div className="text-xs text-slate-500">
              JPG, PNG, WEBP • Tối đa 8MB
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Note */}
        <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <b>Lưu ý:</b> Ảnh cần rõ nét, không bị lóa. Hệ thống sẽ tự động
            nhận dạng MSSV, họ tên, trường và so khớp với hồ sơ của bạn.
          </div>
        </div>

        {/* Submit button */}
        {selectedFile && !result && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full mt-5 py-3 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang nhận dạng... (có thể mất 15-30s)
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Bắt đầu xác thực
              </>
            )}
          </button>
        )}

        {/* Progress hint khi đang OCR */}
        {uploading && (
          <div className="mt-3 text-center text-xs text-slate-500">
            ⏳ Lần đầu chạy OCR sẽ tải dữ liệu nhận dạng (~15-20s). Các lần
            sau nhanh hơn.
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-red-800 text-sm">Lỗi xử lý</div>
            <div className="text-red-700 text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && <ResultPanel result={result} />}
    </div>
  );
}

// ============================================================
// RESULT PANEL
// ============================================================
function ResultPanel({ result }: { result: VerifyResult }) {
  const ok = result.match.mssv_matches_profile;
  const parsed = result.ocr.parsed;

  return (
    <div className="space-y-4">
      {/* Match status */}
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border ${
          ok
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        {ok ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div
            className={`font-bold text-sm ${
              ok ? "text-emerald-800" : "text-amber-800"
            }`}
          >
            {ok ? "✅ Nhận dạng thành công" : "⚠️ Có điểm không khớp"}
          </div>
          <div
            className={`text-xs mt-0.5 ${
              ok ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {result.message}
          </div>
        </div>
      </div>

      {/* Parsed data */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-3 text-sm">
          📋 Thông tin nhận dạng từ ảnh
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow
            label="MSSV"
            value={parsed.ma_sinh_vien}
            highlight={ok}
          />
          <InfoRow label="Họ tên" value={parsed.ho_ten} />
          <InfoRow label="Trường" value={parsed.truong} />
          <InfoRow label="Khoa" value={parsed.khoa} />
          <InfoRow label="Lớp" value={parsed.lop} />
          <InfoRow label="Ngày sinh" value={parsed.ngay_sinh} />
        </div>

        {/* MSSV match detail */}
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <div className="text-[11px] text-slate-500 uppercase tracking-wide">
              MSSV trên ảnh
            </div>
            <div className="font-bold text-slate-800 mt-1">
              {result.match.ocr_mssv || "—"}
            </div>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50">
            <div className="text-[11px] text-slate-500 uppercase tracking-wide">
              MSSV hồ sơ
            </div>
            <div className="font-bold text-slate-800 mt-1">
              {result.match.profile_mssv || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* DB trường match */}
      {result.nha_truong && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">
            🏫 Dữ liệu nhà trường
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="Họ tên" value={result.nha_truong.ho_ten} />
            <InfoRow
              label="Chuyên ngành"
              value={result.nha_truong.chuyen_nganh || ""}
            />
            <InfoRow
              label="Năm học"
              value={result.nha_truong.nam_hoc?.toString() || ""}
            />
            <InfoRow
              label="Trạng thái"
              value={
                result.nha_truong.trang_thai === "dang_hoc"
                  ? "Đang học"
                  : result.nha_truong.trang_thai === "tot_nghiep"
                    ? "Tốt nghiệp"
                    : "Bị đình chỉ"
              }
            />
          </div>
        </div>
      )}

      {/* Raw text (collapsible) */}
      <details className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <summary className="cursor-pointer font-semibold text-slate-700 text-sm">
          🔍 Xem text thô từ OCR
        </summary>
        <pre className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {result.ocr.raw_text || "(trống)"}
        </pre>
      </details>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <div
        className={`font-semibold text-sm truncate ${
          highlight ? "text-emerald-700" : "text-slate-800"
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}