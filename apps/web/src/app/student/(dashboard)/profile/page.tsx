"use client";

import { useEffect, useState } from "react";
import {
  Loader2, User, Plus, X, Save, GraduationCap, Phone,
  BookOpen, Award, FileText,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";

interface SkillItem {
  ten_ky_nang: string;
  muc_do: string;
}

interface ProfileForm {
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  truong: string;
  khoa: string;
  chuyen_nganh: string;
  nam_hoc: number | null;
  gpa: number | null;
  mo_ta: string;
}

const MUC_DO_OPTIONS = [
  { value: "co_ban", label: "Cơ bản" },
  { value: "trung_binh", label: "Trung bình" },
  { value: "kha", label: "Khá" },
  { value: "gioi", label: "Giỏi" },
  { value: "xuat_sac", label: "Xuất sắc" },
];

const MUC_DO_COLOR: Record<string, string> = {
  co_ban: "bg-slate-100 text-slate-600",
  trung_binh: "bg-blue-100 text-blue-700",
  kha: "bg-indigo-100 text-indigo-700",
  gioi: "bg-purple-100 text-purple-700",
  xuat_sac: "bg-emerald-100 text-emerald-700",
};

export default function StudentProfilePage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");
  const setStudent = useAuthStore((s) => s.setStudent);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    ho_ten: "",
    email: "",
    so_dien_thoai: "",
    truong: "",
    khoa: "",
    chuyen_nganh: "",
    nam_hoc: null,
    gpa: null,
    mo_ta: "",
  });
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("trung_binh");

  // Load profile
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const { data } = await api.get("/api/student/profile");
        if (data.success) {
          const sv = data.sinh_vien;
          setForm({
            ho_ten: sv.ho_ten || "",
            email: sv.email || "",
            so_dien_thoai: sv.so_dien_thoai || "",
            truong: sv.truong || "",
            khoa: sv.khoa || "",
            chuyen_nganh: sv.chuyen_nganh || "",
            nam_hoc: sv.nam_hoc ?? null,
            gpa: sv.gpa != null ? Number(sv.gpa) : null,
            mo_ta: sv.mo_ta || "",
          });
          setSkills(data.ky_nang || []);
        }
      } catch {
        toast.error("Không tải được hồ sơ");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    if (skills.some((s) => s.ten_ky_nang.toLowerCase() === name.toLowerCase())) {
      toast.error("Kỹ năng đã tồn tại");
      return;
    }
    setSkills((prev) => [...prev, { ten_ky_nang: name, muc_do: newSkillLevel }]);
    setNewSkillName("");
  }

  function removeSkill(idx: number) {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateSkillLevel(idx: number, muc_do: string) {
    setSkills((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, muc_do } : s))
    );
  }

  async function handleSave() {
    if (!form.ho_ten.trim()) {
      toast.error("Họ tên không được rỗng");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ho_ten: form.ho_ten.trim(),
        so_dien_thoai: form.so_dien_thoai.trim(),
        truong: form.truong.trim(),
        khoa: form.khoa.trim(),
        chuyen_nganh: form.chuyen_nganh.trim(),
        nam_hoc: form.nam_hoc,
        gpa: form.gpa,
        mo_ta: form.mo_ta.trim(),
        ky_nang: skills,
      };

      const { data } = await api.put("/api/student/profile", payload);
      if (data.success) {
        toast.success("Đã lưu hồ sơ!");
        // Update store để sidebar/dashboard refresh
        const me = await api.get("/api/auth/student/me");
        if (me.data.success && me.data.sinh_vien) {
          setStudent(me.data.sinh_vien);
        }
      } else {
        toast.error(data.message || "Lỗi lưu");
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Lỗi kết nối");
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-500" />
          Hồ sơ & Kỹ năng
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Cập nhật thông tin cá nhân và kỹ năng để nhận gợi ý việc làm tốt hơn
        </p>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-500" />
          Thông tin cơ bản
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Họ tên *">
            <input
              value={form.ho_ten}
              onChange={(e) => updateField("ho_ten", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </Field>

          <Field label="Email (không thể đổi)">
            <input
              value={form.email}
              disabled
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </Field>

          <Field label="Số điện thoại" icon={<Phone className="w-3.5 h-3.5" />}>
            <input
              value={form.so_dien_thoai}
              onChange={(e) => updateField("so_dien_thoai", e.target.value)}
              placeholder="0912345678"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </Field>

          <Field label="Trường">
            <input
              value={form.truong}
              onChange={(e) => updateField("truong", e.target.value)}
              placeholder="Đại học Công nghệ Kỹ thuật Vinh"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </Field>

          <Field label="Khoa">
            <input
              value={form.khoa}
              onChange={(e) => updateField("khoa", e.target.value)}
              placeholder="Công nghệ thông tin"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </Field>

          <Field label="Chuyên ngành">
            <input
              value={form.chuyen_nganh}
              onChange={(e) => updateField("chuyen_nganh", e.target.value)}
              placeholder="Kỹ thuật phần mềm"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </Field>

          <Field label="Năm học" icon={<BookOpen className="w-3.5 h-3.5" />}>
            <select
              value={form.nam_hoc ?? ""}
              onChange={(e) =>
                updateField(
                  "nam_hoc",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">-- Chưa chọn --</option>
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </Field>

          <Field label="GPA (hệ 4.0)" icon={<Award className="w-3.5 h-3.5" />}>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={form.gpa ?? ""}
              onChange={(e) =>
                updateField(
                  "gpa",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder="3.50"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Giới thiệu bản thân" icon={<FileText className="w-3.5 h-3.5" />}>
            <textarea
              value={form.mo_ta}
              onChange={(e) => updateField("mo_ta", e.target.value)}
              rows={4}
              placeholder="VD: Sinh viên năm 3 CNTT, có kinh nghiệm làm freelance web..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </Field>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          🛠️ Kỹ năng
          <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            {skills.length}
          </span>
        </h3>

        {/* List */}
        {skills.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            Chưa có kỹ năng nào. Thêm kỹ năng để tăng điểm phù hợp với việc làm.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((s, idx) => (
              <div
                key={idx}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  MUC_DO_COLOR[s.muc_do] || "bg-slate-100 text-slate-700"
                } border-transparent`}
              >
                <span className="text-sm font-semibold">{s.ten_ky_nang}</span>
                <select
                  value={s.muc_do}
                  onChange={(e) => updateSkillLevel(idx, e.target.value)}
                  className="text-xs bg-transparent font-medium cursor-pointer focus:outline-none"
                >
                  {MUC_DO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeSkill(idx)}
                  className="p-0.5 rounded-full hover:bg-black/10 transition"
                  aria-label="Xóa"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add skill */}
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <input
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="VD: JavaScript, Photoshop, Content..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
          >
            {MUC_DO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={addSkill}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          💡 Kỹ năng chiếm <b>35 điểm</b> trong thuật toán gợi ý việc làm. Càng
          chính xác càng tốt!
        </p>
      </div>

      {/* Save button */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-lg flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500 hidden sm:block">
            Thay đổi chưa lưu sẽ mất khi rời trang
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu hồ sơ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FIELD WRAPPER
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
      <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 mb-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}