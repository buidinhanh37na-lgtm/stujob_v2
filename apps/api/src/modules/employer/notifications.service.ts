import { prisma } from "../../config/prisma";

// ============================================================
// List notifications
// ============================================================
export async function listNotifications(ntdId: number) {
  const items = await prisma.thong_bao_ntd.findMany({
    where: { nha_tuyen_dung_id: ntdId },
    orderBy: { ngay_tao: "desc" },
    take: 50,
  });

  const unread = items.filter((n) => !n.da_doc).length;

  return {
    items: items.map((n) => ({
      id: n.id,
      tieu_de: n.tieu_de,
      noi_dung: n.noi_dung,
      loai: n.loai || "info",
      da_doc: n.da_doc || 0,
      ngay_tao: n.ngay_tao,
    })),
    unread,
  };
}

// ============================================================
// Mark all read
// ============================================================
export async function markAllRead(ntdId: number) {
  await prisma.thong_bao_ntd.updateMany({
    where: { nha_tuyen_dung_id: ntdId, da_doc: 0 },
    data: { da_doc: 1 },
  });
  return { message: "Đã đánh dấu đã đọc" };
}

// ============================================================
// Count unread
// ============================================================
export async function countUnread(ntdId: number) {
  const count = await prisma.thong_bao_ntd.count({
    where: { nha_tuyen_dung_id: ntdId, da_doc: 0 },
  });
  return { count };
}