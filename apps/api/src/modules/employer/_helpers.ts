import { prisma } from "../../config/prisma";

// ============================================================
// Lấy NTD ID từ request
// ============================================================
export function requireEmployer(req: any): number {
  const userId = req.user?.userId;
  if (!userId) throw { status: 401, message: "Chưa đăng nhập NTD" };
  return userId;
}

// ============================================================
// Lưu thông báo cho NTD
// ============================================================
export async function notifyNTD(
  ntdId: number,
  tieuDe: string,
  noiDung: string,
  loai: string = "info"
) {
  try {
    await prisma.thong_bao_ntd.create({
      data: {
        nha_tuyen_dung_id: ntdId,
        tieu_de: tieuDe,
        noi_dung: noiDung,
        loai: loai,
      },
    });
  } catch {
    // ignore
  }
}

// ============================================================
// Khoảng cách Haversine (km)
// ============================================================
export function calcDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

// ============================================================
// Format Time
// ============================================================
export function formatTime(t: Date | string | null | undefined): string {
  if (!t) return "";
  if (typeof t === "string") return t.slice(0, 5);
  const h = String(t.getUTCHours()).padStart(2, "0");
  const m = String(t.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}