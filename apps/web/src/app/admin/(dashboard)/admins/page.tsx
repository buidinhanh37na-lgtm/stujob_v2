"use client";

import { useEffect, useState } from "react";
import { Loader2, Crown, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDateTime } from "@/lib/utils";

type AdminRole = "super_admin" | "admin" | "moderator" | "support";
type AdminStatus = "hoat_dong" | "bi_khoa";

interface AdminItem {
  id: number;
  ho_ten: string;
  email: string;
  vai_tro: AdminRole;
  trang_thai: AdminStatus;
  last_login: string | null;
  created_at: string;
}

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Kiểm duyệt viên",
  support: "Hỗ trợ",
};

export default function AdminAdminsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminItem | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const me = await api.get("/api/auth/admin/me");
        if (me.data.success) setCurrentRole(me.data.admin?.vai_tro || "");
      } catch {}
    })();
  }, [authLoading]);

  const isSuper = currentRole === "super_admin";

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/admins/list");
      if (data.success) setItems(data.items || []);
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

  async function handleDelete(id: number) {
    if (!confirm("Xóa admin này?")) return;
    try {
      const { data } = await api.delete(`/api/admin/admins/delete?id=${id}`);
      toast.success(data.message || "Đã xóa");
      load();
    } catch {
      toast.error("Lỗi xóa");
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
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-500" />
            Quản trị viên
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý tài khoản admin và phân quyền
          </p>
        </div>
        {isSuper && (
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Thêm admin
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wide">
                  <th className="text-left p-3 font-bold">Họ tên</th>
                  <th className="text-left p-3 font-bold">Email</th>
                  <th className="text-left p-3 font-bold">Vai trò</th>
                  <th className="text-left p-3 font-bold">Trạng thái</th>
                  <th className="text-left p-3 font-bold">Đăng nhập cuối</th>
                  {isSuper && (
                    <th className="text-right p-3 font-bold"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3 font-semibold text-slate-700">
                      {it.ho_ten}
                    </td>
                    <td className="p-3 text-slate-600">{it.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-semibold">
                        {ROLE_LABEL[it.vai_tro] || it.vai_tro}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          it.trang_thai === "hoat_dong"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {it.trang_thai === "hoat_dong"
                          ? "Hoạt động"
                          : "Bị khóa"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap text-xs">
                      {it.last_login ? fmtDateTime(it.last_login) : "Chưa"}
                    </td>
                    {isSuper && (
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditItem(it);
                            setModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold mr-1.5"
                        >
                          <Pencil className="w-3 h-3" />
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(it.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <AdminFormModal
          item={editItem}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AdminFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: AdminItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!item;
  const [hoTen, setHoTen] = useState(item?.ho_ten || "");
  const [email, setEmail] = useState(item?.email || "");
  const [matKhau, setMatKhau] = useState("");
  const [vaiTro, setVaiTro] = useState<AdminRole>(item?.vai_tro || "admin");
  const [trangThai, setTrangThai] = useState<AdminStatus>(
    item?.trang_thai || "hoat_dong"
  );
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!hoTen.trim()) return toast.error("Nhập họ tên");
    if (!isEdit && !email.trim()) return toast.error("Nhập email");
    if (!isEdit && matKhau.length < 6)
      return toast.error("Mật khẩu tối thiểu 6 ký tự");

    setBusy(true);
    try {
      const payload: any = isEdit
        ? {
            id: item!.id,
            ho_ten: hoTen,
            vai_tro: vaiTro,
            trang_thai: trangThai,
          }
        : { ho_ten: hoTen, email, mat_khau: matKhau, vai_tro: vaiTro };
      if (isEdit && matKhau) payload.mat_khau = matKhau;

      const { data } = isEdit
        ? await api.post("/api/admin/admins/update", payload)
        : await api.post("/api/admin/admins/create", payload);

      toast.success(data.message || "OK");
      onSaved();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="border-b border-slate-200 px-5 py-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">
            {isEdit ? "✏️ Sửa admin" : "➕ Thêm admin"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Họ tên *">
            <input
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </Field>

          <Field label="Email *">
            <input
              type="email"
              value={email}
              disabled={isEdit}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:bg-slate-50"
            />
          </Field>

          <Field
            label={
              isEdit ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu *"
            }
          >
            <input
              type="password"
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </Field>

          <Field label="Vai trò">
            <select
              value={vaiTro}
              onChange={(e) => setVaiTro(e.target.value as AdminRole)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="admin">Admin</option>
              <option value="moderator">Kiểm duyệt viên</option>
              <option value="support">Hỗ trợ</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </Field>

          {isEdit && (
            <Field label="Trạng thái">
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as AdminStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="hoat_dong">Hoạt động</option>
                <option value="bi_khoa">Khóa</option>
              </select>
            </Field>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold"
          >
            Huỷ
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Đang lưu..." : isEdit ? "💾 Lưu" : "➕ Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}