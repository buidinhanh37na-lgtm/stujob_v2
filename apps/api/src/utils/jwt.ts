import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type Role = "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";

export interface AccessPayload {
  userId: number;
  role: Role;
}

export interface RefreshPayload extends AccessPayload {
  type: "refresh";
}

export function signAccessToken(payload: AccessPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: AccessPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions["expiresIn"],
  };
  return jwt.sign(
    { ...payload, type: "refresh" as const },
    env.JWT_REFRESH_SECRET,
    options
  );
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}