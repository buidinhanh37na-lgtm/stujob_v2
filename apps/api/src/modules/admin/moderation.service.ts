import { prisma } from "../../config/prisma";
import { logAdmin } from "./_helpers";

// ============================================================
// Phân tích rủi ro của 1 tin việc
// ============================================================
export async function analyzeJobRisk(
  tieuDe: string,
  moTa: string,
  yeuCau: string,
  kyNang: string
) {
  const text = `${tieuDe} ${moTa} ${yeuCau} ${kyNang}`.toLowerCase();

  const keywords = await prisma.tu_khoa_cam.findMany({
    select: { tu_khoa: true, muc_do_rui_ro: true, loai: true, hanh_dong: true },
  });

  const found: string[] = [];
  let maxScore = 0;

  for (const kw of keywords) {
    if (text.includes(kw.tu_khoa.toLowerCase())) {
      const score = kw.muc_do_rui_ro ?? 0;
      found.push(`${kw.tu_khoa}(${score})`);
      if (score > maxScore) maxScore = score;
    }
  }

  const score = Math.min(
    10,
    maxScore + Math.min(3, Math.max(0, found.length - 1))
  );

  // Ngưỡng
  const [chanCfg, canhBaoCfg] = await Promise.all([
    prisma.cau_hinh_he_thong.findUnique({
      where: { khoa: "nguong_rui_ro_tu_dong_chan" },
      select: { gia_tri: true },
    }),
    prisma.cau_hinh_he_thong.findUnique({
      where: { khoa: "nguong_rui_ro_canh_bao" },
      select: { gia_tri: true },
    }),
  ]);

  const nguongChan = parseInt(chanCfg?.gia_tri || "8", 10);
  const nguongCanhBao = parseInt(canhBaoCfg?.gia_tri || "5", 10);

  let goiY: "duyet" | "chan" | "canh_bao" = "duyet";
  if (score >= nguongChan) goiY = "chan";
  else if (score >= nguongCanhBao) goiY = "canh_bao";

  return {
    diem: score,
    tu_khoa: found,
    goi_y: goiY,
    nguong_chan: nguongChan,
    nguong_canh_bao: nguongCanhBao,
  };
}

// ============================================================
// List tin cần kiểm duyệt
// ============================================================
export async function listPending(filter: string, q: string) {
  const jobs = await prisma.viec_lam.findMany({
    orderBy: { created_at: "desc" },
    take: 200,
  });

  // Lookup NTD
  const ntdIds = [...new Set(jobs.map((j) => j.nha_tuyen_dung_id))];
  const ntdList = ntdIds.length
    ? await prisma.nha_tuyen_dung.findMany({
        where: { id: { in: ntdIds } },
        select: { id: true, ten_cong_ty: true },
      })
    : [];
  const ntdMap = new Map(ntdList.map((n) => [n.id, n]));

  // Lookup kiểm duyệt
  const kdList = await prisma.kiem_duyet_tin.findMany({
    where: { viec_lam_id: { in: jobs.map((j) => j.id) } },
    orderBy: { created_at: "desc" },
  });
  const kdMap = new Map<number, any>();
  for (const kd of kdList) {
    if (!kdMap.has(kd.viec_lam_id)) kdMap.set(kd.viec_lam_id, kd);
  }

  // Build items
  const items: any[] = [];
  for (const j of jobs) {
    const ntd = ntdMap.get(j.nha_tuyen_dung_id);
    const kd = kdMap.get(j.id);

    let risk: any;
    if (kd) {
      risk = {
        diem: kd.diem_rui_ro || 0,
        tu_khoa: (kd.tu_khoa_phat_hien || "").split(",").filter(Boolean),
        goi_y: kd.hanh_dong || "duyet",
      };
    } else {
      risk = await analyzeJobRisk(
        j.tieu_de,
        j.mo_ta || "",
        (j as any).yeu_cau || "",
        j.ky_nang_can || ""
      );
    }

    // Filter
    if (filter === "risky" && risk.diem < 5) continue;
    if (filter === "warned" && risk.goi_y !== "canh_bao") continue;
    if (filter === "blocked" && risk.goi_y !== "chan") continue;

    // Search
    if (q) {
      const lower = q.toLowerCase();
      const hay = `${j.tieu_de} ${ntd?.ten_cong_ty || ""}`.toLowerCase();
      if (!hay.includes(lower)) continue;
    }

    items.push({
      id: j.id,
      tieu_de: j.tieu_de,
      mo_ta: j.mo_ta,
      ky_nang_can: j.ky_nang_can,
      luong_min: Number(j.luong_min || 0),
      luong_max: Number(j.luong_max || 0),
      trang_thai: j.trang_thai,
      created_at: j.created_at,
      ntd_id: j.nha_tuyen_dung_id,
      ten_cong_ty: ntd?.ten_cong_ty || "",
      diem_rui_ro: risk.diem,
      tu_khoa_phat_hien: risk.tu_khoa.join(", "),
      goi_y: risk.goi_y,
      kd_id: kd?.id || null,
      kd_hanh_dong: kd?.hanh_dong || null,
    });
  }

  return { items: items.slice(0, 100) };
}

// ============================================================
// Phân tích 1 job (dùng cho modal)
// ============================================================
export async function analyzeSingleJob(jobId: number) {
  const job = await prisma.viec_lam.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      tieu_de: true,
      mo_ta: true,
      ky_nang_can: true,
      yeu_cau: true,
      nha_tuyen_dung_id: true,
    },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy" };

  const ntd = await prisma.nha_tuyen_dung.findUnique({
    where: { id: job.nha_tuyen_dung_id },
    select: { ten_cong_ty: true },
  });

  const risk = await analyzeJobRisk(
    job.tieu_de,
    job.mo_ta || "",
    job.yeu_cau || "",
    job.ky_nang_can || ""
  );

  return {
    job: { ...job, ten_cong_ty: ntd?.ten_cong_ty || "" },
    risk,
  };
}

// ============================================================
// Duyệt tin
// ============================================================
export async function approveJob(adminId: number, jobId: number, note: string) {
  const job = await prisma.viec_lam.findUnique({
    where: { id: jobId },
    select: { id: true, tieu_de: true, nha_tuyen_dung_id: true },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy" };

  await prisma.$transaction(async (tx) => {
    await tx.kiem_duyet_tin.create({
      data: {
        viec_lam_id: jobId,
        admin_id: adminId,
        hanh_dong: "duyet" as any,
        ly_do: note || "Admin duyệt thủ công",
        diem_rui_ro: 0,
      },
    });

    await tx.viec_lam.update({
      where: { id: jobId },
      data: { trang_thai: "dang_mo" },
    });

    try {
      await tx.thong_bao_ntd.create({
        data: {
          nha_tuyen_dung_id: job.nha_tuyen_dung_id,
          tieu_de: "Tin việc đã được duyệt",
          noi_dung: `Tin "${job.tieu_de}" đã được admin phê duyệt.`,
          loai: "success",
        },
      });
    } catch {}
  });

  await logAdmin(adminId, "approve_job", "viec_lam", jobId, note);
  return { message: "Đã duyệt tin" };
}

// ============================================================
// Chặn tin
// ============================================================
export async function blockJob(
  adminId: number,
  jobId: number,
  reason: string,
  score: number,
  keywords: string
) {
  if (!reason) throw { status: 400, message: "Vui lòng nhập lý do" };

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

    await tx.kiem_duyet_tin.create({
      data: {
        viec_lam_id: jobId,
        admin_id: adminId,
        hanh_dong: "chan" as any,
        ly_do: reason,
        diem_rui_ro: score || 10,
        tu_khoa_phat_hien: keywords || "",
      },
    });

    try {
      await tx.thong_bao_ntd.create({
        data: {
          nha_tuyen_dung_id: job.nha_tuyen_dung_id,
          tieu_de: "❌ Tin việc bị chặn",
          noi_dung: `Tin "${job.tieu_de}" đã bị chặn. Lý do: ${reason}`,
          loai: "error",
        },
      });
    } catch {}
  });

  await logAdmin(adminId, "block_job", "viec_lam", jobId, reason);
  return { message: "Đã chặn tin" };
}

// ============================================================
// Cảnh báo
// ============================================================
export async function warnJob(
  adminId: number,
  jobId: number,
  reason: string,
  score: number,
  keywords: string
) {
  const job = await prisma.viec_lam.findUnique({
    where: { id: jobId },
    select: { id: true, tieu_de: true, nha_tuyen_dung_id: true },
  });
  if (!job) throw { status: 404, message: "Không tìm thấy" };

  await prisma.$transaction(async (tx) => {
    await tx.kiem_duyet_tin.create({
      data: {
        viec_lam_id: jobId,
        admin_id: adminId,
        hanh_dong: "canh_bao" as any,
        ly_do: reason,
        diem_rui_ro: score || 5,
        tu_khoa_phat_hien: keywords || "",
      },
    });

    try {
      await tx.thong_bao_ntd.create({
        data: {
          nha_tuyen_dung_id: job.nha_tuyen_dung_id,
          tieu_de: "⚠️ Cảnh báo tin việc",
          noi_dung: `Tin "${job.tieu_de}" có dấu hiệu không phù hợp: ${reason}`,
          loai: "warning",
        },
      });
    } catch {}
  });

  await logAdmin(adminId, "warn_job", "viec_lam", jobId, reason);
  return { message: "Đã gửi cảnh báo" };
}

// ============================================================
// Auto scan
// ============================================================
export async function autoScan(adminId: number) {
  const checkedIds = (
    await prisma.kiem_duyet_tin.findMany({
      select: { viec_lam_id: true },
    })
  ).map((k) => k.viec_lam_id);

  const jobs = await prisma.viec_lam.findMany({
    where: {
      id: { notIn: checkedIds.length > 0 ? checkedIds : [-1] },
    },
    take: 200,
    select: {
      id: true,
      tieu_de: true,
      mo_ta: true,
      yeu_cau: true,
      ky_nang_can: true,
    },
  });

  let blocked = 0;
  let warned = 0;
  let safe = 0;

  for (const j of jobs) {
    const risk = await analyzeJobRisk(
      j.tieu_de,
      j.mo_ta || "",
      j.yeu_cau || "",
      j.ky_nang_can || ""
    );

    let act = "duyet";
    if (risk.goi_y === "chan") {
      act = "chan";
      await prisma.viec_lam.update({
        where: { id: j.id },
        data: { trang_thai: "da_dong" },
      });
      blocked++;
    } else if (risk.goi_y === "canh_bao") {
      act = "canh_bao";
      warned++;
    } else {
      safe++;
    }

    await prisma.kiem_duyet_tin.create({
      data: {
        viec_lam_id: j.id,
        admin_id: adminId,
        hanh_dong: act as any,
        ly_do: "Quét tự động",
        diem_rui_ro: risk.diem,
        tu_khoa_phat_hien: risk.tu_khoa.join(", "),
      },
    });
  }

  await logAdmin(
    adminId,
    "auto_scan",
    null,
    null,
    `Chặn: ${blocked}, Cảnh báo: ${warned}, An toàn: ${safe}`
  );

  return {
    message: `Đã quét ${jobs.length} tin. Chặn: ${blocked}, Cảnh báo: ${warned}, An toàn: ${safe}`,
    blocked,
    warned,
    safe,
  };
}

// ============================================================
// KEYWORDS CRUD
// ============================================================
export async function listKeywords() {
  const items = await prisma.tu_khoa_cam.findMany({
    orderBy: [
      { hanh_dong: "desc" },
      { muc_do_rui_ro: "desc" },
      { tu_khoa: "asc" },
    ],
  });
  return { items };
}

export async function addKeyword(
  adminId: number,
  tuKhoa: string,
  mucDo: number,
  loai: string,
  hanhDong: string,
  ghiChu: string
) {
  if (!tuKhoa) throw { status: 400, message: "Thiếu từ khóa" };
  if (!["chan", "canh_bao"].includes(hanhDong)) hanhDong = "chan";

  try {
    const created = await prisma.tu_khoa_cam.create({
      data: {
        tu_khoa: tuKhoa.trim(),
        muc_do_rui_ro: mucDo,
        loai: loai as any,
        hanh_dong: hanhDong as any,
        ghi_chu: ghiChu || null,
      },
    });
    await logAdmin(
      adminId,
      "add_keyword",
      "tu_khoa",
      created.id,
      `Từ khóa: ${tuKhoa} (${hanhDong})`
    );
    return { message: "Đã thêm từ khóa", id: created.id };
  } catch {
    throw { status: 400, message: "Từ khóa đã tồn tại" };
  }
}

export async function updateKeyword(
  adminId: number,
  id: number,
  data: Partial<{
    tu_khoa: string;
    muc_do_rui_ro: number;
    loai: string;
    hanh_dong: string;
    ghi_chu: string;
  }>
) {
  const fields: any = {};
  if (data.tu_khoa !== undefined) fields.tu_khoa = data.tu_khoa.trim();
  if (data.muc_do_rui_ro !== undefined) fields.muc_do_rui_ro = data.muc_do_rui_ro;
  if (data.loai !== undefined) fields.loai = data.loai as any;
  if (data.hanh_dong !== undefined && ["chan", "canh_bao"].includes(data.hanh_dong))
    fields.hanh_dong = data.hanh_dong as any;
  if (data.ghi_chu !== undefined) fields.ghi_chu = data.ghi_chu || null;

  if (Object.keys(fields).length === 0)
    throw { status: 400, message: "Không có gì để cập nhật" };

  await prisma.tu_khoa_cam.update({ where: { id }, data: fields });
  await logAdmin(adminId, "update_keyword", "tu_khoa", id);
  return { message: "Đã cập nhật" };
}

export async function deleteKeyword(adminId: number, id: number) {
  await prisma.tu_khoa_cam.delete({ where: { id } });
  await logAdmin(adminId, "delete_keyword", "tu_khoa", id);
  return { message: "Đã xóa" };
}

export async function keywordsStats() {
  const items = await prisma.tu_khoa_cam.findMany();
  const stats = {
    tong: items.length,
    chan: items.filter((i) => i.hanh_dong === "chan").length,
    canh_bao: items.filter((i) => i.hanh_dong === "canh_bao").length,
    lua_dao: items.filter((i) => i.loai === "lua_dao").length,
    rui_ro: items.filter((i) => i.loai === "rui_ro").length,
    khong_phu_hop: items.filter((i) => i.loai === "khong_phu_hop").length,
  };
  return { stats };
}