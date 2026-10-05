import { prisma } from "../../config/prisma";
import { notifyNTD, formatTime } from "./_helpers";

// ============================================================
// List applications của NTD
// ============================================================
export async function listApplications(ntdId: number, jobId?: number) {
  const where: any = { viec_lam: { nha_tuyen_dung_id: ntdId } };
  if (jobId) where.viec_lam_id = jobId;

  const items = await prisma.ung_tuyen.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      sinh_vien: {
        select: {
          id: true,
          ma_sinh_vien: true,
          ho_ten: true,
          truong: true,
          gpa: true,
          diem_danh_gia: true,
          so_lan_danh_gia: true,
        },
      },
      viec_lam: {
        select: { id: true, tieu_de: true, luong_min: true, luong_max: true },
      },
    },
  });

  // Lookup kỹ năng
  const svIds = [...new Set(items.map((i) => i.sinh_vien_id))];
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
    items: items.map((a) => ({
      id: a.id,
      sinh_vien_id: a.sinh_vien_id,
      viec_lam_id: a.viec_lam_id,
      loai: a.loai,
      loi_nhan: a.loi_nhan,
      trang_thai: a.trang_thai,
      created_at: a.created_at,
      // SV info
      ho_ten: a.sinh_vien.ho_ten,
      ma_sinh_vien: a.sinh_vien.ma_sinh_vien,
      truong: a.sinh_vien.truong,
      gpa: a.sinh_vien.gpa ? Number(a.sinh_vien.gpa) : null,
      diem_danh_gia: Number(a.sinh_vien.diem_danh_gia || 0),
      so_lan_danh_gia: a.sinh_vien.so_lan_danh_gia || 0,
      // Job info
      tieu_de: a.viec_lam?.tieu_de || "",
      luong_min: Number(a.viec_lam?.luong_min || 0),
      luong_max: Number(a.viec_lam?.luong_max || 0),
      // Extras
      ky_nang: (skillMap[a.sinh_vien_id] || []).slice(0, 5),
    })),
  };
}

// ============================================================
// Chi tiết SV (dùng cho modal "Xem hồ sơ")
// ============================================================
export async function getCandidateDetail(ntdId: number, svId: number) {
  // Check NTD có tương tác với SV
  const hasRelation = await prisma.ung_tuyen.findFirst({
    where: {
      sinh_vien_id: svId,
      viec_lam: { nha_tuyen_dung_id: ntdId },
    },
    select: { id: true },
  });
  if (!hasRelation) throw { status: 403, message: "Không có quyền xem" };

  const sv = await prisma.sinh_vien.findUnique({
    where: { id: svId },
    select: {
      id: true,
      ma_sinh_vien: true,
      ho_ten: true,
      email: true,
      so_dien_thoai: true,
      truong: true,
      khoa: true,
      chuyen_nganh: true,
      nam_hoc: true,
      gpa: true,
      mo_ta: true,
      diem_danh_gia: true,
      so_lan_danh_gia: true,
      trang_thai_xac_thuc: true,
    },
  });
  if (!sv) throw { status: 404, message: "Không tìm thấy SV" };

  const [kyNang, chungChi] = await Promise.all([
    prisma.ky_nang.findMany({
      where: { sinh_vien_id: svId },
      select: { ten_ky_nang: true, muc_do: true },
    }),
    prisma.chung_chi.findMany({
      where: { sinh_vien_id: svId },
      select: { id: true, ten_chung_chi: true, to_chuc: true, ngay_cap: true, file_url: true },
    }),
  ]);

  return { sinh_vien: { ...sv, ky_nang: kyNang, chung_chi: chungChi } };
}

// ============================================================
// Approve ứng viên → tạo nhiệm vụ + escrow (cho_nap)
// ============================================================
export async function approveApplication(ntdId: number, utId: number) {
  const ut = await prisma.ung_tuyen.findFirst({
    where: { id: utId, viec_lam: { nha_tuyen_dung_id: ntdId } },
    include: {
      viec_lam: {
        select: {
          id: true,
          tieu_de: true,
          mo_ta: true,
          luong_min: true,
          luong_max: true,
          phi_dich_vu: true,
          han_chot: true,
          han_nop_file: true,
          ngay_ket_thuc: true,
        },
      },
    },
  });
  if (!ut) throw { status: 404, message: "Không tìm thấy" };
  if (ut.trang_thai === "da_chap_nhan")
    throw { status: 400, message: "Đã duyệt rồi" };

  const v = ut.viec_lam as any;
  const escrowCode = "ESC" + Date.now() + Math.floor(Math.random() * 900 + 100);
  const salary = (Number(v.luong_min || 0) + Number(v.luong_max || 0)) / 2;
  const fee = Number(v.phi_dich_vu || 0);

  const deadline = v.han_nop_file
    ? new Date(v.han_nop_file)
    : v.han_chot
      ? new Date(v.han_chot)
      : v.ngay_ket_thuc
        ? new Date(v.ngay_ket_thuc)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    // 1. Update trạng thái
    await tx.ung_tuyen.update({
      where: { id: utId },
      data: { trang_thai: "da_chap_nhan" },
    });

    // 2. Tạo nhiệm vụ
    await tx.nhiem_vu.create({
      data: {
        sinh_vien_id: ut.sinh_vien_id,
        viec_lam_id: v.id,
        ten_nhiem_vu: v.tieu_de,
        mo_ta: v.mo_ta,
        han_nop: deadline,
        trang_thai: "dang_lam",
      },
    });

    // 3. Tạo escrow
    await tx.bao_dam_thanh_toan.create({
      data: {
        ung_tuyen_id: utId,
        viec_lam_id: v.id,
        nha_tuyen_dung_id: ntdId,
        sinh_vien_id: ut.sinh_vien_id,
        so_tien: salary,
        phi_dich_vu: fee,
        ma_giao_dich: escrowCode,
        trang_thai: "cho_nap",
      },
    });

    // 4. Thông báo SV
    try {
      await tx.thong_bao.create({
        data: {
          sinh_vien_id: ut.sinh_vien_id,
          tieu_de: "Ứng tuyển được chấp nhận",
          noi_dung: `Bạn đã được duyệt cho công việc: ${v.tieu_de}. Bạn có thể chat với NTD.`,
          loai: "success",
        },
      });
    } catch {}
  });

  // Thông báo NTD
  await notifyNTD(
    ntdId,
    "Đã duyệt ứng viên",
    `Vui lòng nạp tiền vào escrow cho: ${v.tieu_de}`,
    "escrow"
  );

  return {
    message: "Đã duyệt. Vui lòng kích hoạt bảo đảm thanh toán.",
    escrow_code: escrowCode,
  };
}

// ============================================================
// Reject ứng viên
// ============================================================
export async function rejectApplication(ntdId: number, utId: number) {
  const ut = await prisma.ung_tuyen.findFirst({
    where: { id: utId, viec_lam: { nha_tuyen_dung_id: ntdId } },
    select: { id: true },
  });
  if (!ut) throw { status: 404, message: "Không tìm thấy" };

  await prisma.ung_tuyen.update({
    where: { id: utId },
    data: { trang_thai: "tu_choi" },
  });

  return { message: "Đã từ chối" };
}

// ============================================================
// Mời SV làm việc
// ============================================================
export async function inviteCandidate(
  ntdId: number,
  svId: number,
  jobId: number,
  loiNhan: string
) {
  // Check job thuộc NTD
  const job = await prisma.viec_lam.findFirst({
    where: { id: jobId, nha_tuyen_dung_id: ntdId },
    select: { id: true, tieu_de: true },
  });
  if (!job) throw { status: 400, message: "Tin không hợp lệ" };

  // Check đã có tương tác
  const exists = await prisma.ung_tuyen.findFirst({
    where: { viec_lam_id: jobId, sinh_vien_id: svId },
    select: { id: true },
  });
  if (exists) throw { status: 400, message: "Đã có tương tác với SV này" };

  await prisma.ung_tuyen.create({
    data: {
      sinh_vien_id: svId,
      viec_lam_id: jobId,
      loai: "loi_moi",
      loi_nhan: loiNhan?.trim() || null,
      trang_thai: "cho_duyet",
      ngay_moi: new Date(),
    },
  });

  // Thông báo SV
  try {
    await prisma.thong_bao.create({
      data: {
        sinh_vien_id: svId,
        tieu_de: "📬 Bạn có lời mời làm việc mới",
        noi_dung: `NTD đã mời bạn làm: ${job.tieu_de}. Vào mục "Lời mời" để xem chi tiết.`,
        loai: "invitation",
      },
    });
  } catch {}

  return { message: "Đã gửi lời mời tới sinh viên" };
}