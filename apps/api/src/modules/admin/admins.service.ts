    import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";

const VALID_ROLES = ["super_admin", "admin", "moderator", "support"];

export async function listAdmins() {
  const items = await prisma.quan_tri_vien.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      ho_ten: true,
      email: true,
      vai_tro: true,
      trang_thai: true,
      last_login: true,
      created_at: true,
    },
  });
  return { items };
}

export async function createAdmin(
  currentAdminId: number,
  data: { ho_ten: string; email: string; mat_khau: string; vai_tro: string }
) {
  const { ho_ten, email, mat_khau, vai_tro } = data;

  if (!ho_ten || !email || !mat_khau)
    throw { status: 400, message: "Thiếu thông tin" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw { status: 400, message: "Email không hợp lệ" };
  if (mat_khau.length < 6)
    throw { status: 400, message: "Mật khẩu tối thiểu 6 ký tự" };
  if (!VALID_ROLES.includes(vai_tro))
    throw { status: 400, message: "Vai trò không hợp lệ" };

  const existing = await prisma.quan_tri_vien.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) throw { status: 400, message: "Email đã tồn tại" };

  const hash = await bcrypt.hash(mat_khau, 10);
  const created = await prisma.quan_tri_vien.create({
    data: {
      ho_ten: ho_ten.trim(),
      email: email.trim().toLowerCase(),
      mat_khau: hash,
      vai_tro: vai_tro as any,
      trang_thai: "hoat_dong",
    },
  });

  await prisma.nhat_ky_admin.create({
    data: {
      admin_id: currentAdminId,
      hanh_dong: "create_admin",
      doi_tuong_loai: "quan_tri_vien",
      doi_tuong_id: created.id,
      chi_tiet: email,
    },
  });

  return { message: "Đã tạo tài khoản admin" };
}

export async function updateAdmin(
  currentAdminId: number,
  data: {
    id: number;
    ho_ten?: string;
    vai_tro?: string;
    trang_thai?: string;
    mat_khau?: string;
  }
) {
  const { id, ho_ten, vai_tro, trang_thai, mat_khau } = data;
  if (!id) throw { status: 400, message: "Thiếu ID" };

  const fields: any = {};
  if (ho_ten !== undefined) fields.ho_ten = ho_ten.trim();
  if (vai_tro !== undefined && VALID_ROLES.includes(vai_tro))
    fields.vai_tro = vai_tro;
  if (trang_thai !== undefined && ["hoat_dong", "bi_khoa"].includes(trang_thai))
    fields.trang_thai = trang_thai;
  if (mat_khau) {
    if (mat_khau.length < 6)
      throw { status: 400, message: "Mật khẩu tối thiểu 6 ký tự" };
    fields.mat_khau = await bcrypt.hash(mat_khau, 10);
  }

  if (Object.keys(fields).length === 0)
    throw { status: 400, message: "Không có gì để cập nhật" };

  await prisma.quan_tri_vien.update({ where: { id }, data: fields });

  await prisma.nhat_ky_admin.create({
    data: {
      admin_id: currentAdminId,
      hanh_dong: "update_admin",
      doi_tuong_loai: "quan_tri_vien",
      doi_tuong_id: id,
    },
  });

  return { message: "Đã cập nhật" };
}

export async function deleteAdmin(currentAdminId: number, id: number) {
  if (!id) throw { status: 400, message: "Thiếu ID" };
  if (id === currentAdminId)
    throw { status: 400, message: "Không thể xóa chính mình" };

  await prisma.quan_tri_vien.delete({ where: { id } });

  await prisma.nhat_ky_admin.create({
    data: {
      admin_id: currentAdminId,
      hanh_dong: "delete_admin",
      doi_tuong_loai: "quan_tri_vien",
      doi_tuong_id: id,
    },
  });

  return { message: "Đã xóa admin" };
}