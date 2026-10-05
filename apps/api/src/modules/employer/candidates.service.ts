import { prisma } from "../../config/prisma";
import { calcDistance } from "./_helpers";

// ============================================================
// TÍNH ĐIỂM PHÙ HỢP SV vs NTD:
//   40 (kỹ năng) + 25 (GPA) + 25 (đánh giá) + 10 (khoảng cách)
// ============================================================

export interface CandidateFilter {
  nhom_viec_id?: number;
  ban_kinh?: number; // km
  sap_xep?: "phu_hop" | "khoang_cach" | "danh_gia";
}

export async function listCandidates(ntdId: number, filter: CandidateFilter) {
  // 1. Lấy vị trí NTD
  const ntd = await prisma.nha_tuyen_dung.findUnique({
    where: { id: ntdId },
    select: { vi_do: true, kinh_do: true },
  });

  // 2. Lấy tất cả job của NTD (filter theo nhóm nếu có)
  const jobsWhere: any = { nha_tuyen_dung_id: ntdId };
  if (filter.nhom_viec_id) jobsWhere.nhom_viec_id = filter.nhom_viec_id;

  const jobs = await prisma.viec_lam.findMany({
    where: jobsWhere,
    select: { ky_nang_can: true },
  });

  // 3. Tổng hợp kỹ năng cần
  const reqSkills = new Set<string>();
  for (const j of jobs) {
    (j.ky_nang_can || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .forEach((s) => reqSkills.add(s));
  }
  const requiredSkills = Array.from(reqSkills);

  // 4. Lấy tất cả SV
  const students = await prisma.sinh_vien.findMany({
    where: { bi_khoa: 0 },
    select: {
      id: true,
      ma_sinh_vien: true,
      ho_ten: true,
      truong: true,
      khoa: true,
      chuyen_nganh: true,
      nam_hoc: true,
      gpa: true,
      mo_ta: true,
      diem_danh_gia: true,
      so_lan_danh_gia: true,
      anh_dai_dien: true,
      vi_do: true,
      kinh_do: true,
    },
  });

  // 5. Lấy kỹ năng của từng SV
  const svIds = students.map((s) => s.id);
  const allSkills = svIds.length
    ? await prisma.ky_nang.findMany({
        where: { sinh_vien_id: { in: svIds } },
        select: { sinh_vien_id: true, ten_ky_nang: true, muc_do: true },
      })
    : [];

  const skillMap: Record<number, Array<{ ten_ky_nang: string; muc_do: string | null }>> = {};
  for (const k of allSkills) {
    if (!skillMap[k.sinh_vien_id]) skillMap[k.sinh_vien_id] = [];
    skillMap[k.sinh_vien_id].push({ ten_ky_nang: k.ten_ky_nang, muc_do: k.muc_do });
  }

  // 6. Tính điểm
  const result: any[] = [];

  for (const sv of students) {
    const svSkills = skillMap[sv.id] || [];
    const svSkillNames = svSkills.map((k) => k.ten_ky_nang.toLowerCase());

    // ============ KỸ NĂNG (40 điểm) ============
    let skillScore = 0;
    if (requiredSkills.length > 0) {
      let match = 0;
      for (const r of requiredSkills) {
        for (const s of svSkillNames) {
          if (s.includes(r) || r.includes(s)) {
            match++;
            break;
          }
        }
      }
      skillScore = (match / requiredSkills.length) * 40;
    } else {
      // Không có yêu cầu → cho điểm dựa trên số kỹ năng có
      skillScore = Math.min(40, svSkills.length * 8);
    }

    // ============ GPA (25 điểm) ============
    const gpa = Number(sv.gpa || 0);
    const gpaScore = Math.min(25, (gpa / 4) * 25);

    // ============ ĐÁNH GIÁ (25 điểm) ============
        const ratingScore =
      (sv.so_lan_danh_gia ?? 0) > 0
        ? (Number(sv.diem_danh_gia) / 5) * 25
        : 12.5;

    // ============ KHOẢNG CÁCH (10 điểm) ============
    let distanceScore = 5;
    let distance: number | null = null;

    if (ntd?.vi_do && ntd?.kinh_do && sv.vi_do && sv.kinh_do) {
      distance = calcDistance(
        Number(ntd.vi_do),
        Number(ntd.kinh_do),
        Number(sv.vi_do),
        Number(sv.kinh_do)
      );

      if (distance !== null) {
        distanceScore = Math.max(0, 10 - distance / 5);
      }
    }

    // Filter bán kính
    if (filter.ban_kinh && filter.ban_kinh > 0) {
      if (distance === null || distance > filter.ban_kinh) continue;
    }

    const total =
      Math.round((skillScore + gpaScore + ratingScore + distanceScore) * 10) / 10;

    result.push({
      id: sv.id,
      ma_sinh_vien: sv.ma_sinh_vien,
      ho_ten: sv.ho_ten,
      truong: sv.truong,
      khoa: sv.khoa,
      chuyen_nganh: sv.chuyen_nganh,
      nam_hoc: sv.nam_hoc,
      gpa: sv.gpa ? Number(sv.gpa) : null,
      mo_ta: sv.mo_ta,
      diem_danh_gia: Number(sv.diem_danh_gia || 0),
      so_lan_danh_gia: sv.so_lan_danh_gia || 0,
      anh_dai_dien: sv.anh_dai_dien,
      ky_nang: svSkills.map((k) => k.ten_ky_nang),
      diem_phu_hop: total,
      chi_tiet_diem: {
        ky_nang: Math.round(skillScore * 10) / 10,
        gpa: Math.round(gpaScore * 10) / 10,
        danh_gia: Math.round(ratingScore * 10) / 10,
        khoang_cach: Math.round(distanceScore * 10) / 10,
      },
      khoang_cach: distance,
    });
  }

  // 7. Sort
  const sortBy = filter.sap_xep || "phu_hop";
  result.sort((a, b) => {
    if (sortBy === "khoang_cach") {
      return (a.khoang_cach ?? 99999) - (b.khoang_cach ?? 99999);
    }
    if (sortBy === "danh_gia") {
      return b.diem_danh_gia - a.diem_danh_gia;
    }
    return b.diem_phu_hop - a.diem_phu_hop;
  });

  return { items: result.slice(0, 50) };
}