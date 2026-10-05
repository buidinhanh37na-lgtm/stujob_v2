import { prisma } from "../../config/prisma";

// ============================================================
// Lấy danh sách nhóm việc
// ============================================================
export async function listCategories() {
  const items = await prisma.nhom_viec.findMany({
    orderBy: { id: "asc" },
    select: { id: true, ten_nhom: true, icon: true },
  });
  return { items };
}

// ============================================================
// Lấy mẫu tin theo nhóm
// ============================================================
export async function listTemplates(nhomViecId: number) {
  if (!nhomViecId) throw { status: 400, message: "Thiếu nhóm việc" };

  const items = await prisma.mau_tin_viec.findMany({
    where: { nhom_viec_id: nhomViecId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      ten_mau: true,
      tieu_de_goi_y: true,
      mo_ta_goi_y: true,
      ky_nang_goi_y: true,
      luong_min: true,
      luong_max: true,
    },
  });

  return {
    items: items.map((m) => ({
      ...m,
      luong_min: m.luong_min ? Number(m.luong_min) : null,
      luong_max: m.luong_max ? Number(m.luong_max) : null,
    })),
  };
}