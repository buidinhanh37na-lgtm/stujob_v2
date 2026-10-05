import { prisma } from "../../config/prisma";
import { logAdmin } from "./_helpers";

// ============================================================
// List users (SV hoặc NTD)
// ============================================================
export async function listUsers(type: string, q: string) {
  if (type === "sinh_vien") {
    const where: any = {};
    if (q) {
      where.OR = [
        { ma_sinh_vien: { contains: q } },
        { ho_ten: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const items = await prisma.sinh_vien.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        ma_sinh_vien: true,
        ho_ten: true,
        email: true,
        truong: true,
        trang_thai_xac_thuc: true,
        bi_khoa: true,
        created_at: true,
      },
    });

    return {
      type: "sinh_vien",
      items: items.map((i) => ({
        id: i.id,
        code: i.ma_sinh_vien,
        name: i.ho_ten,
        email: i.email,
        extra: i.truong || "",
        verified: i.trang_thai_xac_thuc,
        locked: i.bi_khoa === 1,
        created_at: i.created_at,
      })),
    };
  } else {
    const where: any = {};
    if (q) {
      where.OR = [
        { ten_cong_ty: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const items = await prisma.nha_tuyen_dung.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        ten_cong_ty: true,
        email: true,
        loai: true,
        trang_thai_xac_thuc: true,
        bi_khoa: true,
        created_at: true,
      },
    });

    return {
      type: "nha_tuyen_dung",
      items: items.map((i) => ({
        id: i.id,
        code: i.loai,
        name: i.ten_cong_ty,
        email: i.email,
        extra: i.loai,
        verified: i.trang_thai_xac_thuc,
        locked: i.bi_khoa === 1,
        created_at: i.created_at,
      })),
    };
  }
}

// ============================================================
// Chi tiết 1 user
// ============================================================
export async function getUserDetail(type: string, id: number) {
  if (type === "sinh_vien") {
    const sv = await prisma.sinh_vien.findUnique({
      where: { id },
      select: {
        id: true,
        ma_sinh_vien: true,
        ho_ten: true,
        email: true,
        so_dien_thoai: true,
        truong: true,
        khoa: true,
        chuyen_nganh: true,
        nam_hoc: true,
        gpa: true,
        mo_ta: true,
        diem_danh_gia: true,
        so_lan_danh_gia: true,
        trang_thai_xac_thuc: true,
        bi_khoa: true,
        created_at: true,
      },
    });
    if (!sv) throw { status: 404, message: "Không tìm thấy" };

    const [kyNang, chungChi, stats] = await Promise.all([
      prisma.ky_nang.findMany({
        where: { sinh_vien_id: id },
        select: { ten_ky_nang: true, muc_do: true },
      }),
      prisma.chung_chi.findMany({
        where: { sinh_vien_id: id },
        select: { id: true, ten_chung_chi: true, to_chuc: true, ngay_cap: true },
      }),
      Promise.all([
        prisma.ung_tuyen.count({ where: { sinh_vien_id: id } }),
        prisma.nhiem_vu.count({
          where: { sinh_vien_id: id, trang_thai: "hoan_thanh" },
        }),
        prisma.giao_dich.aggregate({
          where: { sinh_vien_id: id, loai: "thu_nhap" },
          _sum: { so_tien: true },
        }),
      ]),
    ]);

    return {
      user: {
        ...sv,
        bi_khoa: sv.bi_khoa === 1,
        ky_nang: kyNang,
        chung_chi: chungChi,
        thong_ke: {
          so_ung_tuyen: stats[0],
          so_viec_hoan_thanh: stats[1],
          tong_thu_nhap: Number(stats[2]._sum.so_tien || 0),
        },
      },
      type: "sinh_vien",
    };
  } else {
    const ntd = await prisma.nha_tuyen_dung.findUnique({
      where: { id },
      select: {
        id: true,
        ten_cong_ty: true,
        email: true,
        loai: true,
        cccd: true,
        ma_so_thue: true,
        ma_so_hkd: true,
        nguoi_dai_dien: true,
        so_dien_thoai: true,
        dia_chi: true,
        website: true,
        linh_vuc: true,
        mo_ta: true,
        trang_thai_xac_thuc: true,
        so_du: true,
        so_tin_da_dang: true,
        bi_khoa: true,
        created_at: true,
      },
    });
    if (!ntd) throw { status: 404, message: "Không tìm thấy" };

    const [soTin, tongDaTra] = await Promise.all([
      prisma.viec_lam.count({ where: { nha_tuyen_dung_id: id } }),
      prisma.bao_dam_thanh_toan.aggregate({
        where: { nha_tuyen_dung_id: id, trang_thai: "da_giai_ngan" },
        _sum: { so_tien: true },
      }),
    ]);

    return {
      user: {
        ...ntd,
        bi_khoa: ntd.bi_khoa === 1,
        thong_ke: {
          so_tin_viec: soTin,
          tong_da_tra: Number(tongDaTra._sum.so_tien || 0),
        },
      },
      type: "nha_tuyen_dung",
    };
  }
}

// ============================================================
// Khóa / Mở khóa
// ============================================================
export async function toggleStatus(
  adminId: number,
  type: string,
  id: number,
  reason: string
) {
  if (type === "sinh_vien") {
    const sv = await prisma.sinh_vien.findUnique({
      where: { id },
      select: { bi_khoa: true, ho_ten: true },
    });
    if (!sv) throw { status: 404, message: "Không tìm thấy" };

    const newStatus = sv.bi_khoa === 1 ? 0 : 1;
    await prisma.sinh_vien.update({
      where: { id },
      data: { bi_khoa: newStatus },
    });

    await logAdmin(
      adminId,
      newStatus === 1 ? "lock_user" : "unlock_user",
      "sinh_vien",
      id,
      reason
    );

    return {
      message: newStatus === 1 ? "Đã khóa tài khoản SV" : "Đã mở khóa",
      bi_khoa: newStatus === 1,
    };
  } else {
    const ntd = await prisma.nha_tuyen_dung.findUnique({
      where: { id },
      select: { bi_khoa: true, ten_cong_ty: true },
    });
    if (!ntd) throw { status: 404, message: "Không tìm thấy" };

    const newStatus = ntd.bi_khoa === 1 ? 0 : 1;
    await prisma.nha_tuyen_dung.update({
      where: { id },
      data: { bi_khoa: newStatus },
    });

    await logAdmin(
      adminId,
      newStatus === 1 ? "lock_user" : "unlock_user",
      "nha_tuyen_dung",
      id,
      reason
    );

    return {
      message: newStatus === 1 ? "Đã khóa tài khoản NTD" : "Đã mở khóa",
      bi_khoa: newStatus === 1,
    };
  }
}

// ============================================================
// Stats
// ============================================================
export async function getStats() {
  const [sv, svVerified, ntd, ntdVerified] = await Promise.all([
    prisma.sinh_vien.count(),
    prisma.sinh_vien.count({ where: { trang_thai_xac_thuc: "da_xac_thuc" } }),
    prisma.nha_tuyen_dung.count(),
    prisma.nha_tuyen_dung.count({
      where: { trang_thai_xac_thuc: "da_xac_thuc" },
    }),
  ]);

  const svLocked = await prisma.sinh_vien.count({ where: { bi_khoa: 1 } });
const ntdLocked = 0; // NTD chưa có field bi_khoa

  return {
    sinh_vien: {
      tong: sv,
      da_xac_thuc: svVerified,
      chua_xac_thuc: Math.max(0, sv - svVerified),
      bi_khoa: svLocked,
    },
    nha_tuyen_dung: {
      tong: ntd,
      da_xac_thuc: ntdVerified,
      chua_xac_thuc: Math.max(0, ntd - ntdVerified),
      bi_khoa: ntdLocked,
    },
  };
}