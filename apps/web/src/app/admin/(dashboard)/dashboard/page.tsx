"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";

export default function AdminDashboardPage() {
  const { isLoading } = useRequireAuth("quan_tri_vien");
  const admin = useAuthStore((s) => s.admin);

  if (isLoading || !admin) {
    return <div className="text-slate-400">Đang tải...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">
          Xin chào, {admin.ho_ten}! 🛡️
        </h2>
        <p className="text-slate-200 text-sm">
          Vai trò: <b>{admin.vai_tro}</b> • {admin.email}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sinh viên" value="0" icon="👥" />
        <StatCard label="Nhà tuyển dụng" value="0" icon="🏢" />
        <StatCard label="Tin việc" value="0" icon="📝" />
        <StatCard label="Ứng tuyển" value="0" icon="📨" />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
        ⚠️ <b>Placeholder</b>. Admin portal đầy đủ sẽ được xây dựng ở Phase 4.
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}