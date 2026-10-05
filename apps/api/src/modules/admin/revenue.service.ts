import { prisma } from "../../config/prisma";

// ============================================================
// Báo cáo doanh thu theo khoảng ngày
// ============================================================
export async function getSummary(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  // 1. Phí từ NTD (escrow đã giải ngân)
  const phiNTD = await prisma.bao_dam_thanh_toan.aggregate({
    where: {
      trang_thai: "da_giai_ngan",
      ngay_giai_ngan: { gte: fromDate, lte: toDate },
    },
    _sum: { phi_dich_vu: true },
    _count: { id: true },
  });

  // 2. Phí từ SV (giao dịch thu nhập có phi_san > 0)
  const phiSV = await prisma.giao_dich.aggregate({
    where: {
      loai: "thu_nhap",
      phi_san: { gt: 0 },
      created_at: { gte: fromDate, lte: toDate },
    },
    _sum: { phi_san: true },
    _count: { id: true },
  });

  const totalNTD = Number(phiNTD._sum.phi_dich_vu || 0);
  const totalSV = Number(phiSV._sum.phi_san || 0);

  return {
    period: { from, to },
    total: {
      revenue: totalNTD + totalSV,
      from_ntd: totalNTD,
      from_sv: totalSV,
      count_ntd: phiNTD._count.id,
      count_sv: phiSV._count.id,
      count_total: phiNTD._count.id + phiSV._count.id,
    },
  };
}

// ============================================================
// Chart theo ngày (tối đa 90 ngày)
// ============================================================
export async function getDailyChart(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  const diffDays = Math.ceil(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const days = Math.min(diffDays, 90);

  const chart: Array<{
    date: string;
    full_date: string;
    ntd: number;
    sv: number;
    tong: number;
  }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(toDate);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const [ntd, sv] = await Promise.all([
      prisma.bao_dam_thanh_toan.aggregate({
        where: {
          trang_thai: "da_giai_ngan",
          ngay_giai_ngan: { gte: d, lt: nextDay },
        },
        _sum: { phi_dich_vu: true },
      }),
      prisma.giao_dich.aggregate({
        where: {
          loai: "thu_nhap",
          phi_san: { gt: 0 },
          created_at: { gte: d, lt: nextDay },
        },
        _sum: { phi_san: true },
      }),
    ]);

    const ntdV = Number(ntd._sum.phi_dich_vu || 0);
    const svV = Number(sv._sum.phi_san || 0);

    chart.push({
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      full_date: d.toISOString().slice(0, 10),
      ntd: ntdV,
      sv: svV,
      tong: ntdV + svV,
    });
  }

  return chart;
}

// ============================================================
// Chart theo tháng (6 tháng gần nhất)
// ============================================================
export async function getMonthlyChart() {
  const months: Array<{
    month: string;
    ntd: number;
    sv: number;
    tong: number;
  }> = [];

  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const start = new Date(d);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [ntd, sv] = await Promise.all([
      prisma.bao_dam_thanh_toan.aggregate({
        where: {
          trang_thai: "da_giai_ngan",
          ngay_giai_ngan: { gte: start, lte: end },
        },
        _sum: { phi_dich_vu: true },
      }),
      prisma.giao_dich.aggregate({
        where: {
          loai: "thu_nhap",
          phi_san: { gt: 0 },
          created_at: { gte: start, lte: end },
        },
        _sum: { phi_san: true },
      }),
    ]);

    const ntdV = Number(ntd._sum.phi_dich_vu || 0);
    const svV = Number(sv._sum.phi_san || 0);

    months.push({
      month: `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
      ntd: ntdV,
      sv: svV,
      tong: ntdV + svV,
    });
  }

  return months;
}

// ============================================================
// Top NTD đóng phí nhiều nhất
// ============================================================
export async function getTopNTD(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  const items = await prisma.bao_dam_thanh_toan.groupBy({
    by: ["nha_tuyen_dung_id"],
    where: {
      trang_thai: "da_giai_ngan",
      ngay_giai_ngan: { gte: fromDate, lte: toDate },
    },
    _sum: { phi_dich_vu: true },
    _count: { id: true },
    orderBy: { _sum: { phi_dich_vu: "desc" } },
    take: 5,
  });

  const ntdIds = items.map((i) => i.nha_tuyen_dung_id);
  const ntdList = ntdIds.length
    ? await prisma.nha_tuyen_dung.findMany({
        where: { id: { in: ntdIds } },
        select: { id: true, ten_cong_ty: true },
      })
    : [];
  const ntdMap = new Map(ntdList.map((n) => [n.id, n]));

  return items.map((i) => ({
    id: i.nha_tuyen_dung_id,
    ten_cong_ty: ntdMap.get(i.nha_tuyen_dung_id)?.ten_cong_ty || "—",
    so_gd: i._count.id,
    doanh_thu: Number(i._sum.phi_dich_vu || 0),
  }));
}

// ============================================================
// Top SV đóng phí nhiều nhất
// ============================================================
export async function getTopSV(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  const items = await prisma.giao_dich.groupBy({
    by: ["sinh_vien_id"],
    where: {
      loai: "thu_nhap",
      phi_san: { gt: 0 },
      created_at: { gte: fromDate, lte: toDate },
    },
    _sum: { phi_san: true },
    _count: { id: true },
    orderBy: { _sum: { phi_san: "desc" } },
    take: 5,
  });

  const svIds = items.map((i) => i.sinh_vien_id);
  const svList = svIds.length
    ? await prisma.sinh_vien.findMany({
        where: { id: { in: svIds } },
        select: { id: true, ho_ten: true, ma_sinh_vien: true },
      })
    : [];
  const svMap = new Map(svList.map((s) => [s.id, s]));

  return items.map((i) => ({
    id: i.sinh_vien_id,
    ho_ten: svMap.get(i.sinh_vien_id)?.ho_ten || "—",
    ma_sinh_vien: svMap.get(i.sinh_vien_id)?.ma_sinh_vien || "",
    so_gd: i._count.id,
    doanh_thu: Number(i._sum.phi_san || 0),
  }));
}

// ============================================================
// Gộp tất cả
// ============================================================
export async function getFullReport(from: string, to: string) {
  const [summary, chart, monthly, topNTD, topSV] = await Promise.all([
    getSummary(from, to),
    getDailyChart(from, to),
    getMonthlyChart(),
    getTopNTD(from, to),
    getTopSV(from, to),
  ]);

  return {
    period: summary.period,
    total: summary.total,
    chart,
    monthly,
    top_ntd: topNTD,
    top_sv: topSV,
  };
}

// ============================================================
// Export CSV
// ============================================================
export async function exportCSV(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  // Lấy từng ngày
  const ntdByDay = new Map<string, number>();
  const svByDay = new Map<string, number>();

  const ntdList = await prisma.bao_dam_thanh_toan.findMany({
    where: {
      trang_thai: "da_giai_ngan",
      ngay_giai_ngan: { gte: fromDate, lte: toDate },
    },
    select: { ngay_giai_ngan: true, phi_dich_vu: true },
  });

  for (const n of ntdList) {
    if (!n.ngay_giai_ngan) continue;
    const key = new Date(n.ngay_giai_ngan).toISOString().slice(0, 10);
    ntdByDay.set(key, (ntdByDay.get(key) || 0) + Number(n.phi_dich_vu || 0));
  }

  const svList = await prisma.giao_dich.findMany({
    where: {
      loai: "thu_nhap",
      phi_san: { gt: 0 },
      created_at: { gte: fromDate, lte: toDate },
    },
    select: { created_at: true, phi_san: true },
  });

  for (const n of ntdList) {
  if (!n.ngay_giai_ngan) continue;
  const key = new Date(n.ngay_giai_ngan).toISOString().slice(0, 10);
  ntdByDay.set(key, (ntdByDay.get(key) || 0) + Number(n.phi_dich_vu || 0));
}

  const allDates = new Set([...ntdByDay.keys(), ...svByDay.keys()]);
  const sortedDates = [...allDates].sort();

  const rows: string[][] = [
    ["BÁO CÁO DOANH THU"],
    ["Từ ngày", from, "Đến ngày", to],
    [],
    ["Ngày", "Từ NTD (đ)", "Từ SV (đ)", "Tổng (đ)"],
  ];

  let totalNTD = 0;
  let totalSV = 0;

  for (const d of sortedDates) {
    const ntd = ntdByDay.get(d) || 0;
    const sv = svByDay.get(d) || 0;
    totalNTD += ntd;
    totalSV += sv;
    rows.push([
      new Date(d).toLocaleDateString("vi-VN"),
      String(Math.round(ntd)),
      String(Math.round(sv)),
      String(Math.round(ntd + sv)),
    ]);
  }

  rows.push([
    "TỔNG",
    String(Math.round(totalNTD)),
    String(Math.round(totalSV)),
    String(Math.round(totalNTD + totalSV)),
  ]);

  const csv = rows
    .map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from(csv, "utf-8"),
  ]);
}