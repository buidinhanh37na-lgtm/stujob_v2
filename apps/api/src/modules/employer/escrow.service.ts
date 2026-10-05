import { prisma } from "../../config/prisma";
import { notifyNTD } from "./_helpers";

// ============================================================
// Lấy ví NTD
// ============================================================
export async function getWallet(ntdId: number) {
  let wallet = await prisma.vi_ntd.findUnique({
    where: { nha_tuyen_dung_id: ntdId },
    select: { so_du: true },
  });
  if (!wallet) {
    await prisma.vi_ntd.create({
      data: { nha_tuyen_dung_id: ntdId, so_du: 0 },
    });
    wallet = { so_du: 0 as any };
  }
  return { so_du: Number(wallet.so_du || 0) };
}

// ============================================================
// Nạp ví (giả lập)
// ============================================================
export async function deposit(ntdId: number, amount: number) {
  if (amount <= 0) throw { status: 400, message: "Số tiền không hợp lệ" };
  if (amount > 500000000)
    throw { status: 400, message: "Số tiền tối đa 500 triệu" };

  await prisma.vi_ntd.upsert({
    where: { nha_tuyen_dung_id: ntdId },
    create: { nha_tuyen_dung_id: ntdId, so_du: amount },
    update: { so_du: { increment: amount } },
  });

  await notifyNTD(
    ntdId,
    "Nạp ví thành công",
    `Đã nạp ${amount.toLocaleString("vi-VN")}đ (giả lập)`,
    "wallet"
  );

  return { message: `Đã nạp ${amount.toLocaleString("vi-VN")}đ` };
}

// ============================================================
// List escrow của NTD
// ============================================================
export async function listEscrow(ntdId: number) {
  const items = await prisma.bao_dam_thanh_toan.findMany({
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

  let totalEscrow = 0;

  const mapped = items.map((e) => {
    if (
  e.trang_thai === "da_nap" ||
  e.trang_thai === "cho_nghiem_thu"
) {
  totalEscrow += Number(e.so_tien || 0);
}
    return {
      id: e.id,
      so_tien: Number(e.so_tien || 0),
      phi_dich_vu: Number(e.phi_dich_vu || 0),
      ma_giao_dich: e.ma_giao_dich,
      trang_thai: e.trang_thai,
      ngay_giai_ngan: e.ngay_giai_ngan,
      created_at: e.created_at,
      sinh_vien_id: e.sinh_vien_id,
      ho_ten: svMap.get(e.sinh_vien_id)?.ho_ten || "",
      ma_sinh_vien: svMap.get(e.sinh_vien_id)?.ma_sinh_vien || "",
      viec_lam_id: e.viec_lam_id,
      tieu_de: e.viec_lam_id ? jobMap.get(e.viec_lam_id)?.tieu_de || "" : "",
    };
  });

  return { items: mapped, tong_ky_quy: totalEscrow };
}

// ============================================================
// Kích hoạt escrow (trừ ví NTD → da_nap)
// ============================================================
export async function activateEscrow(ntdId: number, escrowId: number) {
  const escrow = await prisma.bao_dam_thanh_toan.findFirst({
    where: { id: escrowId, nha_tuyen_dung_id: ntdId },
  });
  if (!escrow) throw { status: 404, message: "Không tìm thấy" };
  if (escrow.trang_thai !== "cho_nap")
    throw { status: 400, message: "Escrow đã được xử lý" };

  const total = Number(escrow.so_tien) + Number(escrow.phi_dich_vu || 0);

  const wallet = await prisma.vi_ntd.findUnique({
    where: { nha_tuyen_dung_id: ntdId },
    select: { so_du: true },
  });
  const balance = Number(wallet?.so_du || 0);

  if (balance < total)
    throw {
      status: 400,
      message: `Số dư không đủ. Cần thêm ${(total - balance).toLocaleString("vi-VN")}đ`,
    };

  await prisma.$transaction(async (tx) => {
    // Trừ ví
    await tx.vi_ntd.update({
      where: { nha_tuyen_dung_id: ntdId },
      data: { so_du: { decrement: total } },
    });

    // Update escrow
    await tx.bao_dam_thanh_toan.update({
      where: { id: escrowId },
      data: { trang_thai: "da_nap" },
    });

    // Thông báo SV
    try {
      await tx.thong_bao.create({
        data: {
          sinh_vien_id: escrow.sinh_vien_id,
          tieu_de: "Bảo đảm thanh toán đã kích hoạt",
          noi_dung: "NTD đã nạp tiền vào escrow cho công việc của bạn",
          loai: "escrow",
        },
      });
    } catch {}
  });

  return { message: "Đã kích hoạt bảo đảm thanh toán" };
}