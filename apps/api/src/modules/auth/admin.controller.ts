import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshToken,
} from "../../utils/cookie";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@stujob/validation";
import { z } from "zod";
import * as svc from "./admin.service";

const ROLE = "quan_tri_vien" as const;

const changePasswordSchema = z.object({
  mat_khau_cu: z.string().min(1),
  mat_khau_moi: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
});

export const loginAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const { accessToken, refreshToken, admin } = await svc.loginAdmin(parsed.data);

    setAuthCookies(res, ROLE, accessToken, refreshToken);
    return okMsg(res, "Đăng nhập thành công", { admin });
  }
);

export const logoutAdmin = asyncHandler(
  async (_req: Request, res: Response) => {
    clearAuthCookies(res, ROLE);
    return okMsg(res, "Đã đăng xuất");
  }
);

export const refreshAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = getRefreshToken(req, ROLE);
    if (!refreshToken) return fail(res, "Không có refresh token", 401);

    const tokens = await svc.refreshAdminToken(refreshToken);
    setAuthCookies(res, ROLE, tokens.accessToken, tokens.refreshToken);
    return okMsg(res, "Đã làm mới token");
  }
);

export const getMeAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const admin = await svc.getCurrentAdmin(userId);
    return ok(res, { admin });
  }
);

export const changePasswordAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const userId = req.user!.userId;
    const result = await svc.changeAdminPassword(
      userId,
      parsed.data.mat_khau_cu,
      parsed.data.mat_khau_moi
    );
    return okMsg(res, result.message);
  }
);

export const forgotPasswordAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.forgotPasswordAdmin(parsed.data.email);
    return okMsg(res, result.message, { reset_link: result.reset_link });
  }
);

export const resetPasswordAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.resetPasswordAdmin(
      parsed.data.token,
      parsed.data.mat_khau
    );
    return okMsg(res, result.message);
  }
);