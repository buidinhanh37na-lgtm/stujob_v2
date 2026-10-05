import { prisma } from "../../config/prisma";

// ============================================================
// List thông báo của admin hiện tại
// Bao gồm thông báo global (admin_id IS NULL)
// ============================================================
export async function listNotifications(adminId: number) {
  const items = await prisma.thong_bao_admin.findMany({
    where: {
      OR: [{ admin_id: adminId }, { admin_id: null }],
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const unread = items.filter((it) => !it.da_doc).length;

  return {
    items: items.map((it) => ({
      id: it.id,
      admin_id: it.admin_id,
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
// Đếm số chưa đọc (cho badge sidebar)
// ============================================================
export async function countUnread(adminId: number) {
  const count = await prisma.thong_bao_admin.count({
    where: {
      OR: [{ admin_id: adminId }, { admin_id: null }],
      da_doc: 0,
    },
  });
  return { count };
}

// ============================================================
// Đánh dấu đã đọc
// - Nếu có id: đánh dấu 1 cái
// - Nếu không: đánh dấu tất cả
// ============================================================
export async function markRead(adminId: number, id?: number) {
  if (id) {
    await prisma.thong_bao_admin.updateMany({
      where: {
        id,
        OR: [{ admin_id: adminId }, { admin_id: null }],
      },
      data: { da_doc: 1 },
    });
  } else {
    await prisma.thong_bao_admin.updateMany({
      where: {
        OR: [{ admin_id: adminId }, { admin_id: null }],
        da_doc: 0,
      },
      data: { da_doc: 1 },
    });
  }
  return { message: "Đã đánh dấu đã đọc" };
}

// ============================================================
// Tạo thông báo mới (super_admin / admin)
// targetAdminId = null → broadcast toàn bộ admin
// ============================================================
export async function createNotification(
  senderId: number,
  data: {
    tieu_de: string;
    noi_dung: string;
    loai: string;
    admin_id: number | null;
  }
) {
  if (!data.tieu_de?.trim())
    throw { status: 400, message: "Thiếu tiêu đề" };

  const created = await prisma.thong_bao_admin.create({
    data: {
      admin_id: data.admin_id,
      tieu_de: data.tieu_de.trim(),
      noi_dung: data.noi_dung?.trim() || "",
      loai: data.loai || "info",
    },
  });

  await prisma.nhat_ky_admin.create({
    data: {
      admin_id: senderId,
      hanh_dong: "send_notification",
      doi_tuong_loai: "admin",
      doi_tuong_id: data.admin_id,
      chi_tiet: data.tieu_de,
    },
  });

  return { message: "Đã gửi thông báo", id: created.id };
}

// ============================================================
// Xóa 1 thông báo (chỉ global hoặc của chính mình)
// ============================================================
export async function deleteNotification(adminId: number, id: number) {
  const noti = await prisma.thong_bao_admin.findUnique({
    where: { id },
    select: { id: true, admin_id: true },
  });
  if (!noti) throw { status: 404, message: "Không tìm thấy" };

  if (noti.admin_id !== null && noti.admin_id !== adminId)
    throw { status: 403, message: "Không có quyền xóa" };

  await prisma.thong_bao_admin.delete({ where: { id } });
  return { message: "Đã xóa thông báo" };
}