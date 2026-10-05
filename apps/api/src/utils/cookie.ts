import { Response, Request } from "express";

type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

const IS_PROD = process.env.NODE_ENV === "production";

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 phút
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 ngày

/**
 * Set cả access + refresh token cookie
 * Cookie name: access_token_<role>, refresh_token_<role>
 */
export function setAuthCookies(
  res: Response,
  role: Role,
  accessToken: string,
  refreshToken: string
) {
  const baseOptions = {
    httpOnly: true,
    secure: IS_PROD, // HTTPS only ở production
    sameSite: "lax" as const, // chống CSRF cơ bản
    path: "/",
  };

  res.cookie(`access_token_${role}`, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_MAX_AGE,
  });

  res.cookie(`refresh_token_${role}`, refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

/**
 * Xóa cả 2 cookie khi logout
 */
export function clearAuthCookies(res: Response, role: Role) {
  const opts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    path: "/",
  };
  res.clearCookie(`access_token_${role}`, opts);
  res.clearCookie(`refresh_token_${role}`, opts);
}

/**
 * Lấy access token từ cookie theo role
 */
export function getAccessToken(req: Request, role: Role): string | null {
  return req.cookies?.[`access_token_${role}`] || null;
}

/**
 * Lấy refresh token
 */
export function getRefreshToken(req: Request, role: Role): string | null {
  return req.cookies?.[`refresh_token_${role}`] || null;
}