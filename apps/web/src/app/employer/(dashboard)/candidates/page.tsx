"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Users, Star, GraduationCap, MapPin, Target,
  Mail, Eye, Filter,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface Candidate {
  id: number;
  ma_sinh_vien: string | null;
  ho_ten: string;
  truong: string | null;
  khoa: string | null;
  chuyen_nganh: string | null;
  nam_hoc: number | null;
  gpa: number | null;
  mo_ta: string | null;
  diem_danh_gia: number;
  so_lan_danh_gia: number;
  anh_dai_dien: string | null;
  ky_nang: string[];
  diem_phu_hop: number;
  chi_tiet_diem: {
    ky_nang: number;
    gpa: number;
    danh_gia: number;
    khoang_cach: number;
  };
  khoang_cach: number | null;
}

interface Category {
  id: number;
  ten_nhom: string;
  icon: string | null;
}

export default function CandidatesPage() {
  const { isLoading: authLoading } = useRequireAuth("nha_tuyen_dung");

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);

  const [filter, setFilter] = useState({
    nhom_viec_id: "",
    ban_kinh: "0",
    sap_xep: "phu_hop",
  });

  async function loadCategories() {
    try {
      const { data } = await api.get("/api/employer/templates/categories");
      if (data.success) setCategories(data.items || []);
    } catch {
      // ignore
    }
  }

  async function loadCandidates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.nhom_viec_id) params.set("nhom_viec_id", filter.nhom_viec_id);
      if (filter.ban_kinh !== "0") params.set("ban_kinh", filter.ban_kinh);
      params.set("sap_xep", filter.sap_xep);

      const { data } = await api.get(
        `/api/employer/candidates?${params.toString()}`
      );
      if (data.success) setCandidates(data.items || []);
    } catch {
      toast.error("Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading) loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, filter.nhom_viec_id, filter.ban_kinh, filter.sap_xep]);

  function getScoreClass(score: number) {
    if (score >= 70) return "bg-emerald-100 text-emerald-800";
    if (score >= 50) return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-700";
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
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Gợi ý ứng viên</h2>
        <p className="text-slate-500 text-sm mt-1">
          Sinh viên phù hợp với các tin đăng của bạn (điểm 0-100)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-sky-600" />
          <span className="font-semibold text-slate-900 text-sm">Bộ lọc</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Nhóm việc
            </label>
            <select
              value={filter.nhom_viec_id}
              onChange={(e) =>
                setFilter({ ...filter, nhom_viec_id: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">Tất cả nhóm</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon || "📁"} {c.ten_nhom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Bán kính
            </label>
            <select
              value={filter.ban_kinh}
              onChange={(e) => setFilter({ ...filter, ban_kinh: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="0">Không giới hạn</option>
              <option value="5">Trong 5 km</option>
              <option value="10">Trong 10 km</option>
              <option value="50">Trong 50 km</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Sắp xếp theo
            </label>
            <select
              value={filter.sap_xep}
              onChange={(e) => setFilter({ ...filter, sap_xep: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="phu_hop">Độ phù hợp</option>
              <option value="khoang_cach">Khoảng cách</option>
              <option value="danh_gia">Đánh giá</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Đang tải sinh viên...
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Users className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có sinh viên phù hợp với bộ lọc</p>
          <p className="text-xs mt-1">Thử bỏ bộ lọc hoặc mở rộng bán kính</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((c) => {
            const initial = (c.ho_ten || "?").charAt(0).toUpperCase();
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-sky-200 transition"
              >
                {/* Head */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {c.ho_ten}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {c.ma_sinh_vien || ""}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${getScoreClass(
                      c.diem_phu_hop
                    )}`}
                  >
                    {c.diem_phu_hop}%
                  </span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                    <Star className="w-3 h-3 fill-current" />
                    {c.diem_danh_gia.toFixed(1)}/5 ({c.so_lan_danh_gia})
                  </span>
                  {c.gpa !== null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      <GraduationCap className="w-3 h-3" />
                      GPA {c.gpa.toFixed(2)}
                    </span>
                  )}
                  {c.khoang_cach !== null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {c.khoang_cach} km
                    </span>
                  )}
                </div>

                {/* School */}
                <div className="text-xs text-slate-500 mt-2 truncate">
                  🏫 {c.truong || "Chưa cập nhật"}
                  {c.chuyen_nganh && ` • ${c.chuyen_nganh}`}
                </div>

                {/* Skills */}
                {c.ky_nang.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.ky_nang.slice(0, 4).map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                      >
                        {k}
                      </span>
                    ))}
                    {c.ky_nang.length > 4 && (
                      <span className="px-2 py-0.5 text-[11px] text-slate-400">
                        +{c.ky_nang.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelected(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Chi tiết
                  </button>
                  <button
                    onClick={() => toast.info("Chức năng mời — sẽ làm ở chặng sau")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Mời làm việc
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 flex items-start gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {(selected.ho_ten || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">{selected.ho_ten}</div>
                <div className="text-xs text-slate-500">
                  {selected.ma_sinh_vien} • {selected.truong || "Chưa cập nhật"}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Match score detail */}
              <div className="bg-sky-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-sky-600" />
                  <span className="font-semibold text-sm text-slate-900">
                    Điểm phù hợp: {selected.diem_phu_hop}/100
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <ScoreBar
                    label="Kỹ năng"
                    score={selected.chi_tiet_diem.ky_nang}
                    max={40}
                  />
                  <ScoreBar label="GPA" score={selected.chi_tiet_diem.gpa} max={25} />
                  <ScoreBar
                    label="Đánh giá"
                    score={selected.chi_tiet_diem.danh_gia}
                    max={25}
                  />
                  <ScoreBar
                    label="Khoảng cách"
                    score={selected.chi_tiet_diem.khoang_cach}
                    max={10}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">GPA</div>
                  <div className="font-semibold">
                    {selected.gpa?.toFixed(2) || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Năm học</div>
                  <div className="font-semibold">{selected.nam_hoc || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Khoa</div>
                  <div className="font-semibold text-xs">
                    {selected.khoa || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Chuyên ngành</div>
                  <div className="font-semibold text-xs">
                    {selected.chuyen_nganh || "—"}
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selected.ky_nang.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">🛠️ Kỹ năng</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.ky_nang.map((k, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selected.mo_ta && (
                <div>
                  <div className="text-sm font-semibold mb-2">📝 Giới thiệu</div>
                  <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 whitespace-pre-line">
                    {selected.mo_ta}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const pct = (score / max) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-white rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}