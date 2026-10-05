import { prisma } from "../../config/prisma";

export async function listAll() {
  const rows = await prisma.cau_hinh_he_thong.findMany({
    orderBy: { khoa: "asc" },
  });
  const out: Record<string, { gia_tri: string; mo_ta: string | null }> = {};
  for (const r of rows) {
    out[r.khoa] = { gia_tri: r.gia_tri || "", mo_ta: r.mo_ta };
  }
  return { items: out };
}

export async function updateMany(
  adminId: number,
  items: Record<string, string>
) {
  const keys = Object.keys(items);
  if (keys.length === 0) throw { status: 400, message: "Không có dữ liệu" };

  await prisma.$transaction(async (tx) => {
    for (const key of keys) {
      await tx.cau_hinh_he_thong.upsert({
        where: { khoa: key },
        create: { khoa: key, gia_tri: items[key] },
        update: { gia_tri: items[key] },
      });
    }
    await tx.nhat_ky_admin.create({
      data: {
        admin_id: adminId,
        hanh_dong: "update_settings",
        chi_tiet: `Cập nhật ${keys.length} cấu hình`,
      },
    });
  });

  return { message: "Đã lưu cấu hình" };
}

export async function getOne(key: string) {
  const row = await prisma.cau_hinh_he_thong.findUnique({
    where: { khoa: key },
  });
  return { key, value: row?.gia_tri || null };
}

export async function getSystemInfo() {
  const [dbSize, tables, mysqlV] = await Promise.all([
    prisma.$queryRaw<{ size: number }[]>`
      SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size
      FROM information_schema.TABLES WHERE table_schema = DATABASE()
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM information_schema.TABLES
      WHERE table_schema = DATABASE()
    `,
    prisma.$queryRaw<{ v: string }[]>`SELECT VERSION() AS v`,
  ]);

  return {
    node_version: process.version,
    mysql_version: mysqlV[0]?.v || "—",
    db_size_mb: Number(dbSize[0]?.size || 0),
    tables: Number(tables[0]?.count || 0),
    server_time: new Date().toLocaleString("vi-VN"),
  };
}