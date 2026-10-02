import { Request, Response } from "express";
import { env } from "../config/env";
import { Role } from "./jwt";

const COOKIE_NAMES: Record<Role, { access: string; refresh: string }> = {
  sinh_vien: { access: "sv_access_token", refresh: "sv_refresh_token" },
  nha_tuyen_dung: { access: "ntd_access_token", refresh: "ntd_refresh_token" },
  quan_tri_vien: { access: "adm_access_token", refresh: "adm_refresh_token" },
};

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // 15 phút
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

export function setAuthCookies(
  res: Response,
  role: Role,
  accessToken: string,
  refreshToken: string
) {
  const names = COOKIE_NAMES[role];
  const isProd = env.NODE_ENV === "production";

  res.cookie(names.access, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: ACCESS_MAX_AGE_MS,
    path: "/",
  });

  res.cookie(names.refresh, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: REFRESH_MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookies(res: Response, role: Role) {
  const names = COOKIE_NAMES[role];
  res.clearCookie(names.access, { path: "/" });
  res.clearCookie(names.refresh, { path: "/" });
}

export function getAccessToken(req: Request, role: Role): string | undefined {
  return req.cookies[COOKIE_NAMES[role].access];
}

export function getRefreshToken(req: Request, role: Role): string | undefined {
  return req.cookies[COOKIE_NAMES[role].refresh];
}

export { COOKIE_NAMES };