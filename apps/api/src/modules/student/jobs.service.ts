import { prisma } from "../../config/prisma";

type AnyJob = any;

// Map chuyên ngành → nhóm việc phù hợp
function getChuyenNganhKeywords(chuyenNganh: string | null): string[] {
  if (!chuyenNganh) return [];
  const cn = chuyenNganh.toLowerCase();

  const map: Array<{ key: string; keywords: string[] }> = [
    {
      key: "công nghệ thông tin",
      keywords: ["IT", "Lập trình", "Công nghệ", "Web", "Frontend", "Backend"],
    },
    {
      key: "kỹ thuật phần mềm",
      keywords: ["IT", "Lập trình", "Web", "Frontend", "Backend"],
    },
    { key: "khoa học máy tính", keywords: ["IT", "Lập trình", "Công nghệ"] },
    { key: "marketing", keywords: ["Marketing", "Content", "Bán hàng", "Sale"] },
    { key: "truyền thông", keywords: ["Marketing", "Content"] },
    { key: "tiếng anh", keywords: ["Giáo dục", "Ngoại ngữ", "Gia sư"] },
    { key: "sư phạm", keywords: ["Giáo dục", "Gia sư"] },
    { key: "đồ họa", keywords: ["Thiết kế", "Đồ họa", "Designer"] },
    { key: "thiết kế", keywords: ["Thiết kế", "Đồ họa", "Designer"] },
    { key: "kinh tế", keywords: ["Kinh doanh", "Bán hàng", "Marketing"] },
    { key: "du lịch", keywords: ["F&B", "Nhà hàng", "Phục vụ"] },
    { key: "vận tải", keywords: ["Giao hàng", "Vận chuyển"] },
    { key: "logistics", keywords: ["Giao hàng", "Vận chuyển"] },
  ];

  for (const m of map) {
    if (cn.includes(m.key)) return m.keywords;
  }
  return [];
}

// Tính điểm phù hợp (trả null nếu trùng >50% buổi)
function tinhDiemPhuHop(
  job: AnyJob,
  lichHoc: Array<{ thu: number; gio_bat_dau: Date; gio_ket_thuc: Date }>,
  kyNangSV: Array<{ ten_ky_nang: string; muc_do: string | null }>,
  chuyenNganhSV: string | null
): {
  tong: number;
  chi_tiet: { thoi_gian: number; ky_nang: number; chuyen_nganh: number };
} | null {
  let diemThoiGian = 0;
  let diemKyNang = 0;
  let diemChuyenNganh = 0;

  // ============ 1. THỜI GIAN (40 điểm) ============
  const days = (job.thu_lam_viec || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (days.length === 0) {
    diemThoiGian = 20;
  } else {
    const jobStart = formatTime(job.gio_bat_dau);
    const jobEnd = formatTime(job.gio_ket_thuc);

    let soBuoiKhop = 0;
    for (const d of days) {
      const thu = parseInt(d, 10);
      let coTrungLich = false;

      for (const lh of lichHoc) {
        if (lh.thu === thu) {
          const lhStart = formatTime(lh.gio_bat_dau);
          const lhEnd = formatTime(lh.gio_ket_thuc);
          if (jobStart && jobEnd && lhStart < jobEnd && lhEnd > jobStart) {
            coTrungLich = true;
            break;
          }
        }
      }
      if (!coTrungLich) soBuoiKhop++;
    }

    if (soBuoiKhop / days.length < 0.5) return null;

    diemThoiGian = (soBuoiKhop / days.length) * 40;
  }

  // ============ 2. KỸ NĂNG (35 điểm) ============
  const kyNangCan = (job.ky_nang_can || "")
    .split(",")
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);
  const kyNangSVNames = kyNangSV.map((k) => k.ten_ky_nang.toLowerCase());

  if (kyNangCan.length === 0) {
    diemKyNang = 15;
  } else {
    let soKhop = 0;
    for (const kc of kyNangCan) {
      for (const sv of kyNangSVNames) {
        if (sv.includes(kc) || kc.includes(sv)) {
          soKhop++;
          break;
        }
      }
    }
    diemKyNang = (soKhop / kyNangCan.length) * 35;
  }

  // ============ 3. CHUYÊN NGÀNH (25 điểm) ============
  const keywords = getChuyenNganhKeywords(chuyenNganhSV);
  const nhomViecTen = job.ten_nhom || "";

  if (keywords.length > 0 && nhomViecTen) {
    const match = keywords.some((kw) =>
      nhomViecTen.toLowerCase().includes(kw.toLowerCase())
    );
    diemChuyenNganh = match ? 25 : 5;
  } else {
    diemChuyenNganh = 10;
  }

  return {
    tong: Math.round(diemThoiGian + diemKyNang + diemChuyenNganh),
    chi_tiet: {
      thoi_gian: Math.round(diemThoiGian),
      ky_nang: Math.round(diemKyNang),
      chuyen_nganh: Math.round(diemChuyenNganh),
    },
  };
}

// ============================================================
// LẤY VIỆC LÀM
// ============================================================
export async function getJobsForStudent(sinhVienId: number) {
  const sv = await prisma.sinh_vien.findUnique({
    where: { id: sinhVienId },
    select: { chuyen_nganh: true },
  });

  const [kyNangSV, lichHoc] = await Promise.all([
    prisma.ky_nang.findMany({
      where: { sinh_vien_id: sinhVienId },
      select: { ten_ky_nang: true, muc_do: true },
    }),
    prisma.lich_hoc.findMany({
      where: { sinh_vien_id: sinhVienId },
      select: { thu: true, gio_bat_dau: true, gio_ket_thuc: true },
    }),
  ]);

  // Load jobs (KHÔNG include nhom_viec — sẽ lookup riêng)
  const jobs = await prisma.viec_lam.findMany({
    where: { trang_thai: "dang_mo" },
    include: {
      nha_tuyen_dung: {
        select: { ten_cong_ty: true, logo: true, linh_vuc: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Lookup nhóm việc riêng
  const nhomViecIds = [
    ...new Set(jobs.map((j) => j.nhom_viec_id).filter(Boolean)),
  ] as number[];

  const nhomViecList = nhomViecIds.length
    ? await prisma.nhom_viec.findMany({
        where: { id: { in: nhomViecIds } },
        select: { id: true, ten_nhom: true, icon: true },
      })
    : [];

  const nhomViecMap = new Map(nhomViecList.map((n) => [n.id, n]));

  const phuHop: any[] = [];
  const tatCa: any[] = [];

  for (const j of jobs) {
    const jobAny = j as any;
    const nhomViec = j.nhom_viec_id ? nhomViecMap.get(j.nhom_viec_id) : null;

    const jobForCalc: AnyJob = {
      ...j,
      ten_cong_ty: jobAny.nha_tuyen_dung?.ten_cong_ty || "",
      ten_nhom: nhomViec?.ten_nhom || null,
      icon: nhomViec?.icon || null,
    };

    const diem = tinhDiemPhuHop(
      jobForCalc,
      lichHoc,
      kyNangSV,
      sv?.chuyen_nganh || null
    );

    const jobOut = serializeJob(
      j,
      diem,
      nhomViec?.ten_nhom || null,
      nhomViec?.icon || null
    );
    tatCa.push(jobOut);

    if (diem && diem.tong >= 50) {
      phuHop.push(jobOut);
    }
  }

  phuHop.sort((a, b) => b.diem_phu_hop - a.diem_phu_hop);

  const myApps = await prisma.ung_tuyen.findMany({
    where: { sinh_vien_id: sinhVienId },
    select: { viec_lam_id: true, trang_thai: true },
  });

  const appliedIds = myApps.map((a) => a.viec_lam_id);

  const appliedStatus: Record<number, string | null> = {};
  for (const a of myApps) {
    appliedStatus[a.viec_lam_id] = a.trang_thai;
  }

  return {
    phu_hop: phuHop,
    tat_ca: tatCa,
    da_ung_tuyen: appliedIds,
    trang_thai_ung_tuyen: appliedStatus,
  };
}

// ============================================================
// HELPERS
// ============================================================
function formatTime(t: Date | null | undefined): string {
  if (!t) return "";
  const h = String(t.getUTCHours()).padStart(2, "0");
  const m = String(t.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function serializeJob(
  j: any,
  diem: any,
  tenNhom: string | null = null,
  icon: string | null = null
): any {
  return {
    id: j.id,
    nha_tuyen_dung_id: j.nha_tuyen_dung_id,
    tieu_de: j.tieu_de,
    mo_ta: j.mo_ta,
    ky_nang_can: j.ky_nang_can,
    luong_min: Number(j.luong_min || 0),
    luong_max: Number(j.luong_max || 0),
    don_vi_luong: j.don_vi_luong || null,
    loai_cong_viec: j.loai_cong_viec || "remote",
    thu_lam_viec: j.thu_lam_viec || null,
    gio_bat_dau: formatTime(j.gio_bat_dau),
    gio_ket_thuc: formatTime(j.gio_ket_thuc),
    han_chot: j.han_chot || null,
    han_nop_file: j.han_nop_file || null,
    ngay_bat_dau: j.ngay_bat_dau || null,
    ngay_ket_thuc: j.ngay_ket_thuc || null,
    dia_chi_lam_viec: j.dia_chi_lam_viec || null,
    so_luong_can: j.so_luong_can || 1,
    so_buoi: j.so_buoi || 1,
    gio_uoc_tinh: j.gio_uoc_tinh || 0,
    ten_cong_ty: (j.nha_tuyen_dung as any)?.ten_cong_ty || "",
    ten_nhom: tenNhom,
    icon: icon,
    created_at: j.created_at,
    diem_phu_hop: diem?.tong || 0,
    chi_tiet_diem: diem?.chi_tiet || null,
  };
}