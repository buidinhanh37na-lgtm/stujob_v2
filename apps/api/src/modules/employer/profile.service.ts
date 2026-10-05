import { prisma } from "../../config/prisma";

// ============================================================
// Lấy profile NTD
// ============================================================
export async function getProfile(ntdId: number) {
  const ntd = await prisma.nha_tuyen_dung.findUnique({
    where: { id: ntdId },
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
      vi_do: true,
      kinh_do: true,
      website: true,
      linh_vuc: true,
      mo_ta: true,
      logo: true,
      trang_thai_xac_thuc: true,
      so_du: true,
      so_tin_da_dang: true,
      created_at: true,
    },
  });

  if (!ntd) throw { status: 404, message: "Không tìm thấy NTD" };

  // Đếm số tin
  const [totalJobs, openJobs] = await Promise.all([
    prisma.viec_lam.count({ where: { nha_tuyen_dung_id: ntdId } }),
    prisma.viec_lam.count({
      where: { nha_tuyen_dung_id: ntdId, trang_thai: "dang_mo" },
    }),
  ]);

  return {
    nha_tuyen_dung: ntd,
    stats: { total_jobs: totalJobs, open_jobs: openJobs },
  };
}

// ============================================================
// Update profile
// ============================================================
export interface UpdateProfileInput {
  ten_cong_ty?: string;
  nguoi_dai_dien?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  linh_vuc?: string;
  mo_ta?: string;
  website?: string;
  vi_do?: number | null;
  kinh_do?: number | null;
}

export async function updateProfile(ntdId: number, input: UpdateProfileInput) {
  const data: Record<string, unknown> = {};

  if (input.ten_cong_ty !== undefined) data.ten_cong_ty = input.ten_cong_ty.trim();
  if (input.nguoi_dai_dien !== undefined)
    data.nguoi_dai_dien = input.nguoi_dai_dien?.trim() || null;
  if (input.so_dien_thoai !== undefined)
    data.so_dien_thoai = input.so_dien_thoai?.trim() || null;
  if (input.dia_chi !== undefined) data.dia_chi = input.dia_chi?.trim() || null;
  if (input.linh_vuc !== undefined) data.linh_vuc = input.linh_vuc?.trim() || null;
  if (input.mo_ta !== undefined) data.mo_ta = input.mo_ta?.trim() || null;
  if (input.website !== undefined) data.website = input.website?.trim() || null;
  if (input.vi_do !== undefined) data.vi_do = input.vi_do;
  if (input.kinh_do !== undefined) data.kinh_do = input.kinh_do;

  if (Object.keys(data).length === 0)
    throw { status: 400, message: "Không có gì để cập nhật" };

  await prisma.nha_tuyen_dung.update({
    where: { id: ntdId },
    data,
  });

  return { message: "Cập nhật thành công" };
}

// ============================================================
// Xác thực định danh (OCR match)
// ============================================================
export interface VerifyInput {
  cccd?: string;
  ma_so_thue?: string;
  ma_so_hkd?: string;
}

export async function verifyIdentity(ntdId: number, input: VerifyInput) {
  const ntd = await prisma.nha_tuyen_dung.findUnique({
    where: { id: ntdId },
    select: { loai: true, cccd: true, ma_so_thue: true, ma_so_hkd: true },
  });
  if (!ntd) throw { status: 404, message: "Không tìm thấy NTD" };

  let match = false;
  if (ntd.loai === "ca_nhan" && input.cccd)
    match = ntd.cccd?.trim() === input.cccd.trim();
  else if (ntd.loai === "ho_kinh_doanh" && input.ma_so_hkd)
    match = ntd.ma_so_hkd?.trim() === input.ma_so_hkd.trim();
  else if (ntd.loai === "doanh_nghiep" && input.ma_so_thue)
    match = ntd.ma_so_thue?.trim() === input.ma_so_thue.trim();

  if (!match)
    throw {
      status: 400,
      message: "Thông tin không khớp với hồ sơ đã đăng ký",
    };

  await prisma.nha_tuyen_dung.update({
    where: { id: ntdId },
    data: { trang_thai_xac_thuc: "da_xac_thuc" },
  });

  return { message: "Xác thực thành công", match: true };
}