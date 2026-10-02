import { Response } from "express";

export function ok<T>(res: Response, data: T, message?: string) {
  return res.json({
    success: true,
    message,
    ...data,
  });
}

export function okMsg(res: Response, message: string, extra?: object) {
  return res.json({
    success: true,
    message,
    ...extra,
  });
}

export function fail(
  res: Response,
  message: string,
  status = 400,
  extra?: object
) {
  return res.status(status).json({
    success: false,
    message,
    ...extra,
  });
}