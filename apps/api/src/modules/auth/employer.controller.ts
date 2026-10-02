import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshToken,
} from "../../utils/cookie";
import {
  registerEmployerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@stujob/validation";
import * as svc from "./employer.service";

const ROLE = "nha_tuyen_dung" as const;

export const registerEmployer = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = registerEmployerSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const ntd = await svc.registerEmployer(parsed.data);
    return okMsg(res, "Đăng ký thành công", { nha_tuyen_dung: ntd });
  }
);

export const loginEmployer = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const { accessToken, refreshToken, nha_tuyen_dung } =
      await svc.loginEmployer(parsed.data);

    setAuthCookies(res, ROLE, accessToken, refreshToken);
    return okMsg(res, "Đăng nhập thành công", { nha_tuyen_dung });
  }
);

export const logoutEmployer = asyncHandler(
  async (_req: Request, res: Response) => {
    clearAuthCookies(res, ROLE);
    return okMsg(res, "Đã đăng xuất");
  }
);

export const refreshEmployer = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = getRefreshToken(req, ROLE);
    if (!refreshToken) return fail(res, "Không có refresh token", 401);

    const tokens = await svc.refreshEmployerToken(refreshToken);
    setAuthCookies(res, ROLE, tokens.accessToken, tokens.refreshToken);
    return okMsg(res, "Đã làm mới token");
  }
);

export const getMeEmployer = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const ntd = await svc.getCurrentEmployer(userId);
    return ok(res, { nha_tuyen_dung: ntd });
  }
);

export const forgotPasswordEmployer = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.forgotPasswordEmployer(parsed.data.email);
    return okMsg(res, result.message, { reset_link: result.reset_link });
  }
);

export const resetPasswordEmployer = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }
    const result = await svc.resetPasswordEmployer(
      parsed.data.token,
      parsed.data.mat_khau
    );
    return okMsg(res, result.message);
  }
);