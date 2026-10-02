import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyAccessToken, Role } from "../utils/jwt";
import { getAccessToken } from "../utils/cookie";
import { fail } from "../utils/response";

/**
 * Middleware kiểm tra đăng nhập theo vai trò.
 * Dùng cookie riêng cho từng role.
 */
export function requireAuth(role: Role): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = getAccessToken(req, role);
    if (!token) {
      return fail(res, "Chưa đăng nhập", 401);
    }

    try {
      const payload = verifyAccessToken(token);
      if (payload.role !== role) {
        return fail(res, "Sai vai trò", 403);
      }
      req.user = payload;
      next();
    } catch {
      return fail(res, "Token hết hạn hoặc không hợp lệ", 401);
    }
  };
}

/**
 * Middleware optional — có token thì set req.user, không có thì bỏ qua.
 * Dùng cho các endpoint public nhưng cần biết user đã đăng nhập chưa.
 */
export function optionalAuth(role: Role): RequestHandler {
  return (req, _res, next) => {
    const token = getAccessToken(req, role);
    if (token) {
      try {
        req.user = verifyAccessToken(token);
      } catch {
        // Ignore
      }
    }
    next();
  };
}

// Shortcut 3 role
export const requireStudent = requireAuth("sinh_vien");
export const requireEmployer = requireAuth("nha_tuyen_dung");
export const requireAdmin = requireAuth("quan_tri_vien");