import { prisma } from "../../config/prisma";

// ============================================================
// List thông báo của SV
// ============================================================
export async function listNotifications(sinhVienId: number) {
  const items = await prisma.thong_bao.findMany({
    where: { sinh_vien_id: sinhVienId },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const unread = items.filter((it) => !it.da_doc).length;

  return {
    items: items.map((it) => ({
      id: it.id,
      tieu_de: it.tieu_de,
      noi_dung: it.noi_dung,
      loai: it.loai || "info",
      da_doc: it.da_doc || 0,
      created_at: it.created_at,
    })),
    unread,
  };
}

// ============================================================
// Đếm số chưa đọc (cho badge sidebar/topbar)
// ============================================================
export async function countUnread(sinhVienId: number) {
  const count = await prisma.thong_bao.count({
    where: { sinh_vien_id: sinhVienId, da_doc: 0 },
  });
  return { count };
}

// ============================================================
// Đánh dấu đã đọc
// - Có id: 1 cái
// - Không id: tất cả
// ============================================================
export async function markRead(sinhVienId: number, id?: number) {
  if (id) {
    await prisma.thong_bao.updateMany({
      where: { id, sinh_vien_id: sinhVienId },
      data: { da_doc: 1 },
    });
  } else {
    await prisma.thong_bao.updateMany({
      where: { sinh_vien_id: sinhVienId, da_doc: 0 },
      data: { da_doc: 1 },
    });
  }
  return { message: "Đã đánh dấu đã đọc" };
}

// ============================================================
// Xóa 1 thông báo (của chính SV)
// ============================================================
export async function deleteNotification(sinhVienId: number, id: number) {
  const noti = await prisma.thong_bao.findFirst({
    where: { id, sinh_vien_id: sinhVienId },
    select: { id: true },
  });
  if (!noti) throw { status: 404, message: "Không tìm thấy" };

  await prisma.thong_bao.delete({ where: { id } });
  return { message: "Đã xóa thông báo" };
}