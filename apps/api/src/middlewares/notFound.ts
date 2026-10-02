import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    success: false,
    message: `Khong tim thay route: ${req.originalUrl}`,
  });
}