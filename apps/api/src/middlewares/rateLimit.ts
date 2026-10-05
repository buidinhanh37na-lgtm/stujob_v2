import rateLimit from "express-rate-limit";

/**
 * Login/Forgot — chống brute-force
 * 5 lần / 15 phút / IP
 * Đăng nhập thành công KHÔNG đếm
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Register — chống spam tài khoản
 * 3 lần / giờ / IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Quá nhiều tài khoản được tạo. Vui lòng thử lại sau 1 giờ.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API chung — chống spam
 * 200 request / phút / IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu. Vui lòng chậm lại.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Endpoint nặng (OCR, export CSV)
 * 10 request / 5 phút / IP
 */
export const heavyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Endpoint này bị giới hạn. Vui lòng thử lại sau 5 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Chatbot AI — tránh tốn quota
 * 20 request / 10 phút / IP
 */
export const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});