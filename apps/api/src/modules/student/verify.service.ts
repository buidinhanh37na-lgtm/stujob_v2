import { prisma } from "../../config/prisma";
import { scanStudentCard } from "../../services/ocr";

/**
 * OCR thẻ SV → so khớp DB trường → tạo yêu cầu xác thực
 */
export async function verifyStudentCard(
  sinhVienId: number,
  imagePath: string
) {
  const { raw, parsed } = await scanStudentCard(imagePath);

  // Lấy thông tin SV hiện tại
  const sv = await prisma.sinh_vien.findUnique({
    where: { id: sinhVienId },
    select: { ma_sinh_vien: true, ho_ten: true },
  });
  if (!sv) throw { status: 404, message: "Không tìm thấy SV" };

  // So khớp MSSV với ảnh
  const mssvMatch =
    parsed.ma_sinh_vien &&
    parsed.ma_sinh_vien.trim().toUpperCase() ===
      sv.ma_sinh_vien.trim().toUpperCase();

  // Lookup DB trường
  const nhaTruong = await prisma.sv_truong.findUnique({
    where: { ma_sinh_vien: sv.ma_sinh_vien },
    select: {
      ho_ten: true,
      chuyen_nganh: true,
      nam_hoc: true,
      trang_thai: true,
    },
  });

  // Check đã có yêu cầu pending chưa
  const existing = await prisma.yeu_cau_xac_thuc.findFirst({
    where: { sinh_vien_id: sinhVienId, trang_thai: "cho_duyet" },
    select: { id: true },
  });

  // Nếu chưa có → tạo mới
  let requestId = existing?.id || null;
  if (!existing) {
    const created = await prisma.yeu_cau_xac_thuc.create({
      data: {
        sinh_vien_id: sinhVienId,
        trang_thai: "cho_duyet",
        ghi_chu: "Gửi qua OCR thẻ SV",
      },
    });
    requestId = created.id;
  }

  return {
    success: true,
    request_id: requestId,
    ocr: {
      raw_text: raw,
      parsed: {
        ma_sinh_vien: parsed.ma_sinh_vien,
        ho_ten: parsed.ho_ten,
        truong: parsed.truong,
        khoa: parsed.khoa,
        ngay_sinh: parsed.ngay_sinh,
        lop: parsed.lop,
      },
    },
    match: {
      mssv_matches_profile: mssvMatch,
      profile_mssv: sv.ma_sinh_vien,
      ocr_mssv: parsed.ma_sinh_vien,
    },
    nha_truong: nhaTruong,
    message: mssvMatch
      ? "Đã gửi yêu cầu xác thực"
      : "Cảnh báo: MSSV trên thẻ không khớp với hồ sơ",
  };
}