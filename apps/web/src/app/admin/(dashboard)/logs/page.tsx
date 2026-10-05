"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ScrollText, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useConfirm } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

interface LogItem {
  id: number;
  admin_id: number;
  hanh_dong: string;
  doi_tuong_loai: string | null;
  doi_tuong_id: number | null;
  chi_tiet: string | null;
  ip: string | null;
  created_at: string;
  admin_name: string;
  admin_role: string;
}

interface AdminOpt {
  id: number;
  ho_ten: string;
  vai_tro: string;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Kiểm duyệt",
  support: "Hỗ trợ",
};

export default function AdminLogsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");
  const confirm = useConfirm();

  const [items, setItems] = useState<LogItem[]>([]);
  const [admins, setAdmins] = useState<AdminOpt[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [adminId, setAdminId] = useState<number | "">("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    api.get("/api/admin/logs/admins").then(({ data }) => {
      if (data.success) setAdmins(data.items || []);
    });
    api.get("/api/admin/logs/actions").then(({ data }) => {
      if (data.success) setActions(data.items || []);
    });
  }, [authLoading]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (adminId) params.set("admin_id", String(adminId));
      if (action) params.set("action", action);
      if (search.trim()) params.set("q", search.trim());
      params.set("page", String(page));

      const { data } = await api.get(`/api/admin/logs?${params.toString()}`);
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch {
      toast.error("Không tải được nhật ký");
    } finally {
      setLoading(false);
    }
  }, [adminId, action, search, page]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  async function handleClean() {
    const reason = await confirm({
      title: "Xóa log cũ",
      message:
        "Nhập số ngày — tất cả log cũ hơn số ngày này sẽ bị xóa vĩnh viễn.",
      variant: "danger",
      confirmLabel: "Xóa log",
      withReason: true,
      reasonLabel: "Xóa log cũ hơn (ngày)",
      reasonPlaceholder: "VD: 90",
      reasonRequired: true,
    });
    if (!reason) return;

    const days = parseInt(reason, 10);
    if (!days || days < 7) {
      toast.error("Tối thiểu 7 ngày");
      return;
    }

    try {
      const { data } = await api.delete(
        `/api/admin/logs/clean-old?days=${days}`
      );
      toast.success(data.message || "Đã xóa");
      load();
    } catch {
      toast.error("Lỗi xóa log");
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
            <ScrollText className="w-6 h-6 text-purple-500" />
            Nhật ký hoạt động
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi mọi hành động của quản trị viên
          </p>
        </div>
        <button
          onClick={handleClean}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
        >
          <Trash2 className="w-4 h-4" />
          Xóa log cũ
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-2xl border border-slate-200">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={adminId}
          onChange={(e) => {
            setAdminId(e.target.value ? Number(e.target.value) : "");
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="">Tất cả admin</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.ho_ten} ({ROLE_LABEL[a.vai_tro] || a.vai_tro})
            </option>
          ))}
        </select>

        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="">Tất cả hành động</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              load();
            }
          }}
          placeholder="Tìm hành động, chi tiết... (Enter)"
          className="flex-1 min-w-[220px] px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ScrollText className="w-14 h-14 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Không có nhật ký nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wide">
                    <th className="text-left p-3 font-bold">Thời gian</th>
                    <th className="text-left p-3 font-bold">Admin</th>
                    <th className="text-left p-3 font-bold">Hành động</th>
                    <th className="text-left p-3 font-bold">Đối tượng</th>
                    <th className="text-left p-3 font-bold">Chi tiết</th>
                    <th className="text-left p-3 font-bold">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 whitespace-nowrap text-slate-600">
                        {fmtDateTime(it.created_at)}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {it.admin_name}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-semibold">
                          {it.hanh_dong}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 text-xs">
                        {it.doi_tuong_loai
                          ? `${it.doi_tuong_loai} #${it.doi_tuong_id || ""}`
                          : "—"}
                      </td>
                      <td className="p-3 text-slate-600 max-w-[300px] truncate">
                        {it.chi_tiet || ""}
                      </td>
                      <td className="p-3 text-xs text-slate-400">
                        {it.ip || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  Tổng <b className="text-slate-700">{total}</b> bản ghi
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold disabled:opacity-40"
                  >
                    ← Trước
                  </button>
                  <span className="px-3 text-sm font-semibold text-slate-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold disabled:opacity-40"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}