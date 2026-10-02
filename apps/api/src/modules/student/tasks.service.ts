import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma";
import { UPLOAD_ROOT } from "../../config/upload";

// ============================================================
// Lấy danh sách nhiệm vụ
// ============================================================
export async function listTasks(sinhVienId: number) {
  const items = await prisma.nhiem_vu.findMany({
    where: { sinh_vien_id: sinhVienId },
    orderBy: { created_at: "desc" },
  });

  // Lookup tên việc làm (nếu có)
  const jobIds = [
    ...new Set(items.map((it) => it.viec_lam_id).filter(Boolean)),
  ] as number[];

  const jobs = jobIds.length
    ? await prisma.viec_lam.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, tieu_de: true },
      })
    : [];

  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  return {
    items: items.map((it) => ({
      id: it.id,
      viec_lam_id: it.viec_lam_id,
      ten_nhiem_vu: it.ten_nhiem_vu,
      mo_ta: it.mo_ta,
      han_nop: it.han_nop,
      trang_thai: it.trang_thai,
      file_san_pham: it.file_san_pham,
      file_xem_truoc: it.file_xem_truoc,
      created_at: it.created_at,
      ten_viec: it.viec_lam_id ? jobMap.get(it.viec_lam_id)?.tieu_de || null : null,
    })),
  };
}

// ============================================================
// Nộp bài (cập nhật file_san_pham)
// ============================================================
export async function submitTask(
  sinhVienId: number,
  taskId: number,
  fileUrl: string,
  previewUrl: string | null
) {
  const task = await prisma.nhiem_vu.findFirst({
    where: { id: taskId, sinh_vien_id: sinhVienId },
    select: { id: true, trang_thai: true, file_san_pham: true },
  });
  if (!task) throw { status: 404, message: "Không tìm thấy nhiệm vụ" };
  if (task.trang_thai === "hoan_thanh")
    throw { status: 400, message: "Nhiệm vụ đã hoàn thành, không thể nộp lại" };

  // Xóa file cũ nếu có
  if (task.file_san_pham) {
    try {
      const absOld = path.join(UPLOAD_ROOT, "..", task.file_san_pham);
      if (fs.existsSync(absOld)) fs.unlinkSync(absOld);
    } catch {}
  }

  await prisma.nhiem_vu.update({
    where: { id: taskId },
    data: {
      file_san_pham: fileUrl,
      file_xem_truoc: previewUrl,
      trang_thai: "cho_duyet",
    },
  });

  return { message: "Đã nộp bài thành công" };
}

// ============================================================
// Xóa nhiệm vụ (chỉ nhiệm vụ do SV tự tạo)
// ============================================================
export async function deleteTask(sinhVienId: number, id: number) {
  const task = await prisma.nhiem_vu.findFirst({
    where: { id, sinh_vien_id: sinhVienId },
    select: { id: true, viec_lam_id: true, file_san_pham: true },
  });
  if (!task) throw { status: 404, message: "Không tìm thấy" };

  if (task.viec_lam_id) {
    throw { status: 400, message: "Không thể xóa nhiệm vụ từ công việc" };
  }

  if (task.file_san_pham) {
    try {
      const absOld = path.join(UPLOAD_ROOT, "..", task.file_san_pham);
      if (fs.existsSync(absOld)) fs.unlinkSync(absOld);
    } catch {}
  }

  await prisma.nhiem_vu.delete({ where: { id } });
  return { message: "Đã xóa nhiệm vụ" };
}

// ============================================================
// Tạo nhiệm vụ cá nhân (SV tự thêm)
// ============================================================
export async function createTask(
  sinhVienId: number,
  input: { ten_nhiem_vu: string; mo_ta?: string; han_nop?: string | null }
) {
  const created = await prisma.nhiem_vu.create({
    data: {
      sinh_vien_id: sinhVienId,
      viec_lam_id: null,
      ten_nhiem_vu: input.ten_nhiem_vu.trim(),
      mo_ta: input.mo_ta?.trim() || null,
      han_nop: input.han_nop ? new Date(input.han_nop) : null,
      trang_thai: "dang_lam",
    },
  });
  return created;
}