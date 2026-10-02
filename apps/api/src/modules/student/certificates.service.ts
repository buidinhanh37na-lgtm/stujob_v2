import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma";
import { UPLOAD_ROOT } from "../../config/upload";

export interface CreateCertificateInput {
  ten_chung_chi: string;
  to_chuc?: string;
  ngay_cap?: string | null;
  file_url: string; // đường dẫn tương đối VD: "uploads/certificates/cc_1_xxx.png"
}

// ============================================================
// Lấy danh sách chứng chỉ của SV
// ============================================================
export async function listCertificates(sinhVienId: number) {
  const items = await prisma.chung_chi.findMany({
    where: { sinh_vien_id: sinhVienId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      ten_chung_chi: true,
      to_chuc: true,
      ngay_cap: true,
      file_url: true,
      created_at: true,
    },
  });
  return { items };
}

// ============================================================
// Tạo chứng chỉ mới
// ============================================================
export async function createCertificate(
  sinhVienId: number,
  input: CreateCertificateInput
) {
  const cert = await prisma.chung_chi.create({
    data: {
      sinh_vien_id: sinhVienId,
      ten_chung_chi: input.ten_chung_chi.trim(),
      to_chuc: input.to_chuc?.trim() || null,
      ngay_cap: input.ngay_cap ? new Date(input.ngay_cap) : null,
      file_url: input.file_url,
    },
    select: {
      id: true,
      ten_chung_chi: true,
      to_chuc: true,
      ngay_cap: true,
      file_url: true,
    },
  });
  return cert;
}

// ============================================================
// Xóa chứng chỉ (kèm xóa file vật lý)
// ============================================================
export async function deleteCertificate(sinhVienId: number, id: number) {
  const cert = await prisma.chung_chi.findFirst({
    where: { id, sinh_vien_id: sinhVienId },
    select: { id: true, file_url: true },
  });

  if (!cert) throw { status: 404, message: "Không tìm thấy chứng chỉ" };

  // Xóa file vật lý
  if (cert.file_url) {
    try {
      const absPath = path.join(UPLOAD_ROOT, "..", cert.file_url);
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch {
      // Ignore lỗi xóa file
    }
  }

  await prisma.chung_chi.delete({ where: { id } });

  return { message: "Đã xóa chứng chỉ" };
}