import { prisma } from "../../config/prisma";
import { logAdmin } from "./_helpers";

// ============================================================
// List khiếu nại
// ============================================================
export async function listComplaints(
  status: string,
  priority: string,
  q: string
) {
  const where: any = {};
  if (status !== "all") where.trang_thai = status;
  if (priority !== "all") where.uu_tien = priority;

  const items = await prisma.khieu_nai.findMany({
    where,
    orderBy: [
      { uu_tien: "desc" },
      { created_at: "desc" },
    ],
    take: 200,
  });

  // Lookup người gửi + đối tượng + job
  const svIds = new Set<number>();
  const ntdIds = new Set<number>();
  const jobIds = new Set<number>();

  for (const k of items) {
    if (k.nguoi_gui_loai === "sinh_vien") svIds.add(k.nguoi_gui_id);
    else ntdIds.add(k.nguoi_gui_id);
    if (k.doi_tuong_loai === "sinh_vien" && k.doi_tuong_id) svIds.add(k.doi_tuong_id);
    if (k.doi_tuong_loai === "nha_tuyen_dung" && k.doi_tuong_id) ntdIds.add(k.doi_tuong_id);
    if (k.viec_lam_id) jobIds.add(k.viec_lam_id);
  }

  const [svList, ntdList, jobList] = await Promise.all([
    svIds.size ? prisma.sinh_vien.findMany({
      where: { id: { in: [...svIds] } },
      select: { id: true, ho_ten: true, ma_sinh_vien: true },
    }) : [],
    ntdIds.size ? prisma.nha_tuyen_dung.findMany({
      where: { id: { in: [...ntdIds] } },
      select: { id: true, ten_cong_ty: true },
    }) : [],
    jobIds.size ? prisma.viec_lam.findMany({
      where: { id: { in: [...jobIds] } },
      select: { id: true, tieu_de: true },
    }) : [],
  ]);

  const svMap = new Map(svList.map((s) => [s.id, s]));
  const ntdMap = new Map(ntdList.map((n) => [n.id, n]));
  const jobMap = new Map(jobList.map((j) => [j.id, j]));

  let mapped = items.map((k) => {
    const nguoiGui =
      k.nguoi_gui_loai === "sinh_vien"
        ? svMap.get(k.nguoi_gui_id)?.ho_ten
        : ntdMap.get(k.nguoi_gui_id)?.ten_cong_ty;

    let doiTuong = "Hệ thống";
    if (k.doi_tuong_loai === "sinh_vien" && k.doi_tuong_id) {
      doiTuong = svMap.get(k.doi_tuong_id)?.ho_ten || "—";
    } else if (k.doi_tuong_loai === "nha_tuyen_dung" && k.doi_tuong_id) {
      doiTuong = ntdMap.get(k.doi_tuong_id)?.ten_cong_ty || "—";
    }

    return {
      id: k.id,
      tieu_de: k.tieu_de,
      noi_dung: k.noi_dung,
      bang_chung: k.bang_chung,
      trang_thai: k.trang_thai,
      uu_tien: k.uu_tien,
      nguoi_gui_loai: k.nguoi_gui_loai,
      nguoi_gui_id: k.nguoi_gui_id,
      nguoi_gui_ten: nguoiGui || "—",
      doi_tuong_loai: k.doi_tuong_loai,
      doi_tuong_id: k.doi_tuong_id,
      doi_tuong_ten: doiTuong,
      viec_lam_id: k.viec_lam_id,
      ten_viec: k.viec_lam_id ? jobMap.get(k.viec_lam_id)?.tieu_de || "" : "",
      ket_qua: k.ket_qua,
      huong_xu_ly: k.huong_xu_ly,
      so_tien_hoan: Number(k.so_tien_hoan || 0),
      created_at: k.created_at,
      resolved_at: k.resolved_at,
    };
  });

  if (q) {
    const lower = q.toLowerCase();
    mapped = mapped.filter(
      (m) =>
        m.tieu_de.toLowerCase().includes(lower) ||
        (m.noi_dung || "").toLowerCase().includes(lower)
    );
  }

  return { items: mapped };
}

// ============================================================
// Chi tiết
// ============================================================
export async function getComplaintDetail(id: number) {
  const kn = await prisma.khieu_nai.findUnique({
    where: { id },
  });
  if (!kn) throw { status: 404, message: "Không tìm thấy" };

  // Nguoi gui
  let nguoiGuiTen = "—";
  if (kn.nguoi_gui_loai === "sinh_vien") {
    const sv = await prisma.sinh_vien.findUnique({
      where: { id: kn.nguoi_gui_id },
      select: { ho_ten: true, ma_sinh_vien: true, email: true },
    });
    nguoiGuiTen = sv ? `${sv.ho_ten} (${sv.ma_sinh_vien})` : "—";
  } else {
    const ntd = await prisma.nha_tuyen_dung.findUnique({
      where: { id: kn.nguoi_gui_id },
      select: { ten_cong_ty: true, email: true },
    });
    nguoiGuiTen = ntd?.ten_cong_ty || "—";
  }

  // Doi tuong
  let doiTuongTen = "Hệ thống";
  if (kn.doi_tuong_loai === "sinh_vien" && kn.doi_tuong_id) {
    const sv = await prisma.sinh_vien.findUnique({
      where: { id: kn.doi_tuong_id },
      select: { ho_ten: true, ma_sinh_vien: true },
    });
    doiTuongTen = sv ? `${sv.ho_ten} (${sv.ma_sinh_vien})` : "—";
  } else if (kn.doi_tuong_loai === "nha_tuyen_dung" && kn.doi_tuong_id) {
    const ntd = await prisma.nha_tuyen_dung.findUnique({
      where: { id: kn.doi_tuong_id },
      select: { ten_cong_ty: true },
    });
    doiTuongTen = ntd?.ten_cong_ty || "—";
  }

  // Job
  let tenViec = "";
  if (kn.viec_lam_id) {
    const job = await prisma.viec_lam.findUnique({
      where: { id: kn.viec_lam_id },
      select: { tieu_de: true },
    });
    tenViec = job?.tieu_de || "";
  }

  // Escrow liên quan
  let escrow: any = null;
  if (kn.viec_lam_id) {
    escrow = await prisma.bao_dam_thanh_toan.findFirst({
      where: { viec_lam_id: kn.viec_lam_id },
      orderBy: { created_at: "desc" },
    });
  }

  // Lịch sử hoàn tiền
  const refunds = await prisma.lich_su_hoan_tien.findMany({
    where: { khieu_nai_id: id },
    orderBy: { created_at: "desc" },
  });

  return {
    khieu_nai: {
      ...kn,
      nguoi_gui_ten: nguoiGuiTen,
      doi_tuong_ten: doiTuongTen,
      ten_viec: tenViec,
      so_tien_hoan: Number(kn.so_tien_hoan || 0),
    },
    escrow: escrow
      ? {
          ...escrow,
          so_tien: Number(escrow.so_tien),
          phi_dich_vu: Number(escrow.phi_dich_vu || 0),
        }
      : null,
    lich_su_hoan_tien: refunds.map((r) => ({
      ...r,
      so_tien: Number(r.so_tien),
    })),
  };
}

// ============================================================
// Tiếp nhận (take)
// ============================================================
export async function takeComplaint(
  adminId: number,
  id: number,
  priority: string
) {
  const kn = await prisma.khieu_nai.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!kn) throw { status: 404, message: "Không tìm thấy" };

  await prisma.khieu_nai.update({
    where: { id },
    data: {
      trang_thai: "dang_xu_ly",
      admin_id: adminId,
      uu_tien: priority as any,
    },
  });

  await logAdmin(adminId, "take_complaint", "khieu_nai", id, priority);
  return { message: "Đã tiếp nhận khiếu nại" };
}

// ============================================================
// Hòa giải + hoàn tiền
// ============================================================
export interface ResolveInput {
  id: number;
  ket_qua: string;
  huong_xu_ly: "hoan_tien_sv" | "hoan_tien_ntd" | "chia_doi" | "khong_hoan" | "khac";
  so_tien_hoan: number;
}

export async function resolveComplaint(adminId: number, input: ResolveInput) {
  const kn = await prisma.khieu_nai.findUnique({
    where: { id: input.id },
  });
  if (!kn) throw { status: 404, message: "Không tìm thấy" };

  const {
    id,
    ket_qua,
    huong_xu_ly,
    so_tien_hoan,
  } = input;

  await prisma.$transaction(async (tx) => {
    // 1. Update khiếu nại
    await tx.khieu_nai.update({
      where: { id },
      data: {
        trang_thai: "da_giai_quyet",
        admin_id: adminId,
        ket_qua: ket_qua.trim(),
        huong_xu_ly: huong_xu_ly as any,
        so_tien_hoan: so_tien_hoan || 0,
        resolved_at: new Date(),
      },
    });

    // 2. Nếu có hoàn tiền
    if (so_tien_hoan > 0 && ["hoan_tien_sv", "hoan_tien_ntd", "chia_doi"].includes(huong_xu_ly)) {
      let escrow: any = null;
      if (kn.viec_lam_id) {
        escrow = await tx.bao_dam_thanh_toan.findFirst({
          where: {
            viec_lam_id: kn.viec_lam_id,
            trang_thai: { in: ["da_nap", "cho_nghiem_thu"] },
          },
          orderBy: { created_at: "desc" },
        });
      }

      if (escrow) {
        // Hoàn cho SV
        if (huong_xu_ly === "hoan_tien_sv" || huong_xu_ly === "chia_doi") {
          const tienSV = huong_xu_ly === "chia_doi" ? so_tien_hoan / 2 : so_tien_hoan;

          await tx.vi_tien.upsert({
            where: { sinh_vien_id: escrow.sinh_vien_id },
            create: { sinh_vien_id: escrow.sinh_vien_id, so_du: tienSV },
            update: { so_du: { increment: tienSV } },
          });

          await tx.lich_su_hoan_tien.create({
            data: {
              khieu_nai_id: id,
              bao_dam_id: escrow.id,
              nguoi_nhan_loai: "sinh_vien",
              nguoi_nhan_id: escrow.sinh_vien_id,
              so_tien: tienSV,
              ly_do: ket_qua,
              admin_id: adminId,
            },
          });

          await tx.giao_dich.create({
            data: {
              sinh_vien_id: escrow.sinh_vien_id,
              so_tien: tienSV,
              loai: "thu_nhap",
              mo_ta: `Hoàn tiền từ khiếu nại #${id}`,
              trang_thai: "thanh_cong",
            },
          });
        }

        // Hoàn cho NTD
        if (huong_xu_ly === "hoan_tien_ntd" || huong_xu_ly === "chia_doi") {
          const tienNTD = huong_xu_ly === "chia_doi" ? so_tien_hoan / 2 : so_tien_hoan;

          await tx.vi_ntd.upsert({
            where: { nha_tuyen_dung_id: escrow.nha_tuyen_dung_id },
            create: { nha_tuyen_dung_id: escrow.nha_tuyen_dung_id, so_du: tienNTD },
            update: { so_du: { increment: tienNTD } },
          });

          await tx.lich_su_hoan_tien.create({
            data: {
              khieu_nai_id: id,
              bao_dam_id: escrow.id,
              nguoi_nhan_loai: "nha_tuyen_dung",
              nguoi_nhan_id: escrow.nha_tuyen_dung_id,
              so_tien: tienNTD,
              ly_do: ket_qua,
              admin_id: adminId,
            },
          });
        }

        // Update escrow
        await tx.bao_dam_thanh_toan.update({
          where: { id: escrow.id },
          data: { trang_thai: "hoan_tien" },
        });
      }
    }

    // 3. Thông báo cho người gửi
    if (kn.nguoi_gui_loai === "sinh_vien") {
      try {
        await tx.thong_bao.create({
          data: {
            sinh_vien_id: kn.nguoi_gui_id,
            tieu_de: "Khiếu nại đã được giải quyết",
            noi_dung: `Kết quả: ${ket_qua}`,
            loai: "success",
          },
        });
      } catch {}
    } else {
      try {
        await tx.thong_bao_ntd.create({
          data: {
            nha_tuyen_dung_id: kn.nguoi_gui_id,
            tieu_de: "Khiếu nại đã được giải quyết",
            noi_dung: `Kết quả: ${ket_qua}`,
            loai: "success",
          },
        });
      } catch {}
    }
  });

  await logAdmin(
    adminId,
    "resolve_complaint",
    "khieu_nai",
    id,
    `Hướng: ${huong_xu_ly}, Hoàn: ${so_tien_hoan}`
  );

  return { message: "Đã giải quyết khiếu nại" };
}

// ============================================================
// Đóng khiếu nại
// ============================================================
export async function closeComplaint(
  adminId: number,
  id: number,
  reason: string
) {
  await prisma.khieu_nai.update({
    where: { id },
    data: {
      trang_thai: "da_dong",
      admin_id: adminId,
      ket_qua: reason,
      resolved_at: new Date(),
    },
  });

  await logAdmin(adminId, "close_complaint", "khieu_nai", id, reason);
  return { message: "Đã đóng khiếu nại" };
}

// ============================================================
// Stats
// ============================================================
export async function getStats() {
  const items = await prisma.khieu_nai.findMany({
    select: { trang_thai: true, uu_tien: true },
  });

  const stats = {
    cho_xu_ly: 0,
    dang_xu_ly: 0,
    da_giai_quyet: 0,
    da_dong: 0,
    khan_cap: 0,
    cao: 0,
    trung_binh: 0,
    thap: 0,
    tong: items.length,
  };

  for (const k of items) {
    if (k.trang_thai === "cho_xu_ly") stats.cho_xu_ly++;
    else if (k.trang_thai === "dang_xu_ly") stats.dang_xu_ly++;
    else if (k.trang_thai === "da_giai_quyet") stats.da_giai_quyet++;
    else if (k.trang_thai === "da_dong") stats.da_dong++;

    if (k.uu_tien === "khan_cap") stats.khan_cap++;
    else if (k.uu_tien === "cao") stats.cao++;
    else if (k.uu_tien === "trung_binh") stats.trung_binh++;
    else if (k.uu_tien === "thap") stats.thap++;
  }

  const refundSum = await prisma.lich_su_hoan_tien.aggregate({
    _sum: { so_tien: true },
  });

  return {
    khieu_nai: stats,
    tong_hoan_tien: Number(refundSum._sum.so_tien || 0),
  };
}