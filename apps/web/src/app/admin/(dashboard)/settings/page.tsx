"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings as SettingsIcon, Save, Server } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface SettingItem {
  gia_tri: string;
  mo_ta: string | null;
}
type SettingsMap = Record<string, SettingItem>;

interface SystemInfo {
  node_version: string;
  mysql_version: string;
  db_size_mb: number;
  tables: number;
  server_time: string;
}

export default function AdminSettingsPage() {
  const { isLoading: authLoading } = useRequireAuth("quan_tri_vien");

  const [items, setItems] = useState<SettingsMap>({});
  const [original, setOriginal] = useState<SettingsMap>({});
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const { data } = await api.get("/api/admin/settings/list");
        if (data.success) {
          setItems(data.items || {});
          setOriginal(data.items || {});
        }
        const sys = await api.get("/api/admin/settings/system-info");
        if (sys.data.success) setInfo(sys.data);
      } catch {
        toast.error("Không tải được cấu hình");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  function handleChange(key: string, value: string) {
    setItems((prev) => ({
      ...prev,
      [key]: { ...prev[key], gia_tri: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const k of Object.keys(items)) payload[k] = items[k].gia_tri;
      const { data } = await api.post("/api/admin/settings/update", {
        items: payload,
      });
      toast.success(data.message || "Đã lưu");
      setOriginal(items);
    } catch {
      toast.error("Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = JSON.stringify(items) !== JSON.stringify(original);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-purple-500" />
          Cài đặt hệ thống
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Cấu hình chung cho toàn bộ sàn Stujob
        </p>
      </div>

      {/* Config form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4">🛠️ Cấu hình</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(items).map((key) => (
            <div key={key}>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                {items[key].mo_ta || key}{" "}
                <span className="text-slate-400 font-normal">({key})</span>
              </label>
              <input
                value={items[key].gia_tri}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>

      {/* System info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-500" />
          Thông tin máy chủ
        </h3>

        {!info ? (
          <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-[13px]">
            <InfoCell label="Node.js" value={info.node_version} />
            <InfoCell label="MySQL" value={info.mysql_version} />
            <InfoCell label="DB Size" value={`${info.db_size_mb} MB`} />
            <InfoCell label="Tables" value={String(info.tables)} />
            <InfoCell label="Server time" value={info.server_time} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="font-bold text-slate-800 truncate">{value}</div>
    </div>
  );
}