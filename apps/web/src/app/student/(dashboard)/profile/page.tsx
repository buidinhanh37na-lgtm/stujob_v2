"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, User, Phone, School, BookOpen, GraduationCap, Award,
  Plus, Trash2, Save, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface KyNang {
  id?: number;
  ten_ky_nang: string;
  muc_do: string;
}

const MUC_DO_OPTIONS = [
  { value: "co_ban", label: "Cơ bản" },
  { value: "trung_binh", label: "Trung bình" },
  { value: "kha", label: "Khá" },
  { value: "gioi", label: "Giỏi" },
  { value: "xuat_sac", label: "Xuất sắc" },
];

export default function ProfilePage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ho_ten: "",
    ma_sinh_vien: "",
    email: "",
    so_dien_thoai: "",
    truong: "",
    khoa: "",
    chuyen_nganh: "",
    nam_hoc: "",
    gpa: "",
    mo_ta: "",
  });

  const [skills, setSkills] = useState<KyNang[]>([]);

  // ============ LOAD PROFILE ============
  useEffect(() => {
    if (authLoading) return;

    async function load() {
      try {
        const { data } = await api.get("/api/student/profile");
        if (!data.success) {
          setError("Không tải được hồ sơ");
          return;
        }
        const sv = data.sinh_vien;
        setForm({
          ho_ten: sv.ho_ten || "",
          ma_sinh_vien: sv.ma_sinh_vien || "",
          email: sv.email || "",
          so_dien_thoai: sv.so_dien_thoai || "",
          truong: sv.truong || "",
          khoa: sv.khoa || "",
          chuyen_nganh: sv.chuyen_nganh || "",
          nam_hoc: sv.nam_hoc?.toString() || "",
          gpa: sv.gpa?.toString() || "",
          mo_ta: sv.mo_ta || "",
        });
        setSkills(data.ky_nang || []);
      } catch {
        setError("Lỗi kết nối");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading]);

  // ============ UPDATE FIELD ============
  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ============ SKILL ACTIONS ============
  function addSkill() {
    setSkills((prev) => [...prev, { ten_ky_nang: "", muc_do: "trung_binh" }]);
  }

  function updateSkill(index: number, field: keyof KyNang, value: string) {
    setSkills((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeSkill(index: number) {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }

  // ============ SUBMIT ============
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Validate
    if (!form.ho_ten.trim()) return setError("Họ tên không được rỗng");

    const namHoc = form.nam_hoc ? parseInt(form.nam_hoc, 10) : null;
    if (namHoc !== null && (namHoc < 1 || namHoc > 6))
      return setError("Năm học từ 1 đến 6");

    const gpa = form.gpa ? parseFloat(form.gpa) : null;
    if (gpa !== null && (gpa < 0 || gpa > 4))
      return setError("GPA từ 0 đến 4");

    const validSkills = skills
      .filter((s) => s.ten_ky_nang.trim())
      .map((s) => ({
        ten_ky_nang: s.ten_ky_nang.trim(),
        muc_do: s.muc_do,
      }));

    setSaving(true);
    try {
      const { data } = await api.put("/api/student/profile", {
        ho_ten: form.ho_ten,
        so_dien_thoai: form.so_dien_thoai,
        truong: form.truong,
        khoa: form.khoa,
        chuyen_nganh: form.chuyen_nganh,
        nam_hoc: namHoc,
        gpa,
        mo_ta: form.mo_ta,
        ky_nang: validSkills,
      });

      if (!data.success) {
        setError(data.message || "Lưu thất bại");
        return;
      }
      toast.success("Đã lưu hồ sơ thành công!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải hồ sơ...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h2>
        <p className="text-slate-500 text-sm mt-1">
          Cập nhật thông tin để NTD dễ dàng tìm thấy bạn
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* CARD 1 — THÔNG TIN CÁ NHÂN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          Thông tin cá nhân
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Họ tên *" icon={<User className="w-4 h-4" />}>
            <input
              type="text"
              value={form.ho_ten}
              onChange={(e) => update("ho_ten", e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </Field>

          <Field label="MSSV (không sửa được)">
            <input
              type="text"
              value={form.ma_sinh_vien}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
            />
          </Field>

          <Field label="Email (không sửa được)">
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
            />
          </Field>

          <Field label="Số điện thoại" icon={<Phone className="w-4 h-4" />}>
            <input
              type="tel"
              value={form.so_dien_thoai}
              onChange={(e) => update("so_dien_thoai", e.target.value)}
              placeholder="09xx xxx xxx"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </Field>

          <Field label="Trường" icon={<School className="w-4 h-4" />}>
            <input
              type="text"
              value={form.truong}
              onChange={(e) => update("truong", e.target.value)}
              placeholder="VD: ĐH Bách Khoa"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </Field>

          <Field label="Khoa" icon={<BookOpen className="w-4 h-4" />}>
            <input
              type="text"
              value={form.khoa}
              onChange={(e) => update("khoa", e.target.value)}
              placeholder="VD: Công nghệ thông tin"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </Field>

          <Field
            label="Chuyên ngành"
            icon={<GraduationCap className="w-4 h-4" />}
          >
            <input
              type="text"
              value={form.chuyen_nganh}
              onChange={(e) => update("chuyen_nganh", e.target.value)}
              placeholder="VD: Kỹ thuật phần mềm"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </Field>

          <Field label="Năm học (1-6)" icon={<BookOpen className="w-4 h-4" />}>
            <input
              type="number"
              min={1}
              max={6}
              value={form.nam_hoc}
              onChange={(e) => update("nam_hoc", e.target.value)}
              placeholder="VD: 3"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </Field>

          <Field label="GPA (0-4)" icon={<Award className="w-4 h-4" />}>
            <input
              type="number"
              step="0.01"
              min={0}
              max={4}
              value={form.gpa}
              onChange={(e) => update("gpa", e.target.value)}
              placeholder="VD: 3.50"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </Field>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Giới thiệu bản thân
          </label>
          <textarea
            value={form.mo_ta}
            onChange={(e) => update("mo_ta", e.target.value)}
            rows={4}
            placeholder="Giới thiệu ngắn về bản thân, sở thích, mục tiêu nghề nghiệp..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-y"
          />
        </div>
      </div>

      {/* CARD 2 — KỸ NĂNG */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Kỹ năng chuyên môn
          </h3>
          <button
            type="button"
            onClick={addSkill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm kỹ năng
          </button>
        </div>

        {skills.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
  Chưa có kỹ năng nào. Nhấn &quot;Thêm kỹ năng&quot; để bắt đầu.
</div>
        ) : (
          <div className="space-y-3">
            {skills.map((skill, i) => (
              <div
                key={i}
                className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={skill.ten_ky_nang}
                    onChange={(e) => updateSkill(i, "ten_ky_nang", e.target.value)}
                    placeholder="VD: JavaScript, Thiết kế đồ họa..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
                <div className="w-40 flex-shrink-0">
                  <select
                    value={skill.muc_do}
                    onChange={(e) => updateSkill(i, "muc_do", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  >
                    {MUC_DO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeSkill(i)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex items-center gap-3 sticky bottom-4 bg-white/80 backdrop-blur p-3 rounded-2xl border border-slate-200">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lưu thông tin
            </>
          )}
        </button>
        <span className="text-xs text-slate-500">
          Thay đổi sẽ được áp dụng ngay
        </span>
      </div>
    </form>
  );
}

// ============================================================
// Field helper
// ============================================================
function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}