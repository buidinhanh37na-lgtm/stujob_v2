import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  errors?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[Error]", err);

  // ============================================================
  // RATE LIMIT — 429
  // ============================================================
  if (err.status === 429 || err.statusCode === 429) {
    return res.status(429).json({
      success: false,
      message:
        err.message || "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
    });
  }

  // ============================================================
  // ZOD VALIDATION — 400
  // ============================================================
  if (err instanceof ZodError) {
    const first = err.errors[0];
    return res.status(400).json({
      success: false,
      message: first?.message || "Dữ liệu không hợp lệ",
      errors: err.errors,
    });
  }

  // ============================================================
  // MULTER — file upload errors
  // ============================================================
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File quá lớn",
    });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "File không hợp lệ",
    });
  }

  // ============================================================
  // PRISMA — common errors
  // ============================================================
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Dữ liệu đã tồn tại (trùng khóa)",
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy dữ liệu",
    });
  }

  // ============================================================
  // DEFAULT — dùng status có sẵn hoặc 500
  // ============================================================
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Lỗi máy chủ";

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}