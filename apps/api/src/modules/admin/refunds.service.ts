import { prisma } from "../../config/prisma";
import { logAdmin } from "./_helpers";

// ============================================================
// List lịch sử hoàn tiền
// ============================================================
export async function listRefunds(q: string) {
  const where: any = {};
  if (q) where.ly_do = { contains: q };

  const items = await prisma.lich_su_hoan_tien.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 200,
  });

  // Lookup người nhận + admin + khiếu nại
  const svIds = new Set<number>();
  const ntdIds = new Set<number>();
  const adminIds = new Set<number>();
  const knIds = new Set<number>();

  for (const r of items) {
    if (r.nguoi_nhan_loai === "sinh_vien") svIds.add(r.nguoi_nhan_id);
    else ntdIds.add(r.nguoi_nhan_id);
    if (r.admin_id) adminIds.add(r.admin_id);
    if (r.khieu_nai_id) knIds.add(r.khieu_nai_id);
  }

  const [svList, ntdList, adminList, knList] = await Promise.all([
    svIds.size
      ? prisma.sinh_vien.findMany({
          where: { id: { in: [...svIds] } },
          select: { id: true, ho_ten: true, ma_sinh_vien: true },
        })
      : [],
    ntdIds.size
      ? prisma.nha_tuyen_dung.findMany({
          where: { id: { in: [...ntdIds] } },
          select: { id: true, ten_cong_ty: true },
        })
      : [],
    adminIds.size
      ? prisma.quan_tri_vien.findMany({
          where: { id: { in: [...adminIds] } },
          select: { id: true, ho_ten: true },
        })
      : [],
    knIds.size
      ? prisma.khieu_nai.findMany({
          where: { id: { in: [...knIds] } },
          select: { id: true, tieu_de: true },
        })
      : [],
  ]);

  const svMap = new Map(svList.map((s) => [s.id, s]));
  const ntdMap = new Map(ntdList.map((n) => [n.id, n]));
  const adminMap = new Map(adminList.map((a) => [a.id, a]));
  const knMap = new Map(knList.map((k) => [k.id, k]));

  return {
    items: items.map((r) => {
      const nguoiNhan =
        r.nguoi_nhan_loai === "sinh_vien"
          ? svMap.get(r.nguoi_nhan_id)?.ho_ten || ""
          : ntdMap.get(r.nguoi_nhan_id)?.ten_cong_ty || "";

      return {
        id: r.id,
        so_tien: Number(r.so_tien || 0),
        ly_do: r.ly_do,
        nguoi_nhan_loai: r.nguoi_nhan_loai,
        nguoi_nhan_id: r.nguoi_nhan_id,
        nguoi_nhan_ten: nguoiNhan,
        khieu_nai_id: r.khieu_nai_id,
        ten_khieu_nai: r.khieu_nai_id
          ? knMap.get(r.khieu_nai_id)?.tieu_de || ""
          : "",
        admin_name: r.admin_id ? adminMap.get(r.admin_id)?.ho_ten || "" : "Hệ thống",
        created_at: r.created_at,
      };
    }),
  };
}

// ============================================================
// Tạo hoàn tiền thủ công
// ============================================================
export interface CreateRefundInput {
  nguoi_nhan_loai: "sinh_vien" | "nha_tuyen_dung";
  nguoi_nhan_id: number;
  so_tien: number;
  ly_do: string;
  khieu_nai_id?: number | null;
  bao_dam_id?: number | null;
}

export async function createRefund(adminId: number, input: CreateRefundInput) {
  if (!["sinh_vien", "nha_tuyen_dung"].includes(input.nguoi_nhan_loai))
    throw { status: 400, message: "Loại người nhận không hợp lệ" };
  if (!input.nguoi_nhan_id || input.so_tien <= 0)
    throw { status: 400, message: "Số tiền không hợp lệ" };
  if (!input.ly_do?.trim()) throw { status: 400, message: "Thiếu lý do" };

  const tien = input.so_tien;

  await prisma.$transaction(async (tx) => {
    if (input.nguoi_nhan_loai === "sinh_vien") {
      await tx.vi_tien.upsert({
        where: { sinh_vien_id: input.nguoi_nhan_id },
        create: { sinh_vien_id: input.nguoi_nhan_id, so_du: tien },
        update: { so_du: { increment: tien } },
      });

      await tx.giao_dich.create({
        data: {
          sinh_vien_id: input.nguoi_nhan_id,
          so_tien: tien,
          loai: "thu_nhap",
          mo_ta: input.ly_do,
          trang_thai: "thanh_cong",
        },
      });

      try {
        await tx.thong_bao.create({
          data: {
            sinh_vien_id: input.nguoi_nhan_id,
            tieu_de: "💰 Nhận tiền hoàn",
            noi_dung: `Bạn nhận được ${tien.toLocaleString("vi-VN")}đ. Lý do: ${input.ly_do}`,
            loai: "success",
          },
        });
      } catch {}
    } else {
      await tx.vi_ntd.upsert({
        where: { nha_tuyen_dung_id: input.nguoi_nhan_id },
        create: { nha_tuyen_dung_id: input.nguoi_nhan_id, so_du: tien },
        update: { so_du: { increment: tien } },
      });

      try {
        await tx.thong_bao_ntd.create({
          data: {
            nha_tuyen_dung_id: input.nguoi_nhan_id,
            tieu_de: "💰 Nhận tiền hoàn",
            noi_dung: `Bạn nhận được ${tien.toLocaleString("vi-VN")}đ. Lý do: ${input.ly_do}`,
            loai: "success",
          },
        });
      } catch {}
    }

    await tx.lich_su_hoan_tien.create({
      data: {
        khieu_nai_id: input.khieu_nai_id || null,
        bao_dam_id: input.bao_dam_id || null,
        nguoi_nhan_loai: input.nguoi_nhan_loai,
        nguoi_nhan_id: input.nguoi_nhan_id,
        so_tien: tien,
        ly_do: input.ly_do,
        admin_id: adminId,
      },
    });
  });

  await logAdmin(
    adminId,
    "create_refund",
    input.nguoi_nhan_loai,
    input.nguoi_nhan_id,
    `Hoàn: ${tien}. Lý do: ${input.ly_do}`
  );

  return { message: "Đã tạo hoàn tiền" };
}

// ============================================================
// Stats
// ============================================================
export async function getStats() {
  const items = await prisma.lich_su_hoan_tien.findMany({
    select: { so_tien: true, nguoi_nhan_loai: true },
  });

  let tong = 0;
  let choSV = 0;
  let choNTD = 0;
  for (const r of items) {
    const t = Number(r.so_tien || 0);
    tong += t;
    if (r.nguoi_nhan_loai === "sinh_vien") choSV += t;
    else choNTD += t;
  }

  const escrowHold = await prisma.bao_dam_thanh_toan.aggregate({
    where: { trang_thai: { in: ["da_nap", "cho_nghiem_thu"] } },
    _sum: { so_tien: true },
  });

  return {
    tong_hoan: tong,
    cho_sv: choSV,
    cho_ntd: choNTD,
    so_lan: items.length,
    escrow_dang_giu: Number(escrowHold._sum.so_tien || 0),
  };
}