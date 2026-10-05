import { prisma } from "../../config/prisma";

// ============================================================
// Báo cáo chi phí theo khoảng thời gian
// ============================================================
export async function getReport(ntdId: number, from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  // 1. Giao dịch đã giải ngân
  const txs = await prisma.bao_dam_thanh_toan.findMany({
    where: {
      nha_tuyen_dung_id: ntdId,
      ngay_giai_ngan: { gte: fromDate, lte: toDate },
      trang_thai: "da_giai_ngan",
    },
    orderBy: { ngay_giai_ngan: "desc" },
  });

  // 2. Lookup SV + job riêng
  const svIds = [...new Set(txs.map((t) => t.sinh_vien_id))];
  const jobIds = [...new Set(txs.map((t) => t.viec_lam_id).filter(Boolean))] as number[];

  const [svList, jobList] = await Promise.all([
    svIds.length
      ? prisma.sinh_vien.findMany({
          where: { id: { in: svIds } },
          select: { id: true, ho_ten: true, ma_sinh_vien: true },
        })
      : [],
    jobIds.length
      ? prisma.viec_lam.findMany({
          where: { id: { in: jobIds } },
          select: { id: true, tieu_de: true },
        })
      : [],
  ]);

  const svMap = new Map(svList.map((s) => [s.id, s]));
  const jobMap = new Map(jobList.map((j) => [j.id, j]));

  // 3. Tổng
  let tongTien = 0;
  let tongPhi = 0;
  for (const t of txs) {
    tongTien += Number(t.so_tien || 0);
    tongPhi += Number(t.phi_dich_vu || 0);
  }

  // 4. Escrow đang giữ
  const escrowed = await prisma.bao_dam_thanh_toan.aggregate({
    where: {
      nha_tuyen_dung_id: ntdId,
      trang_thai: { in: ["da_nap", "cho_nghiem_thu"] },
    },
    _sum: { so_tien: true, phi_dich_vu: true },
    _count: { id: true },
  });

  return {
    period: { from, to },
    tong: {
      tong: tongTien,
      phi: tongPhi,
      so_gd: txs.length,
    },
    dang_giu: {
      tong: Number(escrowed._sum.so_tien || 0),
      phi: Number(escrowed._sum.phi_dich_vu || 0),
      so_gd: escrowed._count.id,
    },
    chi_tiet: txs.map((t) => {
      const sv = svMap.get(t.sinh_vien_id);
      const job = t.viec_lam_id ? jobMap.get(t.viec_lam_id) : null;
      return {
        id: t.id,
        ma_giao_dich: t.ma_giao_dich,
        so_tien: Number(t.so_tien || 0),
        phi_dich_vu: Number(t.phi_dich_vu || 0),
        trang_thai: t.trang_thai,
        created_at: t.created_at,
        ngay_giai_ngan: t.ngay_giai_ngan,
        tieu_de: job?.tieu_de || "",
        ho_ten: sv?.ho_ten || "",
        ma_sinh_vien: sv?.ma_sinh_vien || null,
      };
    }),
  };
}

// ============================================================
// Xuất CSV
// ============================================================
export async function exportCSV(ntdId: number, from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  const txs = await prisma.bao_dam_thanh_toan.findMany({
    where: {
      nha_tuyen_dung_id: ntdId,
      created_at: { gte: fromDate, lte: toDate },
    },
    orderBy: { created_at: "desc" },
  });

  // Lookup SV + job
  const svIds = [...new Set(txs.map((t) => t.sinh_vien_id))];
  const jobIds = [...new Set(txs.map((t) => t.viec_lam_id).filter(Boolean))] as number[];

  const [svList, jobList] = await Promise.all([
    svIds.length
      ? prisma.sinh_vien.findMany({
          where: { id: { in: svIds } },
          select: { id: true, ho_ten: true, ma_sinh_vien: true },
        })
      : [],
    jobIds.length
      ? prisma.viec_lam.findMany({
          where: { id: { in: jobIds } },
          select: { id: true, tieu_de: true },
        })
      : [],
  ]);

  const svMap = new Map(svList.map((s) => [s.id, s]));
  const jobMap = new Map(jobList.map((j) => [j.id, j]));

  const rows: string[][] = [
    [
      "STT",
      "Mã GD",
      "Công việc",
      "SV",
      "MSSV",
      "Thù lao",
      "Phí DV",
      "Tổng",
      "Trạng thái",
      "Ngày tạo",
      "Ngày giải ngân",
    ],
  ];

  txs.forEach((t, i) => {
    const total = Number(t.so_tien || 0) + Number(t.phi_dich_vu || 0);
    const sv = svMap.get(t.sinh_vien_id);
    const job = t.viec_lam_id ? jobMap.get(t.viec_lam_id) : null;
    rows.push([
      String(i + 1),
      t.ma_giao_dich || "",
      job?.tieu_de || "",
      sv?.ho_ten || "",
      sv?.ma_sinh_vien || "",
      String(Math.round(Number(t.so_tien || 0))),
      String(Math.round(Number(t.phi_dich_vu || 0))),
      String(Math.round(total)),
      t.trang_thai || "",
      t.created_at ? new Date(t.created_at).toLocaleString("vi-VN") : "",
      t.ngay_giai_ngan
        ? new Date(t.ngay_giai_ngan).toLocaleString("vi-VN")
        : "",
    ]);
  });

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