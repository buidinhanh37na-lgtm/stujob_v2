import { prisma } from "../../config/prisma";

// ============================================================
// Lấy số dư + lịch sử giao dịch
// ============================================================
export async function getWallet(sinhVienId: number) {
  const [wallet, txs] = await Promise.all([
    prisma.vi_tien.findUnique({
      where: { sinh_vien_id: sinhVienId },
      select: { so_du: true },
    }),
    prisma.giao_dich.findMany({
      where: { sinh_vien_id: sinhVienId },
      orderBy: { created_at: "desc" },
      take: 50,
    }),
  ]);

  let soDu = Number(wallet?.so_du || 0);
  let tongThu = 0;
  let tongChi = 0;

  for (const t of txs) {
    if (t.trang_thai !== "thanh_cong") continue;
    const amount = Number(t.so_tien || 0);
    if (t.loai === "thu_nhap") tongThu += amount;
    else tongChi += amount;
  }

  return {
    so_du: soDu,
    tong_thu: tongThu,
    tong_chi: tongChi,
    items: txs.map((t) => ({
      id: t.id,
      so_tien: Number(t.so_tien || 0),
      phi_san: Number(t.phi_san || 0),
      loai: t.loai,
      mo_ta: t.mo_ta,
      trang_thai: t.trang_thai,
      created_at: t.created_at,
    })),
  };
}

// ============================================================
// Lịch sử rút tiền
// ============================================================
export async function getWithdrawHistory(sinhVienId: number) {
  const items = await prisma.yeu_cau_rut_tien.findMany({
    where: { sinh_vien_id: sinhVienId },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  return {
    items: items.map((it) => ({
      id: it.id,
      so_tien: Number(it.so_tien || 0),
      ngan_hang: it.ngan_hang,
      so_tai_khoan: it.so_tai_khoan,
      chu_tai_khoan: it.chu_tai_khoan,
      trang_thai: it.trang_thai,
      ly_do_tu_choi: it.ly_do_tu_choi,
      created_at: it.created_at,
    })),
  };
}

// ============================================================
// Rút tiền (giả lập - trừ ví ngay, status da_chuyen)
// ============================================================
export interface WithdrawInput {
  so_tien: number;
  ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
}

export async function createWithdrawRequest(
  sinhVienId: number,
  input: WithdrawInput
) {
  const amount = Number(input.so_tien);

  if (amount < 50000)
    throw { status: 400, message: "Số tiền rút tối thiểu 50.000đ" };
  if (amount > 50000000)
    throw { status: 400, message: "Số tiền rút tối đa 50.000.000đ" };
  if (!input.ngan_hang || !input.so_tai_khoan || !input.chu_tai_khoan)
    throw { status: 400, message: "Vui lòng điền đủ thông tin ngân hàng" };

  // Lấy ví
  const wallet = await prisma.vi_tien.findUnique({
    where: { sinh_vien_id: sinhVienId },
    select: { so_du: true },
  });
  const balance = Number(wallet?.so_du || 0);

  if (balance < amount)
    throw {
      status: 400,
      message: `Số dư không đủ. Hiện có: ${balance.toLocaleString("vi-VN")}đ`,
    };

  const result = await prisma.$transaction(async (tx) => {
    // 1. Trừ ví
    await tx.vi_tien.update({
      where: { sinh_vien_id: sinhVienId },
      data: { so_du: { decrement: amount } },
    });

    // 2. Tạo yêu cầu rút
    const req = await tx.yeu_cau_rut_tien.create({
      data: {
        sinh_vien_id: sinhVienId,
        so_tien: amount,
        ngan_hang: input.ngan_hang.trim(),
        so_tai_khoan: input.so_tai_khoan.trim(),
        chu_tai_khoan: input.chu_tai_khoan.trim().toUpperCase(),
        trang_thai: "da_chuyen",
        ghi_chu: "Giả lập - Rút thành công ngay",
      },
    });

    // 3. Ghi giao dịch ví
    await tx.giao_dich.create({
      data: {
        sinh_vien_id: sinhVienId,
        so_tien: amount,
        loai: "rut_tien",
        mo_ta: `Rút tiền #${req.id} về ${input.ngan_hang} - ${input.so_tai_khoan}`,
        trang_thai: "thanh_cong",
      },
    });

    // 4. Thông báo
    try {
      await tx.thong_bao.create({
        data: {
          sinh_vien_id: sinhVienId,
          tieu_de: "💸 Rút tiền thành công",
          noi_dung: `Đã rút ${amount.toLocaleString("vi-VN")}đ về ${input.ngan_hang} - ${input.so_tai_khoan} (giả lập).`,
          loai: "success",
        },
      });
    } catch {}

    return { request_id: req.id };
  });

  return {
    message: `Đã rút ${amount.toLocaleString("vi-VN")}đ thành công!`,
    request_id: result.request_id,
  };
}