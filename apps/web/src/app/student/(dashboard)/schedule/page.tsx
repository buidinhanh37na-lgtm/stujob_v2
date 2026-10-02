"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Loader2, Plus, Trash2, Upload, Download, X, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { thuName } from "@/lib/utils";

interface ScheduleItem {
  id: number;
  thu: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  mon_hoc: string | null;
  phong_hoc: string | null;
}

interface FreeTimeItem {
  id: number;
  thu: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
}

interface FreeTimeAuto {
  thu: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
}

type Tab = "tkb" | "free";

export default function SchedulePage() {
  const { isLoading: authLoading } = useRequireAuth("sinh_vien");

  const [tab, setTab] = useState<Tab>("tkb");
  const [loading, setLoading] = useState(true);

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    thu: "2",
    gio_bat_dau: "07:00",
    gio_ket_thuc: "09:30",
    mon_hoc: "",
    phong_hoc: "",
  });

  const [freeAuto, setFreeAuto] = useState<FreeTimeAuto[]>([]);
  const [freeManual, setFreeManual] = useState<FreeTimeItem[]>([]);
  const [showFreeForm, setShowFreeForm] = useState(false);
  const [freeForm, setFreeForm] = useState({
    thu: "2",
    gio_bat_dau: "18:00",
    gio_ket_thuc: "21:00",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadSchedule() {
    try {
      const { data } = await api.get("/api/student/schedule");
      if (data.success) setSchedule(data.items || []);
    } catch {
      toast.error("Không tải được TKB");
    }
  }

  async function loadFreeTime() {
    try {
      const { data } = await api.get("/api/student/schedule/free-time");
      if (data.success) {
        setFreeAuto(data.tu_dong || []);
        setFreeManual(data.thu_cong || []);
      }
    } catch {
      toast.error("Không tải được lịch rảnh");
    }
  }

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      await Promise.all([loadSchedule(), loadFreeTime()]);
      setLoading(false);
    })();
  }, [authLoading]);

  async function handleAddSchedule(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.mon_hoc.trim()) return setError("Vui lòng nhập môn học");

    setSubmitting(true);
    try {
      const { data } = await api.post("/api/student/schedule", {
        thu: Number(form.thu),
        gio_bat_dau: form.gio_bat_dau,
        gio_ket_thuc: form.gio_ket_thuc,
        mon_hoc: form.mon_hoc,
        phong_hoc: form.phong_hoc,
      });
      if (!data.success) {
        setError(data.message);
        return;
      }
      toast.success("Đã thêm lịch học");
      setShowForm(false);
      setForm({
        thu: "2",
        gio_bat_dau: "07:00",
        gio_ket_thuc: "09:30",
        mon_hoc: "",
        phong_hoc: "",
      });
      await Promise.all([loadSchedule(), loadFreeTime()]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSchedule(id: number) {
    if (!confirm("Xóa môn này?")) return;
    try {
      const { data } = await api.delete(`/api/student/schedule/${id}`);
      if (data.success) {
        toast.success("Đã xóa");
        await Promise.all([loadSchedule(), loadFreeTime()]);
      }
    } catch {
      toast.error("Lỗi");
    }
  }

  async function handleDeleteAll() {
    if (!confirm("Xóa TOÀN BỘ thời khoá biểu?")) return;
    try {
      const { data } = await api.delete("/api/student/schedule/all");
      if (data.success) {
        toast.success(data.message);
        await Promise.all([loadSchedule(), loadFreeTime()]);
      }
    } catch {
      toast.error("Lỗi");
    }
  }

  function handleImportCSV() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const { data } = await api.post(
          "/api/student/schedule/import",
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (data.success) {
          toast.success(data.message);
          await Promise.all([loadSchedule(), loadFreeTime()]);
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Import lỗi");
      }
    };
    input.click();
  }

  async function handleAddFreeTime(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/student/schedule/free-time", {
        thu: Number(freeForm.thu),
        gio_bat_dau: freeForm.gio_bat_dau,
        gio_ket_thuc: freeForm.gio_ket_thuc,
      });
      if (!data.success) return toast.error(data.message);
      toast.success("Đã thêm lịch rảnh");
      setShowFreeForm(false);
      await loadFreeTime();
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteFreeTime(id: number) {
    if (!confirm("Xóa lịch rảnh này?")) return;
    try {
      const { data } = await api.delete(`/api/student/schedule/free-time/${id}`);
      if (data.success) {
        toast.success("Đã xóa");
        await loadFreeTime();
      }
    } catch {
      toast.error("Lỗi");
    }
  }

  const HOURS = [
    "06:00", "08:00", "10:00", "12:00", "14:00",
    "16:00", "18:00", "20:00", "22:00",
  ];
  const DAYS = [2, 3, 4, 5, 6, 7, 8];

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
        <h2 className="text-2xl font-bold text-slate-900">Lịch học & Lịch rảnh</h2>
        <p className="text-slate-500 text-sm mt-1">
          Cập nhật thời khoá biểu để nhận gợi ý việc làm phù hợp
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("tkb")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
            tab === "tkb"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          📚 Thời khoá biểu
        </button>
        <button
          onClick={() => setTab("free")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
            tab === "free"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          🕒 Lịch rảnh
        </button>
      </div>

      {/* TAB TKB */}
      {tab === "tkb" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Thêm môn
            </button>
            <a
              href="http://localhost:4000/api/student/schedule/template"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" /> Tải file mẫu
            </a>
            <button
              onClick={handleImportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 transition"
            >
              <Upload className="w-4 h-4" /> Nhập CSV
            </button>
            {schedule.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 text-sm hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" /> Xóa tất cả
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Thêm môn học</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddSchedule} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Thứ *</label>
                  <select
                    value={form.thu}
                    onChange={(e) => setForm({ ...form, thu: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                      <option key={d} value={d}>{thuName(d)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bắt đầu *</label>
                    <input
                      type="time"
                      required
                      value={form.gio_bat_dau}
                      onChange={(e) => setForm({ ...form, gio_bat_dau: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Kết thúc *</label>
                    <input
                      type="time"
                      required
                      value={form.gio_ket_thuc}
                      onChange={(e) => setForm({ ...form, gio_ket_thuc: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Môn học *</label>
                  <input
                    type="text"
                    required
                    value={form.mon_hoc}
                    onChange={(e) => setForm({ ...form, mon_hoc: e.target.value })}
                    placeholder="VD: Lập trình Web"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phòng học</label>
                  <input
                    type="text"
                    value={form.phong_hoc}
                    onChange={(e) => setForm({ ...form, phong_hoc: e.target.value })}
                    placeholder="VD: A101"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                </div>

                <div className="sm:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Đang thêm...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Thêm môn</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grid TKB */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-x-auto">
            <div
              className="grid gap-1 min-w-[900px]"
              style={{ gridTemplateColumns: "70px repeat(7, minmax(120px, 1fr))" }}
            >
              <div className="p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 text-center">Giờ</div>
              {DAYS.map((d) => (
                <div key={d} className="p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center">
                  {thuName(d)}
                </div>
              ))}

              {HOURS.map((h) => (
                <>
                  <div
                    key={`time-${h}`}
                    className="p-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-500 text-center flex items-center justify-center"
                  >
                    {h}
                  </div>
                  {DAYS.map((d) => {
                    const items = schedule.filter(
                      (s) => s.thu === d && s.gio_bat_dau <= h && s.gio_ket_thuc > h
                    );
                    return (
                      <div key={`${d}-${h}`} className="min-h-[60px] p-1 bg-slate-50/50 rounded-lg border border-slate-100">
                        {items.map((it) => (
                          <div key={it.id} className="bg-emerald-100 border-l-2 border-emerald-500 rounded px-2 py-1 mb-1 text-xs group relative">
                            <div className="font-semibold text-emerald-800 truncate">{it.mon_hoc}</div>
                            <div className="text-[10px] text-emerald-600">{it.gio_bat_dau}-{it.gio_ket_thuc}</div>
                            <button
                              onClick={() => handleDeleteSchedule(it.id)}
                              className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {schedule.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-3">Danh sách môn ({schedule.length})</h3>
              <div className="space-y-2">
                {schedule.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                    <span className="font-semibold text-slate-700 w-20">{thuName(it.thu)}</span>
                    <span className="text-slate-500 w-28">{it.gio_bat_dau}-{it.gio_ket_thuc}</span>
                    <span className="flex-1 font-medium text-slate-900 truncate">{it.mon_hoc}</span>
                    {it.phong_hoc && <span className="text-xs text-slate-500">{it.phong_hoc}</span>}
                    <button
                      onClick={() => handleDeleteSchedule(it.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB FREE */}
      {tab === "free" && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
            🕒 <b>Lịch rảnh tự động</b> tính từ 6h-23h, trừ các giờ có lịch học.
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-x-auto">
            <div
              className="grid gap-1 min-w-[900px]"
              style={{ gridTemplateColumns: "70px repeat(7, minmax(120px, 1fr))" }}
            >
              <div className="p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 text-center">Giờ</div>
              {DAYS.map((d) => (
                <div key={d} className="p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 text-center">
                  {thuName(d)}
                </div>
              ))}

              {HOURS.map((h) => (
                <>
                  <div
                    key={`ft-${h}`}
                    className="p-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-500 text-center flex items-center justify-center"
                  >
                    {h}
                  </div>
                  {DAYS.map((d) => {
                    const items = freeAuto.filter(
                      (f) => f.thu === d && f.gio_bat_dau <= h && f.gio_ket_thuc > h
                    );
                    return (
                      <div key={`ft-${d}-${h}`} className="min-h-[60px] p-1 bg-slate-50/50 rounded-lg border border-slate-100">
                        {items.map((it, i) => (
                          <div key={i} className="bg-emerald-50 border-l-2 border-emerald-400 rounded px-2 py-1 text-[10px] text-emerald-700">
                            Rảnh {it.gio_bat_dau}-{it.gio_ket_thuc}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">✍️ Lịch rảnh thủ công ({freeManual.length})</h3>
              <button
                onClick={() => setShowFreeForm(!showFreeForm)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </div>

            {showFreeForm && (
              <form
                onSubmit={handleAddFreeTime}
                className="grid grid-cols-3 gap-3 mb-4 p-4 rounded-xl bg-slate-50"
              >
                <select
                  value={freeForm.thu}
                  onChange={(e) => setFreeForm({ ...freeForm, thu: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                    <option key={d} value={d}>{thuName(d)}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={freeForm.gio_bat_dau}
                  onChange={(e) => setFreeForm({ ...freeForm, gio_bat_dau: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                />
                <input
                  type="time"
                  value={freeForm.gio_ket_thuc}
                  onChange={(e) => setFreeForm({ ...freeForm, gio_ket_thuc: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="col-span-3 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? "Đang thêm..." : "Thêm lịch rảnh"}
                </button>
              </form>
            )}

            {freeManual.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">Chưa có lịch rảnh thủ công</div>
            ) : (
              <div className="space-y-2">
                {freeManual.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                    <span className="font-medium text-slate-700 w-24">{thuName(f.thu)}</span>
                    <span className="text-slate-500">{f.gio_bat_dau} - {f.gio_ket_thuc}</span>
                    <button
                      onClick={() => handleDeleteFreeTime(f.id)}
                      className="ml-auto p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}