import { prisma } from "../../config/prisma";

// ============================================================
// Lấy stats dashboard NTD
// ============================================================
export async function getDashboard(ntdId: number) {
  // 1. Tin đang mở
  const openJobs = await prisma.viec_lam.count({
    where: { nha_tuyen_dung_id: ntdId, trang_thai: "dang_mo" },
  });

  // 2. Ứng tuyển chờ duyệt
  const pendingApps = await prisma.ung_tuyen.count({
    where: {
      viec_lam: { nha_tuyen_dung_id: ntdId },
      trang_thai: "cho_duyet",
    },
  });

  // 3. Bảo đảm đã ký (tổng tiền escrow đã nạp)
  const escrow = await prisma.bao_dam_thanh_toan.aggregate({
    where: {
      nha_tuyen_dung_id: ntdId,
      trang_thai: { in: ["da_nap", "cho_nghiem_thu"] },
    },
    _sum: { so_tien: true },
  });

  // 4. SV đang làm (da_chap_nhan)
  const working = await prisma.ung_tuyen.count({
    where: {
      viec_lam: { nha_tuyen_dung_id: ntdId },
      trang_thai: "da_chap_nhan",
    },
  });

  // 5. Ứng tuyển mới nhất (5 cái)
  const recentApps = await prisma.ung_tuyen.findMany({
    where: {
      viec_lam: { nha_tuyen_dung_id: ntdId },
    },
    orderBy: { created_at: "desc" },
    take: 6,
    include: {
      sinh_vien: {
        select: {
          id: true,
          ho_ten: true,
          ma_sinh_vien: true,
          truong: true,
          diem_danh_gia: true,
          so_lan_danh_gia: true,
        },
      },
      viec_lam: { select: { id: true, tieu_de: true } },
    },
  });

  // Lookup kỹ năng
  const svIds = [...new Set(recentApps.map((a) => a.sinh_vien_id))];
  const skills = svIds.length
    ? await prisma.ky_nang.findMany({
        where: { sinh_vien_id: { in: svIds } },
        select: { sinh_vien_id: true, ten_ky_nang: true },
      })
    : [];
  const skillMap: Record<number, string[]> = {};
  for (const k of skills) {
    if (!skillMap[k.sinh_vien_id]) skillMap[k.sinh_vien_id] = [];
    skillMap[k.sinh_vien_id].push(k.ten_ky_nang);
  }

  return {
    stats: {
      open_jobs: openJobs,
      pending_apps: pendingApps,
      total_escrow: Number(escrow._sum.so_tien || 0),
      working_count: working,
    },
    recent_apps: recentApps.map((a) => ({
      id: a.id,
      sinh_vien_id: a.sinh_vien_id,
      ho_ten: a.sinh_vien.ho_ten,
      ma_sinh_vien: a.sinh_vien.ma_sinh_vien,
      truong: a.sinh_vien.truong,
      diem_danh_gia: Number(a.sinh_vien.diem_danh_gia || 0),
      so_lan_danh_gia: a.sinh_vien.so_lan_danh_gia || 0,
      viec_lam_id: a.viec_lam?.id,
      tieu_de: a.viec_lam?.tieu_de,
      trang_thai: a.trang_thai,
      created_at: a.created_at,
      ky_nang: (skillMap[a.sinh_vien_id] || []).slice(0, 3),
    })),
  };
}