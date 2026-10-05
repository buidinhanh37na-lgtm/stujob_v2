import { prisma } from "../../config/prisma";

// ============================================================
// Stats tổng quan
// ============================================================
export async function getDashboardStats() {
  const [
    totalSV,
    totalNTD,
    totalJobs,
    totalApps,
    pendingVerify,
    pendingComplaints,
    pendingJobs,
    matched,
    totalValid,
  ] = await Promise.all([
    prisma.sinh_vien.count(),
    prisma.nha_tuyen_dung.count(),
    prisma.viec_lam.count(),
    prisma.ung_tuyen.count(),
    prisma.yeu_cau_xac_thuc.count({ where: { trang_thai: "cho_duyet" } }).catch(() => 0),
    prisma.khieu_nai.count({
      where: { trang_thai: { in: ["cho_xu_ly", "dang_xu_ly"] } },
    }),
    prisma.viec_lam.count({ where: { trang_thai: "dang_mo" } }),
    prisma.ung_tuyen.count({
      where: { trang_thai: { in: ["da_chap_nhan", "hoan_thanh"] } },
    }),
    prisma.ung_tuyen.count({
      where: { trang_thai: { in: ["da_chap_nhan", "hoan_thanh", "tu_choi"] } },
    }),
  ]);

  return {
    total_sv: totalSV,
    total_ntd: totalNTD,
    total_jobs: totalJobs,
    total_apps: totalApps,
    pending_verify: pendingVerify,
    pending_complaints: pendingComplaints,
    pending_jobs: pendingJobs,
    matched,
    total_valid: totalValid,
    match_rate: totalValid > 0 ? Math.round((matched / totalValid) * 100 * 10) / 10 : 0,
  };
}

// ============================================================
// Escrow stats
// ============================================================
export async function getEscrowStats() {
  const result = await prisma.bao_dam_thanh_toan.aggregate({
    where: { trang_thai: { in: ["da_nap", "cho_nghiem_thu"] } },
    _sum: { so_tien: true },
  });

  const giaiNgan = await prisma.bao_dam_thanh_toan.aggregate({
    where: { trang_thai: "da_giai_ngan" },
    _sum: { so_tien: true },
  });

  return {
    dang_giu: Number(result._sum.so_tien || 0),
    da_giai_ngan: Number(giaiNgan._sum.so_tien || 0),
  };
}

// ============================================================
// Revenue
// ============================================================
export async function getRevenueStats() {
  const phiNTD = await prisma.bao_dam_thanh_toan.aggregate({
    where: { trang_thai: "da_giai_ngan" },
    _sum: { phi_dich_vu: true },
    _count: { id: true },
  });

  const phiSV = await prisma.giao_dich.aggregate({
    where: { loai: "thu_nhap", phi_san: { gt: 0 } },
    _sum: { phi_san: true },
    _count: { id: true },
  });

  return {
    tong:
      Number(phiNTD._sum.phi_dich_vu || 0) + Number(phiSV._sum.phi_san || 0),
    tu_ntd: Number(phiNTD._sum.phi_dich_vu || 0),
    tu_sv: Number(phiSV._sum.phi_san || 0),
    so_gd_ntd: phiNTD._count.id,
    so_gd_sv: phiSV._count.id,
  };
}

// ============================================================
// Wallets
// ============================================================
export async function getWalletStats() {
  const [ntd, sv] = await Promise.all([
    prisma.vi_ntd.aggregate({ _sum: { so_du: true } }),
    prisma.vi_tien.aggregate({ _sum: { so_du: true } }),
  ]);
  return {
    ntd: Number(ntd._sum.so_du || 0),
    sv: Number(sv._sum.so_du || 0),
    tong: Number(ntd._sum.so_du || 0) + Number(sv._sum.so_du || 0),
  };
}

// ============================================================
// Chart 30 ngày
// ============================================================
export async function getChart30Days() {
  const days = 30;
  const chart: any[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const [giaiNgan, napVao, phi] = await Promise.all([
      prisma.bao_dam_thanh_toan.aggregate({
        where: {
          trang_thai: "da_giai_ngan",
          ngay_giai_ngan: { gte: dateStart, lt: dateEnd },
        },
        _sum: { so_tien: true },
      }),
      prisma.bao_dam_thanh_toan.aggregate({
        where: {
          trang_thai: "da_nap",
          created_at: { gte: dateStart, lt: dateEnd },
        },
        _sum: { so_tien: true },
      }),
      prisma.bao_dam_thanh_toan.aggregate({
        where: {
          ngay_giai_ngan: { gte: dateStart, lt: dateEnd },
          trang_thai: "da_giai_ngan",
        },
        _sum: { phi_dich_vu: true },
      }),
    ]);

    chart.push({
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      giai_ngan: Number(giaiNgan._sum.so_tien || 0),
      nap_vao: Number(napVao._sum.so_tien || 0),
      phi: Number(phi._sum.phi_dich_vu || 0),
    });
  }

  return chart;
}

// ============================================================
// Top NTD + SV
// ============================================================
export async function getTopLists() {
  // Top NTD theo doanh thu
  const ntds = await prisma.nha_tuyen_dung.findMany({
    select: { id: true, ten_cong_ty: true },
    take: 5,
  });
  const ntdList: any[] = [];
  for (const n of ntds) {
    const agg = await prisma.bao_dam_thanh_toan.aggregate({
      where: { nha_tuyen_dung_id: n.id, trang_thai: "da_giai_ngan" },
      _sum: { phi_dich_vu: true },
      _count: { id: true },
    });
    if ((agg._count.id || 0) > 0) {
      ntdList.push({
        id: n.id,
        ten_cong_ty: n.ten_cong_ty,
        so_gd: agg._count.id,
        doanh_thu: Number(agg._sum.phi_dich_vu || 0),
      });
    }
  }
  ntdList.sort((a, b) => b.doanh_thu - a.doanh_thu);

  // Top SV theo đánh giá
  const svs = await prisma.sinh_vien.findMany({
    where: { so_lan_danh_gia: { gt: 0 } },
    select: {
      id: true,
      ho_ten: true,
      ma_sinh_vien: true,
      diem_danh_gia: true,
      so_lan_danh_gia: true,
    },
    orderBy: { diem_danh_gia: "desc" },
    take: 5,
  });

  return {
    top_ntd: ntdList.slice(0, 5),
    top_sv: svs.map((s) => ({
      id: s.id,
      ho_ten: s.ho_ten,
      ma_sinh_vien: s.ma_sinh_vien,
      diem_danh_gia: Number(s.diem_danh_gia || 0),
      so_lan_danh_gia: s.so_lan_danh_gia || 0,
    })),
  };
}

// ============================================================
// Gộp tất cả
// ============================================================
export async function getDashboard() {
  const [stats, escrow, revenue, wallets, chart, tops] = await Promise.all([
    getDashboardStats(),
    getEscrowStats(),
    getRevenueStats(),
    getWalletStats(),
    getChart30Days(),
    getTopLists(),
  ]);

  return {
    overview: stats,
    match_rate: {
      matched: stats.matched,
      total: stats.total_valid,
      rate: stats.match_rate,
    },
    escrow,
    revenue,
    wallets,
    chart,
    top_ntd: tops.top_ntd,
    top_sv: tops.top_sv,
  };
}