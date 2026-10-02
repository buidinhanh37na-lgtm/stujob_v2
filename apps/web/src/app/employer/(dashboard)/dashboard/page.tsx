"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuthStore } from "@/stores/auth.store";

export default function EmployerDashboardPage() {
  const { isLoading } = useRequireAuth("nha_tuyen_dung");
  const nhaTuyenDung = useAuthStore((s) => s.nhaTuyenDung);

  if (isLoading || !nhaTuyenDung) {
    return <div className="text-slate-400">Đang tải...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">
          Xin chào, {nhaTuyenDung.ten_cong_ty}! 🏢
        </h2>
        <p className="text-orange-50 text-sm">
          {nhaTuyenDung.linh_vuc || "Chưa cập nhật lĩnh vực"} • {nhaTuyenDung.email}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tin đang mở" value="0" icon="📝" />
        <StatCard label="Ứng tuyển mới" value="0" icon="📨" />
        <StatCard label="Bảo đảm đã ký" value="0₫" icon="🛡️" />
        <StatCard label="SV đang làm" value="0" icon="👥" />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
        ⚠️ <b>Placeholder</b>. Dashboard đầy đủ sẽ được xây dựng ở Phase 3.
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