import { prisma } from "../../config/prisma";

// ============================================================
// Ghi nhật ký admin
// ============================================================
export async function logAdmin(
  adminId: number,
  hanhDong: string,
  doiTuongLoai: string | null = null,
  doiTuongId: number | null = null,
  chiTiet: string | null = null,
  req?: any
) {
  try {
    const ip = req?.ip || req?.headers?.["x-forwarded-for"] || null;
    await prisma.nhat_ky_admin.create({
      data: {
        admin_id: adminId,
        hanh_dong: hanhDong,
        doi_tuong_loai: doiTuongLoai,
        doi_tuong_id: doiTuongId,
        chi_tiet: chiTiet,
        ip: ip ? String(ip).slice(0, 45) : null,
      },
    });
  } catch {
    // ignore
  }
}

// ============================================================
// Thông báo cho admin
// ============================================================
export async function notifyAdmin(
  adminId: number | null,
  tieuDe: string,
  noiDung: string,
  loai: string = "info"
) {
  try {
    await prisma.thong_bao_admin.create({
      data: {
        admin_id: adminId,
        tieu_de: tieuDe,
        noi_dung: noiDung,
        loai: loai,
      },
    });
  } catch {}
}

// ============================================================
// Format time
// ============================================================
export function formatTime(t: Date | string | null | undefined): string {
  if (!t) return "";
  if (typeof t === "string") return t.slice(0, 5);
  const h = String(t.getUTCHours()).padStart(2, "0");
  const m = String(t.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}