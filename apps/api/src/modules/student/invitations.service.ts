import { prisma } from "../../config/prisma";

// ============================================================
// Lấy danh sách lời mời
// ============================================================
export async function listInvitations(sinhVienId: number, status: string) {
  const where: any = {
    sinh_vien_id: sinhVienId,
    loai: "loi_moi",
  };
  if (status !== "all") where.trang_thai = status;

  const items = await prisma.ung_tuyen.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      viec_lam: {
        select: {
          id: true,
          tieu_de: true,
          mo_ta: true,
          ky_nang_can: true,
          luong_min: true,
          luong_max: true,
          loai_cong_viec: true,
          thu_lam_viec: true,
          gio_bat_dau: true,
          gio_ket_thuc: true,
          han_chot: true,
          ngay_bat_dau: true,
          ngay_ket_thuc: true,
          dia_chi_lam_viec: true,
          nha_tuyen_dung_id: true,
        },
      },
    },
  });

  // Lookup NTD
  const ntdIds = [
    ...new Set(items.map((it) => (it.viec_lam as any)?.nha_tuyen_dung_id).filter(Boolean)),
  ] as number[];

  const ntdList = ntdIds.length
    ? await prisma.nha_tuyen_dung.findMany({
        where: { id: { in: ntdIds } },
        select: { id: true, ten_cong_ty: true, logo: true, linh_vuc: true, dia_chi: true },
      })
    : [];

  const ntdMap = new Map(ntdList.map((n) => [n.id, n]));

  // Đếm pending
  const pending = await prisma.ung_tuyen.count({
    where: { sinh_vien_id: sinhVienId, loai: "loi_moi", trang_thai: "cho_duyet" },
  });

  return {
    items: items.map((it) => serialize(it, ntdMap)),
    pending,
  };
}

// ============================================================
// Chi tiết 1 lời mời
// ============================================================
export async function getInvitationDetail(sinhVienId: number, id: number) {
  const it = await prisma.ung_tuyen.findFirst({
    where: { id, sinh_vien_id: sinhVienId, loai: "loi_moi" },
    include: {
      viec_lam: {
        include: {
          nha_tuyen_dung: {
            select: { id: true, ten_cong_ty: true, logo: true, linh_vuc: true, dia_chi: true, email: true, so_dien_thoai: true },
          },
        },
      },
    },
  });

  if (!it) throw { status: 404, message: "Không tìm thấy lời mời" };

  const v = it.viec_lam as any;
  const ntd = v?.nha_tuyen_dung;

  return {
    invitation: {
      id: it.id,
      loi_nhan: it.loi_nhan,
      trang_thai: it.trang_thai,
      created_at: it.created_at,
      ngay_moi: it.ngay_moi,
      viec_lam_id: v?.id,
      tieu_de: v?.tieu_de,
      mo_ta: v?.mo_ta,
      ky_nang_can: v?.ky_nang_can,
      luong_min: Number(v?.luong_min || 0),
      luong_max: Number(v?.luong_max || 0),
      loai_cong_viec: v?.loai_cong_viec,
      thu_lam_viec: v?.thu_lam_viec,
      gio_bat_dau: formatTime(v?.gio_bat_dau),
      gio_ket_thuc: formatTime(v?.gio_ket_thuc),
      han_chot: v?.han_chot,
      ngay_bat_dau: v?.ngay_bat_dau,
      ngay_ket_thuc: v?.ngay_ket_thuc,
      dia_chi_lam_viec: v?.dia_chi_lam_viec,
      so_luong_can: v?.so_luong_can,
      so_buoi: v?.so_buoi,
      gio_uoc_tinh: v?.gio_uoc_tinh,
      ntd_id: ntd?.id,
      ten_cong_ty: ntd?.ten_cong_ty,
      logo: ntd?.logo,
      linh_vuc: ntd?.linh_vuc,
      ntd_dia_chi: ntd?.dia_chi,
      ntd_email: ntd?.email,
      ntd_sdt: ntd?.so_dien_thoai,
    },
  };
}

// ============================================================
// Chấp nhận lời mời
// ============================================================
export async function acceptInvitation(sinhVienId: number, id: number) {
  const ut = await prisma.ung_tuyen.findFirst({
    where: { id, sinh_vien_id: sinhVienId, loai: "loi_moi" },
    include: {
      viec_lam: {
        select: {
          id: true,
          tieu_de: true,
          mo_ta: true,
          luong_min: true,
          luong_max: true,
          han_chot: true,
          ngay_bat_dau: true,
          ngay_ket_thuc: true,
          phi_dich_vu: true,
          nha_tuyen_dung_id: true,
        },
      },
    },
  });

  if (!ut) throw { status: 404, message: "Không tìm thấy" };
  if (ut.trang_thai !== "cho_duyet")
    throw { status: 400, message: "Lời mời đã được xử lý" };

  const v = ut.viec_lam as any;
  if (!v) throw { status: 400, message: "Không tìm thấy công việc" };

  const escrowCode = "ESC" + Date.now() + Math.floor(Math.random() * 900 + 100);
  const salary = (Number(v.luong_min || 0) + Number(v.luong_max || 0)) / 2;
  const fee = Number(v.phi_dich_vu || 0);

  // Deadline cho nhiệm vụ
  const deadline = v.han_chot
    ? new Date(v.han_chot)
    : v.ngay_ket_thuc
    ? new Date(v.ngay_ket_thuc)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update trạng thái
    await tx.ung_tuyen.update({
      where: { id },
      data: { trang_thai: "da_chap_nhan" },
    });

    // 2. Tạo nhiệm vụ
    await tx.nhiem_vu.create({
      data: {
        sinh_vien_id: sinhVienId,
        viec_lam_id: v.id,
        ten_nhiem_vu: v.tieu_de,
        mo_ta: v.mo_ta,
        han_nop: deadline,
        trang_thai: "dang_lam",
      },
    });

    // 3. Tạo escrow
    await tx.bao_dam_thanh_toan.create({
      data: {
        ung_tuyen_id: id,
        viec_lam_id: v.id,
        nha_tuyen_dung_id: v.nha_tuyen_dung_id,
        sinh_vien_id: sinhVienId,
        so_tien: salary,
        phi_dich_vu: fee,
        ma_giao_dich: escrowCode,
        trang_thai: "cho_nap",
      },
    });

    // 4. Thông báo NTD
    try {
      await tx.thong_bao_ntd.create({
        data: {
          nha_tuyen_dung_id: v.nha_tuyen_dung_id,
          tieu_de: "Sinh viên đã chấp nhận lời mời",
          noi_dung: `Sinh viên đã đồng ý làm việc "${v.tieu_de}". Vui lòng ký quỹ escrow.`,
          loai: "success",
        },
      });
    } catch {}

    // 5. Thông báo SV
    try {
      await tx.thong_bao.create({
        data: {
          sinh_vien_id: sinhVienId,
          tieu_de: "Bạn đã chấp nhận lời mời",
          noi_dung: "Hãy liên hệ NTD để trao đổi chi tiết công việc.",
          loai: "success",
        },
      });
    } catch {}

    return { escrowCode };
  });

  return {
    message: "Đã chấp nhận lời mời! Vào mục Nhiệm vụ để xem chi tiết.",
    escrow_code: result.escrowCode,
  };
}

// ============================================================
// Từ chối lời mời
// ============================================================
export async function rejectInvitation(
  sinhVienId: number,
  id: number,
  lyDo: string
) {
  const ut = await prisma.ung_tuyen.findFirst({
    where: { id, sinh_vien_id: sinhVienId, loai: "loi_moi" },
    include: {
      viec_lam: { select: { tieu_de: true, nha_tuyen_dung_id: true } },
    },
  });
  if (!ut) throw { status: 404, message: "Không tìm thấy" };

  await prisma.ung_tuyen.update({
    where: { id },
    data: { trang_thai: "tu_choi" },
  });

  const v = ut.viec_lam as any;
  if (v?.nha_tuyen_dung_id) {
    try {
      await prisma.thong_bao_ntd.create({
        data: {
          nha_tuyen_dung_id: v.nha_tuyen_dung_id,
          tieu_de: "Sinh viên từ chối lời mời",
          noi_dung:
            `Sinh viên đã từ chối lời mời cho "${v.tieu_de}".` +
            (lyDo ? ` Lý do: ${lyDo}` : ""),
          loai: "info",
        },
      });
    } catch {}
  }

  return { message: "Đã từ chối lời mời" };
}

// ============================================================
// Đếm số lời mời chờ
// ============================================================
export async function countPending(sinhVienId: number) {
  const count = await prisma.ung_tuyen.count({
    where: { sinh_vien_id: sinhVienId, loai: "loi_moi", trang_thai: "cho_duyet" },
  });
  return { count };
}

// ============================================================
// HELPERS
// ============================================================
function formatTime(t: any): string {
  if (!t) return "";
  if (typeof t === "string") return t.slice(0, 5);
  const h = String(t.getUTCHours()).padStart(2, "0");
  const m = String(t.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function serialize(it: any, ntdMap: Map<number, any>) {
  const v = it.viec_lam as any;
  const ntd = v?.nha_tuyen_dung_id ? ntdMap.get(v.nha_tuyen_dung_id) : null;
  return {
    id: it.id,
    loi_nhan: it.loi_nhan,
    trang_thai: it.trang_thai,
    created_at: it.created_at,
    ngay_moi: it.ngay_moi,
    viec_lam_id: v?.id,
    tieu_de: v?.tieu_de || "",
    mo_ta: v?.mo_ta,
    ky_nang_can: v?.ky_nang_can,
    luong_min: Number(v?.luong_min || 0),
    luong_max: Number(v?.luong_max || 0),
    loai_cong_viec: v?.loai_cong_viec,
    thu_lam_viec: v?.thu_lam_viec,
    han_chot: v?.han_chot,
    ngay_bat_dau: v?.ngay_bat_dau,
    ngay_ket_thuc: v?.ngay_ket_thuc,
    ntd_id: ntd?.id,
    ten_cong_ty: ntd?.ten_cong_ty || "",
    logo: ntd?.logo,
    linh_vuc: ntd?.linh_vuc,
  };
}