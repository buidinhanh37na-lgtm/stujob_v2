import { prisma } from "../../config/prisma";

export interface CreateScheduleInput {
  thu: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  mon_hoc?: string;
  phong_hoc?: string;
  ghi_chu?: string;
}

export interface CreateFreeTimeInput {
  thu: number;
  gio_bat_dau: string;
  gio_ket_thuc: string;
}

// ============================================================
// Lấy thời khoá biểu
// ============================================================
export async function getSchedule(sinhVienId: number) {
  const items = await prisma.lich_hoc.findMany({
    where: { sinh_vien_id: sinhVienId },
    orderBy: [{ thu: "asc" }, { gio_bat_dau: "asc" }],
  });

  return {
    items: items.map((it) => ({
      id: it.id,
      thu: it.thu,
      gio_bat_dau: formatTime(it.gio_bat_dau),
      gio_ket_thuc: formatTime(it.gio_ket_thuc),
      mon_hoc: it.mon_hoc,
      phong_hoc: it.phong_hoc,
      ghi_chu: it.ghi_chu,
    })),
  };
}

// ============================================================
// Thêm môn vào TKB
// ============================================================
export async function createSchedule(
  sinhVienId: number,
  input: CreateScheduleInput
) {
  if (input.thu < 2 || input.thu > 8)
    throw { status: 400, message: "Thứ không hợp lệ (2-8)" };
  if (input.gio_bat_dau >= input.gio_ket_thuc)
    throw { status: 400, message: "Giờ kết thúc phải sau giờ bắt đầu" };

  const created = await prisma.lich_hoc.create({
    data: {
      sinh_vien_id: sinhVienId,
      thu: input.thu,
      gio_bat_dau: parseTime(input.gio_bat_dau),
      gio_ket_thuc: parseTime(input.gio_ket_thuc),
      mon_hoc: input.mon_hoc?.trim() || null,
      phong_hoc: input.phong_hoc?.trim() || null,
      ghi_chu: input.ghi_chu?.trim() || null,
    },
  });

  return {
    id: created.id,
    thu: created.thu,
    gio_bat_dau: formatTime(created.gio_bat_dau),
    gio_ket_thuc: formatTime(created.gio_ket_thuc),
  };
}

// ============================================================
// Xóa 1 môn
// ============================================================
export async function deleteSchedule(sinhVienId: number, id: number) {
  const existing = await prisma.lich_hoc.findFirst({
    where: { id, sinh_vien_id: sinhVienId },
    select: { id: true },
  });
  if (!existing) throw { status: 404, message: "Không tìm thấy" };

  await prisma.lich_hoc.delete({ where: { id } });
  return { message: "Đã xóa" };
}

// ============================================================
// Xóa toàn bộ TKB
// ============================================================
export async function deleteAllSchedule(sinhVienId: number) {
  const result = await prisma.lich_hoc.deleteMany({
    where: { sinh_vien_id: sinhVienId },
  });
  return { message: `Đã xóa ${result.count} môn` };
}

// ============================================================
// Import CSV
// ============================================================
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export async function importScheduleCSV(
  sinhVienId: number,
  csvContent: string
): Promise<ImportResult> {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2)
    throw { status: 400, message: "File CSV trống hoặc thiếu dữ liệu" };

  const dataLines = lines.slice(1);
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCSVLine(dataLines[i]);
    if (cols.length < 3) {
      result.failed++;
      result.errors.push(`Dòng ${i + 2}: thiếu cột`);
      continue;
    }

    try {
      const thu = parseThu(cols[0]);
      if (!thu) throw new Error("Thứ không hợp lệ");

      const gio_bat_dau = normalizeTime(cols[1]);
      const gio_ket_thuc = normalizeTime(cols[2]);
      if (!gio_bat_dau || !gio_ket_thuc) throw new Error("Giờ không hợp lệ");

      await prisma.lich_hoc.create({
        data: {
          sinh_vien_id: sinhVienId,
          thu,
          gio_bat_dau: parseTime(gio_bat_dau),
          gio_ket_thuc: parseTime(gio_ket_thuc),
          mon_hoc: cols[3]?.trim() || null,
          phong_hoc: cols[4]?.trim() || null,
          ghi_chu: cols[5]?.trim() || null,
        },
      });
      result.success++;
    } catch (e: unknown) {
      result.failed++;
      const err = e as { message?: string };
      result.errors.push(`Dòng ${i + 2}: ${err.message || "Lỗi"}`);
    }
  }

  return result;
}

// ============================================================
// Lịch rảnh (tự động + thủ công)
// ============================================================
export async function getFreeTime(sinhVienId: number) {
  const [lichHoc, manual] = await Promise.all([
    prisma.lich_hoc.findMany({
      where: { sinh_vien_id: sinhVienId },
      orderBy: [{ thu: "asc" }, { gio_bat_dau: "asc" }],
    }),
    prisma.lich_ranh.findMany({
      where: { sinh_vien_id: sinhVienId },
      orderBy: [{ thu: "asc" }, { gio_bat_dau: "asc" }],
    }),
  ]);

  const START_DAY = "06:00";
  const END_DAY = "23:00";
  const tuDong: Array<{ thu: number; gio_bat_dau: string; gio_ket_thuc: string }> = [];

  for (let thu = 2; thu <= 8; thu++) {
    const busy = lichHoc
      .filter((l) => l.thu === thu)
      .map((l) => ({
        start: formatTime(l.gio_bat_dau),
        end: formatTime(l.gio_ket_thuc),
      }))
      .sort((a, b) => a.start.localeCompare(b.start));

    let current = START_DAY;
    for (const b of busy) {
      if (b.start > current) {
        tuDong.push({ thu, gio_bat_dau: current, gio_ket_thuc: b.start });
      }
      if (b.end > current) current = b.end;
    }
    if (current < END_DAY) {
      tuDong.push({ thu, gio_bat_dau: current, gio_ket_thuc: END_DAY });
    }
  }

  return {
    tu_dong: tuDong,
    thu_cong: manual.map((m) => ({
      id: m.id,
      thu: m.thu,
      gio_bat_dau: formatTime(m.gio_bat_dau),
      gio_ket_thuc: formatTime(m.gio_ket_thuc),
    })),
  };
}

// ============================================================
// Thêm lịch rảnh thủ công
// ============================================================
export async function createFreeTime(
  sinhVienId: number,
  input: CreateFreeTimeInput
) {
  if (input.thu < 2 || input.thu > 8)
    throw { status: 400, message: "Thứ không hợp lệ" };
  if (input.gio_bat_dau >= input.gio_ket_thuc)
    throw { status: 400, message: "Giờ kết thúc phải sau giờ bắt đầu" };

  const created = await prisma.lich_ranh.create({
    data: {
      sinh_vien_id: sinhVienId,
      thu: input.thu,
      gio_bat_dau: parseTime(input.gio_bat_dau),
      gio_ket_thuc: parseTime(input.gio_ket_thuc),
    },
  });

  return {
    id: created.id,
    thu: created.thu,
    gio_bat_dau: formatTime(created.gio_bat_dau),
    gio_ket_thuc: formatTime(created.gio_ket_thuc),
  };
}

// ============================================================
// Xóa lịch rảnh
// ============================================================
export async function deleteFreeTime(sinhVienId: number, id: number) {
  const existing = await prisma.lich_ranh.findFirst({
    where: { id, sinh_vien_id: sinhVienId },
    select: { id: true },
  });
  if (!existing) throw { status: 404, message: "Không tìm thấy" };

  await prisma.lich_ranh.delete({ where: { id } });
  return { message: "Đã xóa" };
}

// ============================================================
// HELPERS
// ============================================================
function formatTime(t: Date | string): string {
  if (typeof t === "string") return t.slice(0, 5);
  const h = String(t.getUTCHours()).padStart(2, "0");
  const m = String(t.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function parseTime(s: string): Date {
  const [h, m] = s.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

function parseThu(s: string): number | null {
  const t = s.trim().toLowerCase();
  if (/^\d+$/.test(t)) {
    const n = parseInt(t, 10);
    return n >= 2 && n <= 8 ? n : null;
  }
  const map: Record<string, number> = {
    "thứ 2": 2, "thu 2": 2, t2: 2, "thứ hai": 2,
    "thứ 3": 3, "thu 3": 3, t3: 3, "thứ ba": 3,
    "thứ 4": 4, "thu 4": 4, t4: 4, "thứ tư": 4,
    "thứ 5": 5, "thu 5": 5, t5: 5, "thứ năm": 5,
    "thứ 6": 6, "thu 6": 6, t6: 6, "thứ sáu": 6,
    "thứ 7": 7, "thu 7": 7, t7: 7, "thứ bảy": 7,
    "chủ nhật": 8, "chu nhat": 8, cn: 8, cnhat: 8,
  };
  return map[t] || null;
}

function normalizeTime(s: string): string | null {
  const t = s.trim();
  const match = t.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else current += char;
  }
  result.push(current);
  return result.map((c) => c.trim());
}