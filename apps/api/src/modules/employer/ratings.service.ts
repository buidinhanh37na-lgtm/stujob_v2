import { prisma } from "../../config/prisma";

// ============================================================
// List đánh giá NTD đã gửi
// ============================================================
export async function listRatings(ntdId: number) {
  const items = await prisma.danh_gia.findMany({
    where: { nha_tuyen_dung_id: ntdId },
    orderBy: { created_at: "desc" },
  });

  // Lookup SV + job
  const svIds = [...new Set(items.map((i) => i.sinh_vien_id))];
  const jobIds = [...new Set(items.map((i) => i.viec_lam_id).filter(Boolean))] as number[];

  const [svList, jobList] = await Promise.all([
    svIds.length
      ? prisma.sinh_vien.findMany({
          where: { id: { in: svIds } },
          select: { id: true, ho_ten: true, ma_sinh_vien: true },
        })
      : [],
    jobIds.length
      ? prisma.viec_lam.findMany({
          where: { id: { in: jobIds } },
          select: { id: true, tieu_de: true },
        })
      : [],
  ]);

  const svMap = new Map(svList.map((s) => [s.id, s]));
  const jobMap = new Map(jobList.map((j) => [j.id, j]));

  return {
    items: items.map((d) => ({
      id: d.id,
      sinh_vien_id: d.sinh_vien_id,
      viec_lam_id: d.viec_lam_id,
      diem: d.diem,
      nhan_xet: d.nhan_xet,
      created_at: d.created_at,
      ho_ten: svMap.get(d.sinh_vien_id)?.ho_ten || "",
      ma_sinh_vien: svMap.get(d.sinh_vien_id)?.ma_sinh_vien || "",
      tieu_de: d.viec_lam_id ? jobMap.get(d.viec_lam_id)?.tieu_de || "" : "",
    })),
  };
}

// ============================================================
// Tạo đánh giá
// ============================================================
export interface CreateRatingInput {
  sinh_vien_id: number;
  viec_lam_id?: number | null;
  diem: number;
  nhan_xet?: string;
}

export async function createRating(ntdId: number, input: CreateRatingInput) {
  if (input.diem < 1 || input.diem > 5)
    throw { status: 400, message: "Điểm từ 1 đến 5" };

  // Check NTD từng thuê SV này
  const hasHired = await prisma.ung_tuyen.findFirst({
    where: {
      sinh_vien_id: input.sinh_vien_id,
      trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] },
      viec_lam: { nha_tuyen_dung_id: ntdId },
    },
    select: { id: true },
  });
  if (!hasHired)
    throw { status: 400, message: "Bạn chưa từng thuê sinh viên này" };

  // Tạo đánh giá
  await prisma.danh_gia.create({
    data: {
      nha_tuyen_dung_id: ntdId,
      sinh_vien_id: input.sinh_vien_id,
      viec_lam_id: input.viec_lam_id || null,
      diem: input.diem,
      nhan_xet: input.nhan_xet?.trim() || null,
    },
  });

  // Cập nhật điểm trung bình
  const agg = await prisma.danh_gia.aggregate({
    where: { sinh_vien_id: input.sinh_vien_id },
    _avg: { diem: true },
    _count: { id: true },
  });

  await prisma.sinh_vien.update({
    where: { id: input.sinh_vien_id },
    data: {
      diem_danh_gia: agg._avg.diem ? Number(agg._avg.diem) : 0,
      so_lan_danh_gia: agg._count.id,
    },
  });

  // Thông báo SV
  try {
    await prisma.thong_bao.create({
      data: {
        sinh_vien_id: input.sinh_vien_id,
        tieu_de: "Bạn nhận được đánh giá mới",
        noi_dung: `Điểm: ${input.diem}/5. ${input.nhan_xet || ""}`,
        loai: "info",
      },
    });
  } catch {}

  return { message: "Đã đánh giá sinh viên" };
}