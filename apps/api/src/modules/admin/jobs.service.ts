import { prisma } from "../../config/prisma";

// ============================================================
// List tin việc (có filter status + search)
// ============================================================
export async function listJobs(params: {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const { status = "all", q, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const where: any = {};
  if (status === "dang_mo" || status === "da_dong") {
    where.trang_thai = status;
  }
  if (q) {
    where.OR = [
      { tieu_de: { contains: q } },
      { nha_tuyen_dung: { ten_cong_ty: { contains: q } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.viec_lam.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
      include: {
        nha_tuyen_dung: {
          select: { id: true, ten_cong_ty: true, logo: true },
        },
      },
    }),
    prisma.viec_lam.count({ where }),
  ]);

  // Đếm số ứng tuyển theo từng job
  const jobIds = items.map((j) => j.id);
  const appCounts = jobIds.length
    ? await prisma.ung_tuyen.groupBy({
        by: ["viec_lam_id"],
        where: { viec_lam_id: { in: jobIds } },
        _count: { id: true },
      })
    : [];
  const countMap = new Map(appCounts.map((a) => [a.viec_lam_id, a._count.id]));

  // Kiểm duyệt gần nhất
  const kdList = jobIds.length
    ? await prisma.kiem_duyet_tin.findMany({
        where: { viec_lam_id: { in: jobIds } },
        orderBy: { created_at: "desc" },
      })
    : [];
  const kdMap = new Map<number, any>();
  for (const kd of kdList) {
    if (!kdMap.has(kd.viec_lam_id)) kdMap.set(kd.viec_lam_id, kd);
  }

  return {
    items: items.map((j) => {
      const kd = kdMap.get(j.id);
      return {
        id: j.id,
        tieu_de: j.tieu_de,
        mo_ta: j.mo_ta,
        ky_nang_can: j.ky_nang_can,
        luong_min: Number(j.luong_min || 0),
        luong_max: Number(j.luong_max || 0),
        don_vi_luong: j.don_vi_luong || "VNĐ",
        loai_cong_viec: j.loai_cong_viec || "remote",
        trang_thai: j.trang_thai,
        created_at: j.created_at,
        ntd_id: j.nha_tuyen_dung_id,
        ten_cong_ty: j.nha_tuyen_dung?.ten_cong_ty || "",
        logo: j.nha_tuyen_dung?.logo || null,
        so_ung_tuyen: countMap.get(j.id) || 0,
        kd_hanh_dong: kd?.hanh_dong || null,
        diem_rui_ro: kd?.diem_rui_ro ?? null,
      };
    }),
    total,
    page,
    total_pages: Math.ceil(total / limit),
  };
}

// ============================================================
// Force-close tin (đóng tin)
// ============================================================
export async function forceCloseJob(
  adminId: number,
  jobId: number,
  reason: string
) {
  if (!jobId) throw { status: 400, message: "Thiếu ID" };

  const job = await prisma.viec_lam.findUnique({
    where: { id: jobId },
    select: { id: true, tieu_de: true, nha_tuyen_dung_id: true },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy" };

  await prisma.$transaction(async (tx) => {
    await tx.viec_lam.update({
      where: { id: jobId },
      data: { trang_thai: "da_dong" },
    });

    try {
      await tx.thong_bao_ntd.create({
        data: {
          nha_tuyen_dung_id: job.nha_tuyen_dung_id,
          tieu_de: "Tin việc bị đóng bởi Admin",
          noi_dung: `Tin "${job.tieu_de}" đã bị đóng. Lý do: ${reason}`,
          loai: "warning",
        },
      });
    } catch {}
  });

  await prisma.nhat_ky_admin.create({
    data: {
      admin_id: adminId,
      hanh_dong: "force_close_job",
      doi_tuong_loai: "viec_lam",
      doi_tuong_id: jobId,
      chi_tiet: reason,
    },
  });

  return { message: "Đã đóng tin" };
}

// ============================================================
// Xóa tin
// ============================================================
export async function deleteJob(adminId: number, jobId: number) {
  if (!jobId) throw { status: 400, message: "Thiếu ID" };

  const job = await prisma.viec_lam.findUnique({
    where: { id: jobId },
    select: { id: true, tieu_de: true },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy" };

  // Check ứng tuyển để cảnh báo
  const appCount = await prisma.ung_tuyen.count({
    where: { viec_lam_id: jobId },
  });

  await prisma.$transaction(async (tx) => {
    // Xóa các bảng con (nếu FK chưa CASCADE)
    await tx.kiem_duyet_tin.deleteMany({ where: { viec_lam_id: jobId } });
    await tx.ung_tuyen.deleteMany({ where: { viec_lam_id: jobId } });
    await tx.nhiem_vu.updateMany({
      where: { viec_lam_id: jobId },
      data: { viec_lam_id: null },
    });
    await tx.viec_lam.delete({ where: { id: jobId } });
  });

  await prisma.nhat_ky_admin.create({
    data: {
      admin_id: adminId,
      hanh_dong: "delete_job",
      doi_tuong_loai: "viec_lam",
      doi_tuong_id: jobId,
      chi_tiet: `${job.tieu_de} (${appCount} ứng tuyển đã bị xóa theo)`,
    },
  });

  return { message: `Đã xóa tin và ${appCount} ứng tuyển liên quan` };
}

// ============================================================
// Stats nhanh
// ============================================================
export async function getStats() {
  const [tong, dangMo, daDong, tongApps] = await Promise.all([
    prisma.viec_lam.count(),
    prisma.viec_lam.count({ where: { trang_thai: "dang_mo" } }),
    prisma.viec_lam.count({ where: { trang_thai: "da_dong" } }),
    prisma.ung_tuyen.count(),
  ]);

  return {
    tong,
    dang_mo: dangMo,
    da_dong: daDong,
    tong_ung_tuyen: tongApps,
  };
}