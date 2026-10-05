import { prisma } from "../../config/prisma";
import { formatTime } from "./_helpers";

// ============================================================
// Lấy danh sách tin việc của NTD
// ============================================================
export async function listJobs(ntdId: number, status: string) {
  const where: any = { nha_tuyen_dung_id: ntdId };
  if (status === "dang_mo") where.trang_thai = "dang_mo";
  else if (status === "da_dong") where.trang_thai = "da_dong";

  const jobs = await prisma.viec_lam.findMany({
    where,
    orderBy: { created_at: "desc" },
  });

  // Đếm số ứng tuyển cho từng tin
  const jobIds = jobs.map((j) => j.id);
  const appCounts = jobIds.length
    ? await prisma.ung_tuyen.groupBy({
        by: ["viec_lam_id"],
        where: { viec_lam_id: { in: jobIds } },
        _count: { id: true },
      })
    : [];

  const countMap = new Map<number, number>();
  for (const a of appCounts) {
    countMap.set(a.viec_lam_id, a._count.id);
  }

  // Lookup nhóm việc
  const nhomIds = [...new Set(jobs.map((j) => j.nhom_viec_id).filter(Boolean))] as number[];
  const nhomList = nhomIds.length
    ? await prisma.nhom_viec.findMany({
        where: { id: { in: nhomIds } },
        select: { id: true, ten_nhom: true, icon: true },
      })
    : [];
  const nhomMap = new Map(nhomList.map((n) => [n.id, n]));

  return {
    items: jobs.map((j) => {
      const nhom = j.nhom_viec_id ? nhomMap.get(j.nhom_viec_id) : null;
      return {
        id: j.id,
        tieu_de: j.tieu_de,
        mo_ta: j.mo_ta,
        ky_nang_can: j.ky_nang_can,
        luong_min: Number(j.luong_min || 0),
        luong_max: Number(j.luong_max || 0),
        loai_cong_viec: j.loai_cong_viec || "remote",
        so_luong_can: j.so_luong_can || 1,
        so_buoi: j.so_buoi || 1,
        gio_uoc_tinh: j.gio_uoc_tinh || 0,
        gio_bat_dau: formatTime(j.gio_bat_dau),
        gio_ket_thuc: formatTime(j.gio_ket_thuc),
        han_chot: j.han_chot,
        ngay_bat_dau: j.ngay_bat_dau,
        ngay_ket_thuc: j.ngay_ket_thuc,
        han_nop_file: j.han_nop_file,
        dia_chi_lam_viec: j.dia_chi_lam_viec,
        phi_dich_vu: Number(j.phi_dich_vu || 0),
        trang_thai: j.trang_thai,
        created_at: j.created_at,
        so_ung_tuyen: countMap.get(j.id) || 0,
        ten_nhom: nhom?.ten_nhom || null,
        icon: nhom?.icon || null,
      };
    }),
  };
}

// ============================================================
// Toggle trạng thái đóng/mở
// ============================================================
export async function toggleStatus(ntdId: number, jobId: number, status: string) {
  if (!["dang_mo", "da_dong"].includes(status))
    throw { status: 400, message: "Trạng thái không hợp lệ" };

  const job = await prisma.viec_lam.findFirst({
    where: { id: jobId, nha_tuyen_dung_id: ntdId },
    select: { id: true },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy" };

  await prisma.viec_lam.update({
  where: { id: jobId },
  data: { trang_thai: status as any },
});

  return {
    message: status === "da_dong" ? "Đã đóng tin" : "Đã mở lại tin",
  };
}

// ============================================================
// Xóa tin (chỉ khi chưa có ứng tuyển)
// ============================================================
export async function deleteJob(ntdId: number, jobId: number) {
  const job = await prisma.viec_lam.findFirst({
    where: { id: jobId, nha_tuyen_dung_id: ntdId },
    select: { id: true },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy" };

  // Check ứng tuyển
  const count = await prisma.ung_tuyen.count({
    where: { viec_lam_id: jobId },
  });
  if (count > 0)
    throw {
      status: 400,
      message: `Không thể xóa: đã có ${count} ứng tuyển. Hãy đóng tin thay vì xóa.`,
    };

  await prisma.viec_lam.delete({ where: { id: jobId } });

  return { message: "Đã xóa tin việc" };
}