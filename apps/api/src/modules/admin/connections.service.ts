import { prisma } from "../../config/prisma";

// ============================================================
// List kết nối thành công
// ============================================================
export async function listConnections(
  status: string,
  q: string,
  page: number = 1,
  limit: number = 30
) {
  const where: any = {
    trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] },
  };
  if (status !== "all") where.trang_thai = status;

  const offset = (page - 1) * limit;

  // Lấy ung_tuyen
  const items = await prisma.ung_tuyen.findMany({
    where,
    orderBy: { created_at: "desc" },
    skip: offset,
    take: limit,
  });

  // Lookup SV
  const svIds = [...new Set(items.map((i) => i.sinh_vien_id))];
  const svList = svIds.length
    ? await prisma.sinh_vien.findMany({
        where: { id: { in: svIds } },
        select: {
          id: true,
          ho_ten: true,
          ma_sinh_vien: true,
          truong: true,
          diem_danh_gia: true,
          so_lan_danh_gia: true,
        },
      })
    : [];
  const svMap = new Map(svList.map((s) => [s.id, s]));

  // Lookup jobs
  const jobIds = [...new Set(items.map((i) => i.viec_lam_id))];
  const jobList = jobIds.length
    ? await prisma.viec_lam.findMany({
        where: { id: { in: jobIds } },
        select: {
          id: true,
          tieu_de: true,
          luong_min: true,
          luong_max: true,
          loai_cong_viec: true,
          nha_tuyen_dung_id: true,
        },
      })
    : [];
  const jobMap = new Map(jobList.map((j) => [j.id, j]));

  // Lookup NTD
  const ntdIds = [...new Set(jobList.map((j) => j.nha_tuyen_dung_id))];
  const ntdList = ntdIds.length
    ? await prisma.nha_tuyen_dung.findMany({
        where: { id: { in: ntdIds } },
        select: { id: true, ten_cong_ty: true, loai: true },
      })
    : [];
  const ntdMap = new Map(ntdList.map((n) => [n.id, n]));

  // Lookup escrow
  const escrowList = jobIds.length
    ? await prisma.bao_dam_thanh_toan.findMany({
        where: { viec_lam_id: { in: jobIds } },
        orderBy: { created_at: "desc" },
      })
    : [];

  // Đã sửa: Đổi Map<number, any> thành Map<string, any> vì key là string
  const escrowMap = new Map<string, any>();
  for (const e of escrowList) {
    const key = `${e.viec_lam_id}_${e.sinh_vien_id}`;
    if (!escrowMap.has(key)) escrowMap.set(key, e);
  }

  // Lookup đánh giá
  const dgList = await prisma.danh_gia.findMany({
    where: {
      sinh_vien_id: { in: svIds },
    },
    orderBy: { created_at: "desc" },
  });
  const dgMap = new Map<string, any>();
  for (const dg of dgList) {
    const key = `${dg.sinh_vien_id}_${dg.viec_lam_id}`;
    if (!dgMap.has(key)) dgMap.set(key, dg);
  }

  let mapped = items.map((it) => {
    const sv = svMap.get(it.sinh_vien_id);
    const job = jobMap.get(it.viec_lam_id);
    const ntd = job ? ntdMap.get(job.nha_tuyen_dung_id) : null;
    const escrow = escrowMap.get(`${it.viec_lam_id}_${it.sinh_vien_id}`);
    const dg = dgMap.get(`${it.sinh_vien_id}_${it.viec_lam_id}`);

    return {
      id: it.id,
      trang_thai: it.trang_thai,
      created_at: it.created_at,
      // SV
      sinh_vien_id: it.sinh_vien_id,
      sv_ten: sv?.ho_ten || "",
      ma_sinh_vien: sv?.ma_sinh_vien || "",
      truong: sv?.truong || "",
      diem_danh_gia: Number(sv?.diem_danh_gia || 0),
      so_lan_danh_gia: sv?.so_lan_danh_gia || 0,
      // Job
      viec_lam_id: it.viec_lam_id,
      tieu_de: job?.tieu_de || "",
      luong_min: Number(job?.luong_min || 0),
      luong_max: Number(job?.luong_max || 0),
      loai_cong_viec: job?.loai_cong_viec || "remote",
      // NTD
      ntd_id: ntd?.id || 0,
      ten_cong_ty: ntd?.ten_cong_ty || "",
      ntd_loai: ntd?.loai || "",
      // Escrow
      escrow_tien: escrow ? Number(escrow.so_tien) : null,
      escrow_trang_thai: escrow?.trang_thai || null,
      ngay_giai_ngan: escrow?.ngay_giai_ngan || null,
      // Đánh giá
      danh_gia_diem: dg?.diem || null,
      danh_gia_nhan_xet: dg?.nhan_xet || null,
    };
  });

  // Filter theo search
  if (q) {
    const lower = q.toLowerCase();
    mapped = mapped.filter(
      (m) =>
        m.sv_ten.toLowerCase().includes(lower) ||
        m.ma_sinh_vien.toLowerCase().includes(lower) ||
        m.ten_cong_ty.toLowerCase().includes(lower) ||
        m.tieu_de.toLowerCase().includes(lower)
    );
  }

  // Count
  const total = await prisma.ung_tuyen.count({ where });

  return {
    items: mapped,
    total,
    page,
    total_pages: Math.ceil(total / limit),
  };
}

// ============================================================
// Stats
// ============================================================
export async function getStats() {
  const [dangLam, hoanThanh, tong] = await Promise.all([
    prisma.ung_tuyen.count({ where: { trang_thai: "da_chap_nhan" } }),
    prisma.ung_tuyen.count({ where: { trang_thai: "hoan_thanh" } }),
    prisma.ung_tuyen.count({
      where: { trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] } },
    }),
  ]);

  // Tổng tiền đã giải ngân
  const money = await prisma.bao_dam_thanh_toan.aggregate({
    where: { trang_thai: "da_giai_ngan" },
    _sum: { so_tien: true },
  });

  // Số NTD + SV có kết nối
  const distinctSV = await prisma.ung_tuyen.groupBy({
    by: ["sinh_vien_id"],
    where: { trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] } },
  });

  const ntdIds = await prisma.viec_lam.findMany({
    where: {
      ung_tuyen: {
        some: { trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] } },
      },
    },
    select: { nha_tuyen_dung_id: true },
    distinct: ["nha_tuyen_dung_id"],
  });

  return {
    stats: {
      dang_lam: dangLam,
      hoan_thanh: hoanThanh,
      tong,
    },
    money: Number(money._sum.so_tien || 0),
    sv_count: distinctSV.length,
    ntd_count: ntdIds.length,
  };
}

// ============================================================
// Chi tiết 1 kết nối
// ============================================================
export async function getConnectionDetail(id: number) {
  const ut = await prisma.ung_tuyen.findUnique({ where: { id } });
  if (!ut) throw { status: 404, message: "Không tìm thấy" };

  const [sv, job] = await Promise.all([
    prisma.sinh_vien.findUnique({
      where: { id: ut.sinh_vien_id },
      select: {
        id: true,
        ho_ten: true,
        ma_sinh_vien: true,
        truong: true,
        chuyen_nganh: true,
        gpa: true,
        email: true,
        so_dien_thoai: true,
      },
    }),
    ut.viec_lam_id
      ? prisma.viec_lam.findUnique({
          where: { id: ut.viec_lam_id },
          select: {
            id: true,
            tieu_de: true,
            mo_ta: true,
            luong_min: true,
            luong_max: true,
            loai_cong_viec: true,
            nha_tuyen_dung_id: true,
          },
        })
      : null,
  ]);

  const ntd = job
    ? await prisma.nha_tuyen_dung.findUnique({
        where: { id: job.nha_tuyen_dung_id },
        select: { id: true, ten_cong_ty: true, loai: true, email: true },
      })
    : null;

  let escrow: any = null;
  if (ut.viec_lam_id) {
    escrow = await prisma.bao_dam_thanh_toan.findFirst({
      where: {
        viec_lam_id: ut.viec_lam_id,
        sinh_vien_id: ut.sinh_vien_id,
      },
      orderBy: { created_at: "desc" },
    });
  }

  return {
    item: {
      id: ut.id,
      trang_thai: ut.trang_thai,
      created_at: ut.created_at,
      // SV
      sv_ten: sv?.ho_ten || "",
      ma_sinh_vien: sv?.ma_sinh_vien || "",
      truong: sv?.truong || "",
      chuyen_nganh: sv?.chuyen_nganh || "",
      gpa: sv?.gpa ? Number(sv.gpa) : null,
      sv_email: sv?.email || "",
      sv_sdt: sv?.so_dien_thoai || "",
      // Job
      tieu_de: job?.tieu_de || "",
      mo_ta: job?.mo_ta || "",
      luong_min: Number(job?.luong_min || 0),
      luong_max: Number(job?.luong_max || 0),
      loai_cong_viec: job?.loai_cong_viec || "remote",
      // NTD
      ten_cong_ty: ntd?.ten_cong_ty || "",
      ntd_email: ntd?.email || "",
      // Escrow
      so_tien: escrow ? Number(escrow.so_tien) : 0,
      escrow_trang_thai: escrow?.trang_thai || null,
      ngay_giai_ngan: escrow?.ngay_giai_ngan || null,
    },
  };
}