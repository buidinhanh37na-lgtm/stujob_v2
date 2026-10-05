import { prisma } from "../../config/prisma";
import { logAdmin } from "./_helpers";

// ============================================================
// List SV nhà trường
// ============================================================
export async function listSvTruong(q: string, status: string) {
  const where: any = {};
  if (status !== "all") where.trang_thai = status;
  if (q) {
    where.OR = [
      { ma_sinh_vien: { contains: q } },
      { ho_ten: { contains: q } },
      { chuyen_nganh: { contains: q } },
    ];
  }

  const items = await prisma.sv_truong.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 200,
  });

  // Kiểm tra SV đã đăng ký chưa
  const mssvList = items.map((i) => i.ma_sinh_vien);
  const registered = mssvList.length
    ? await prisma.sinh_vien.findMany({
        where: { ma_sinh_vien: { in: mssvList } },
        select: { ma_sinh_vien: true },
      })
    : [];
  const regSet = new Set(registered.map((r) => r.ma_sinh_vien));

  return {
    items: items.map((i) => ({
      id: i.id,
      ma_sinh_vien: i.ma_sinh_vien,
      ho_ten: i.ho_ten,
      ngay_sinh: i.ngay_sinh,
      khoa: i.khoa,
      chuyen_nganh: i.chuyen_nganh,
      nam_hoc: i.nam_hoc,
      lop: i.lop,
      trang_thai: i.trang_thai,
      da_dang_ky: regSet.has(i.ma_sinh_vien),
      created_at: i.created_at,
    })),
  };
}

// ============================================================
// Thêm thủ công
// ============================================================
export interface AddSvInput {
  ma_sinh_vien: string;
  ho_ten: string;
  ngay_sinh?: string | null;
  khoa?: string;
  chuyen_nganh?: string;
  nam_hoc?: number | null;
  lop?: string;
  trang_thai?: string;
}

export async function addSvTruong(adminId: number, input: AddSvInput) {
  if (!input.ma_sinh_vien?.trim())
    throw { status: 400, message: "Thiếu MSSV" };
  if (!input.ho_ten?.trim()) throw { status: 400, message: "Thiếu họ tên" };

  try {
    const created = await prisma.sv_truong.create({
      data: {
        ma_sinh_vien: input.ma_sinh_vien.trim(),
        ho_ten: input.ho_ten.trim(),
        ngay_sinh: input.ngay_sinh ? new Date(input.ngay_sinh) : null,
        khoa: input.khoa?.trim() || null,
        chuyen_nganh: input.chuyen_nganh?.trim() || null,
        nam_hoc: input.nam_hoc || null,
        lop: input.lop?.trim() || null,
        trang_thai: (input.trang_thai as any) || "dang_hoc",
      },
    });

    await logAdmin(
      adminId,
      "add_sv_truong",
      "sv_truong",
      created.id,
      input.ma_sinh_vien
    );

    return { message: "Đã thêm sinh viên", id: created.id };
  } catch {
    throw { status: 400, message: "MSSV đã tồn tại trong DB trường" };
  }
}

// ============================================================
// Import CSV
// ============================================================
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export async function importSvTruong(
  adminId: number,
  csvContent: string
): Promise<ImportResult> {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2)
    throw { status: 400, message: "File CSV trống hoặc thiếu dữ liệu" };

  const dataLines = lines.slice(1);
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < dataLines.length; i++) {
    const cols = parseCSVLine(dataLines[i]);
    if (cols.length < 2) {
      result.failed++;
      result.errors.push(`Dòng ${i + 2}: thiếu cột`);
      continue;
    }

    try {
      const mssv = cols[0].trim();
      const hoTen = cols[1].trim();
      if (!mssv || !hoTen) throw new Error("MSSV hoặc họ tên rỗng");

      // Check tồn tại
      const existing = await prisma.sv_truong.findUnique({
        where: { ma_sinh_vien: mssv },
        select: { id: true },
      });

      if (existing) {
        // Update
        await prisma.sv_truong.update({
          where: { id: existing.id },
          data: {
            ho_ten: hoTen,
            ngay_sinh: cols[2] ? new Date(cols[2]) : null,
            khoa: cols[3] || null,
            chuyen_nganh: cols[4] || null,
            nam_hoc: cols[5] ? parseInt(cols[5], 10) : null,
            lop: cols[6] || null,
            trang_thai: (cols[7] as any) || "dang_hoc",
          },
        });
      } else {
        // Insert
        await prisma.sv_truong.create({
          data: {
            ma_sinh_vien: mssv,
            ho_ten: hoTen,
            ngay_sinh: cols[2] ? new Date(cols[2]) : null,
            khoa: cols[3] || null,
            chuyen_nganh: cols[4] || null,
            nam_hoc: cols[5] ? parseInt(cols[5], 10) : null,
            lop: cols[6] || null,
            trang_thai: (cols[7] as any) || "dang_hoc",
          },
        });
      }
      result.success++;
    } catch (e: unknown) {
      result.failed++;
      const err = e as { message?: string };
      result.errors.push(`Dòng ${i + 2}: ${err.message || "Lỗi"}`);
    }
  }

  await logAdmin(
    adminId,
    "import_sv_truong",
    null,
    null,
    `Import: ${result.success} thành công, ${result.failed} thất bại`
  );

  return result;
}

// ============================================================
// Xóa
// ============================================================
export async function deleteSvTruong(adminId: number, id: number) {
  await prisma.sv_truong.delete({ where: { id } });
  await logAdmin(adminId, "delete_sv_truong", "sv_truong", id);
  return { message: "Đã xóa" };
}

// ============================================================
// Stats
// ============================================================
export async function getStats() {
  const [tong, dangHoc, totNghiep, dinhChi] = await Promise.all([
    prisma.sv_truong.count(),
    prisma.sv_truong.count({ where: { trang_thai: "dang_hoc" } }),
    prisma.sv_truong.count({ where: { trang_thai: "tot_nghiep" } }),
    prisma.sv_truong.count({ where: { trang_thai: "bi_dinh_chi" } }),
  ]);

  return {
    tong,
    dang_hoc: dangHoc,
    tot_nghiep: totNghiep,
    bi_dinh_chi: dinhChi,
  };
}

// ============================================================
// CSV Template
// ============================================================
export function getTemplate() {
  const csv = [
    "ma_sinh_vien,ho_ten,ngay_sinh,khoa,chuyen_nganh,nam_hoc,lop,trang_thai",
    "SV001,Nguyễn Văn A,2004-01-10,Công nghệ thông tin,Kỹ thuật phần mềm,3,KTPM01,dang_hoc",
    "SV002,Trần Thị B,2003-08-22,Kinh tế,Marketing,4,MKT02,dang_hoc",
    "SV003,Lê Văn C,2004-03-12,Ngoại ngữ,Tiếng Anh,2,TA01,dang_hoc",
    "SV004,Phạm Thị D,2003-11-05,Công nghệ thông tin,Khoa học dữ liệu,4,KHDL01,dang_hoc",
    "SV005,Hoàng Văn E,2002-06-18,Kinh tế,Kế toán,4,KT01,tot_nghiep",
  ].join("\n");

  return Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from(csv, "utf-8"),
  ]);
}

// ============================================================
// Helpers
// ============================================================
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((c) => c.trim());
}