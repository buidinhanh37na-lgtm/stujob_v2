import { prisma } from "../../config/prisma";

export interface UpdateProfileInput {
  ho_ten?: string;
  so_dien_thoai?: string;
  truong?: string;
  khoa?: string;
  chuyen_nganh?: string;
  nam_hoc?: number | null;
  gpa?: number | null;
  mo_ta?: string;
  ky_nang?: Array<{ ten_ky_nang: string; muc_do: string }>;
}

// ============================================================
// Lấy profile + kỹ năng
// ============================================================
export async function getProfile(sinhVienId: number) {
  const sv = await prisma.sinh_vien.findUnique({
    where: { id: sinhVienId },
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
      anh_dai_dien: true,
      trang_thai_xac_thuc: true,
    },
  });

  if (!sv) throw { status: 404, message: "Không tìm thấy sinh viên" };

  const kyNang = await prisma.ky_nang.findMany({
    where: { sinh_vien_id: sinhVienId },
    orderBy: { id: "desc" },
    select: { id: true, ten_ky_nang: true, muc_do: true },
  });

  return { sinh_vien: sv, ky_nang: kyNang };
}

// ============================================================
// Cập nhật profile + thay thế kỹ năng
// ============================================================
export async function updateProfile(
  sinhVienId: number,
  input: UpdateProfileInput
) {
  // Các field cho phép update (email, ma_sinh_vien KHÔNG cho sửa)
  const updateData: Record<string, unknown> = {};

  if (input.ho_ten !== undefined) updateData.ho_ten = input.ho_ten.trim();
  if (input.so_dien_thoai !== undefined)
    updateData.so_dien_thoai = input.so_dien_thoai?.trim() || null;
  if (input.truong !== undefined)
    updateData.truong = input.truong?.trim() || null;
  if (input.khoa !== undefined) updateData.khoa = input.khoa?.trim() || null;
  if (input.chuyen_nganh !== undefined)
    updateData.chuyen_nganh = input.chuyen_nganh?.trim() || null;
  if (input.nam_hoc !== undefined) updateData.nam_hoc = input.nam_hoc;
  if (input.gpa !== undefined) updateData.gpa = input.gpa;
  if (input.mo_ta !== undefined) updateData.mo_ta = input.mo_ta?.trim() || null;

  // Transaction: update sv + replace ky_nang
  await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.sinh_vien.update({
        where: { id: sinhVienId },
        data: updateData,
      });
    }

    // Chỉ replace kỹ năng nếu client có gửi lên
    if (input.ky_nang !== undefined) {
      await tx.ky_nang.deleteMany({ where: { sinh_vien_id: sinhVienId } });

      const validSkills = input.ky_nang
        .filter((k) => k.ten_ky_nang && k.ten_ky_nang.trim())
        .map((k) => ({
          sinh_vien_id: sinhVienId,
          ten_ky_nang: k.ten_ky_nang.trim(),
          muc_do: k.muc_do || "trung_binh",
        }));

      if (validSkills.length > 0) {
        await tx.ky_nang.createMany({ data: validSkills });
      }
    }
  });

  return { message: "Cập nhật thành công" };
}