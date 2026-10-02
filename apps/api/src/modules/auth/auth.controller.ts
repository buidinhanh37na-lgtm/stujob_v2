import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, okMsg, fail } from "../../utils/response";
import {
  setAuthCookies,
  clearAuthCookies,
  getRefreshToken,
} from "../../utils/cookie";
import {
  registerSinhVienSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@stujob/validation";
import * as authService from "./auth.service";

const STUDENT_ROLE = "sinh_vien" as const;

// POST /api/auth/student/register
export const registerStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = registerSinhVienSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }

    const sv = await authService.registerStudent(parsed.data);
    return okMsg(res, "Đăng ký thành công", { sinh_vien: sv });
  }
);

// POST /api/auth/student/login
export const loginStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }

    const { accessToken, refreshToken, sinh_vien } =
      await authService.loginStudent(parsed.data);

    setAuthCookies(res, STUDENT_ROLE, accessToken, refreshToken);

    return okMsg(res, "Đăng nhập thành công", { sinh_vien });
  }
);

// POST /api/auth/student/logout
export const logoutStudent = asyncHandler(
  async (_req: Request, res: Response) => {
    clearAuthCookies(res, STUDENT_ROLE);
    return okMsg(res, "Đã đăng xuất");
  }
);

// POST /api/auth/student/refresh
export const refreshStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = getRefreshToken(req, STUDENT_ROLE);
    if (!refreshToken) return fail(res, "Không có refresh token", 401);

    const tokens = await authService.refreshStudentToken(refreshToken);
    setAuthCookies(res, STUDENT_ROLE, tokens.accessToken, tokens.refreshToken);

    return okMsg(res, "Đã làm mới token");
  }
);

// GET /api/auth/student/me
export const getMeStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sv = await authService.getCurrentStudent(userId);
    return ok(res, { sinh_vien: sv });
  }
);

// POST /api/auth/student/forgot
export const forgotPasswordStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }

    const result = await authService.forgotPasswordStudent(parsed.data.email);
    return okMsg(res, result.message, { reset_link: result.reset_link });
  }
);

// POST /api/auth/student/reset
export const resetPasswordStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ");
    }

    const result = await authService.resetPasswordStudent(
      parsed.data.token,
      parsed.data.mat_khau
    );
    return okMsg(res, result.message);
  }
);