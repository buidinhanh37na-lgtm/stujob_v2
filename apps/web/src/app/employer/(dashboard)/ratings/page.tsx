"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fmtDateTime } from "@/lib/utils";

interface Rating {
  id: number;
  sinh_vien_id: number;
  viec_lam_id: number | null;
  diem: number;
  nhan_xet: string | null;
  created_at: string;
  ho_ten: string;
  ma_sinh_vien: string | null;
  tieu_de: string;
}

export default function RatingsPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Rating[]>([]);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const { data } = await api.get("/api/employer/ratings");
        if (data.success) setItems(data.items || []);
      } catch {
        toast.error("Không tải được danh sách");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Đánh giá sinh viên</h2>
        <p className="text-slate-500 text-sm mt-1">
          Lịch sử đánh giá SV sau khi nghiệm thu công việc
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Star className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Chưa có đánh giá nào</p>
          <p className="text-xs mt-1">
            Đánh giá SV sau khi nghiệm thu để nhận xét chất lượng làm việc
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((r) => {
            const initial = (r.ho_ten || "?").charAt(0).toUpperCase();
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition relative overflow-hidden"
              >
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />

                {/* Head */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {r.ho_ten}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {r.ma_sinh_vien || ""}
                    </div>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < r.diem
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {r.diem}/5
                  </span>
                </div>

                {/* Job */}
                {r.tieu_de && (
                  <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg truncate">
                    📌 {r.tieu_de}
                  </div>
                )}

                {/* Comment */}
                {r.nhan_xet && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-50 border-l-2 border-amber-400 text-sm text-slate-700 italic">
                    <span className="text-amber-500 font-bold text-lg leading-none mr-1">
                      &ldquo;
                    </span>
                    {r.nhan_xet}
                  </div>
                )}

                {/* Time */}
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  🕒 {fmtDateTime(r.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}