import { prisma } from "../../config/prisma";

export async function listLogs(params: {
  admin_id?: number;
  action?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const { admin_id, action, q, page = 1, limit = 30 } = params;
  const offset = (page - 1) * limit;

  const where: any = {};
  if (admin_id) where.admin_id = admin_id;
  if (action) where.hanh_dong = action;
  if (q) {
    where.OR = [
      { chi_tiet: { contains: q } },
      { hanh_dong: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.nhat_ky_admin.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.nhat_ky_admin.count({ where }),
  ]);

  const adminIds = [...new Set(items.map((i) => i.admin_id))];
  const admins = adminIds.length
    ? await prisma.quan_tri_vien.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, ho_ten: true, vai_tro: true },
      })
    : [];
  const adminMap = new Map(admins.map((a) => [a.id, a]));

  return {
    items: items.map((it) => ({
      ...it,
      admin_name: adminMap.get(it.admin_id)?.ho_ten || "",
      admin_role: adminMap.get(it.admin_id)?.vai_tro || "",
    })),
    total,
    page,
    total_pages: Math.ceil(total / limit),
  };
}

export async function listAdminOptions() {
  const items = await prisma.quan_tri_vien.findMany({
    orderBy: { ho_ten: "asc" },
    select: { id: true, ho_ten: true, vai_tro: true },
  });
  return { items };
}

export async function listActions() {
  const rows = await prisma.nhat_ky_admin.findMany({
    distinct: ["hanh_dong"],
    select: { hanh_dong: true },
    orderBy: { hanh_dong: "asc" },
  });
  return { items: rows.map((r) => r.hanh_dong) };
}

export async function getLogsStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tong, homNay, topAdmin, topAction] = await Promise.all([
    prisma.nhat_ky_admin.count(),
    prisma.nhat_ky_admin.count({ where: { created_at: { gte: today } } }),
    prisma.nhat_ky_admin.groupBy({
      by: ["admin_id"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.nhat_ky_admin.groupBy({
      by: ["hanh_dong"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const adminIds = topAdmin.map((t) => t.admin_id);
  const admins = adminIds.length
    ? await prisma.quan_tri_vien.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, ho_ten: true },
      })
    : [];
  const adminMap = new Map(admins.map((a) => [a.id, a]));

  return {
    tong,
    hom_nay: homNay,
    top_admin: topAdmin.map((t) => ({
      ho_ten: adminMap.get(t.admin_id)?.ho_ten || "—",
      so_lan: t._count.id,
    })),
    top_action: topAction.map((t) => ({
      hanh_dong: t.hanh_dong,
      so_lan: t._count.id,
    })),
  };
}

export async function cleanOldLogs(adminId: number, days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.nhat_ky_admin.deleteMany({
    where: { created_at: { lt: cutoff } },
  });

  await prisma.nhat_ky_admin.create({
    data: {
      admin_id: adminId,
      hanh_dong: "clean_logs",
      chi_tiet: `Xóa ${result.count} bản ghi cũ (>${days} ngày)`,
    },
  });

  return { message: `Đã xóa ${result.count} bản ghi`, deleted: result.count };
}