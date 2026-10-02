import { prisma } from "../../config/prisma";

// ============================================================
// Lấy danh sách ứng tuyển của SV
// ============================================================
export async function listApplications(sinhVienId: number) {
  const items = await prisma.ung_tuyen.findMany({
    where: { sinh_vien_id: sinhVienId },
    orderBy: { created_at: "desc" },
    include: {
      viec_lam: {
        select: {
          id: true,
          tieu_de: true,
          luong_min: true,
          luong_max: true,
          loai_cong_viec: true,
          nha_tuyen_dung_id: true,
        },
      },
    },
  });

  // Lấy tên công ty
  const ntdIds = [
    ...new Set(items.map((it) => (it.viec_lam as any)?.nha_tuyen_dung_id).filter(Boolean)),
  ] as number[];

  const ntdList = ntdIds.length
    ? await prisma.nha_tuyen_dung.findMany({
        where: { id: { in: ntdIds } },
        select: { id: true, ten_cong_ty: true, logo: true },
      })
    : [];

  const ntdMap = new Map(ntdList.map((n) => [n.id, n]));

  return {
    items: items.map((it) => {
      const v = it.viec_lam as any;
      const ntd = v?.nha_tuyen_dung_id ? ntdMap.get(v.nha_tuyen_dung_id) : null;
      return {
        id: it.id,
        viec_lam_id: it.viec_lam_id,
        loai: it.loai,
        loi_nhan: it.loi_nhan,
        trang_thai: it.trang_thai,
        created_at: it.created_at,
        tieu_de: v?.tieu_de || "",
        luong_min: v?.luong_min ? Number(v.luong_min) : 0,
        luong_max: v?.luong_max ? Number(v.luong_max) : 0,
        loai_cong_viec: v?.loai_cong_viec || "remote",
        ten_cong_ty: ntd?.ten_cong_ty || "",
        logo: ntd?.logo || null,
      };
    }),
  };
}

// ============================================================
// Tạo ứng tuyển
// ============================================================
export async function createApplication(
  sinhVienId: number,
  viecLamId: number,
  loiNhan: string
) {
  // Check job tồn tại + đang mở
  const job = await prisma.viec_lam.findUnique({
    where: { id: viecLamId },
    select: { id: true, tieu_de: true, trang_thai: true, han_chot: true, nha_tuyen_dung_id: true },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy công việc" };
  if (job.trang_thai !== "dang_mo")
    throw { status: 400, message: "Công việc đã đóng" };

  // Check hạn chót
  if (job.han_chot && new Date(job.han_chot) < new Date()) {
    throw { status: 400, message: "Đã hết hạn ứng tuyển" };
  }

  // Check đã ứng tuyển chưa
  const existing = await prisma.ung_tuyen.findFirst({
    where: { sinh_vien_id: sinhVienId, viec_lam_id: viecLamId },
    select: { id: true },
  });
  if (existing) throw { status: 400, message: "Bạn đã ứng tuyển công việc này rồi" };

  // Tạo ứng tuyển
  const app = await prisma.ung_tuyen.create({
    data: {
      sinh_vien_id: sinhVienId,
      viec_lam_id: viecLamId,
      loai: "ung_tuyen",
      loi_nhan: loiNhan?.trim() || null,
      trang_thai: "cho_duyet",
    },
    select: { id: true, created_at: true },
  });

  // Thông báo cho SV
  try {
    await prisma.thong_bao.create({
      data: {
        sinh_vien_id: sinhVienId,
        tieu_de: "Ứng tuyển thành công",
        noi_dung: "Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.",
        loai: "success",
      },
    });
  } catch {
    // Ignore
  }

  // Thông báo cho NTD
  try {
    await prisma.thong_bao_ntd.create({
      data: {
        nha_tuyen_dung_id: job.nha_tuyen_dung_id,
        tieu_de: "Có ứng tuyển mới",
        noi_dung: `Bạn có ứng tuyển mới cho công việc: ${job.tieu_de}`,
        loai: "info",
      },
    });
  } catch {
    // Ignore
  }

  return { id: app.id, message: "Đã gửi ứng tuyển" };
}

// ============================================================
// Hủy ứng tuyển (chỉ khi còn cho_duyet)
// ============================================================
export async function cancelApplication(sinhVienId: number, id: number) {
  const app = await prisma.ung_tuyen.findFirst({
    where: { id, sinh_vien_id: sinhVienId },
    select: { id: true, trang_thai: true },
  });
  if (!app) throw { status: 404, message: "Không tìm thấy" };
  if (app.trang_thai !== "cho_duyet")
    throw { status: 400, message: "Không thể hủy (đã được xử lý)" };

  await prisma.ung_tuyen.delete({ where: { id } });
  return { message: "Đã hủy ứng tuyển" };
}