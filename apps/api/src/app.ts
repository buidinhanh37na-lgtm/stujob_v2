import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import {
  apiLimiter,
  authLimiter,
  registerLimiter,
  heavyLimiter,
  chatLimiter,
} from "./middlewares/rateLimit";

import authRoutes from "./modules/auth/auth.routes";
import studentProfileRoutes from "./modules/student/profile.routes";
import studentCertificatesRoutes from "./modules/student/certificates.routes";
import studentScheduleRoutes from "./modules/student/schedule.routes";
import studentJobsRoutes from "./modules/student/jobs.routes";
import studentApplicationsRoutes from "./modules/student/applications.routes";
import studentInvitationsRoutes from "./modules/student/invitations.routes";
import studentTasksRoutes from "./modules/student/tasks.routes";
import studentWalletRoutes from "./modules/student/wallet.routes";
import studentChatRoutes from "./modules/student/chat.routes";
import studentVerifyRoutes from "./modules/student/verify.routes";
import studentNotificationsRoutes from "./modules/student/notifications.routes";

import employerDashboardRoutes from "./modules/employer/dashboard.routes";
import employerProfileRoutes from "./modules/employer/profile.routes";
import employerTemplatesRoutes from "./modules/employer/templates.routes";
import employerPostJobRoutes from "./modules/employer/post-job.routes";
import employerMyJobsRoutes from "./modules/employer/my-jobs.routes";
import employerCandidatesRoutes from "./modules/employer/candidates.routes";
import employerApplicationsRoutes from "./modules/employer/applications.routes";
import employerEscrowRoutes from "./modules/employer/escrow.routes";
import employerAcceptanceRoutes from "./modules/employer/acceptance.routes";
import employerRatingsRoutes from "./modules/employer/ratings.routes";
import employerReportsRoutes from "./modules/employer/reports.routes";
import employerMessagesRoutes from "./modules/employer/messages.routes";
import employerNotificationsRoutes from "./modules/employer/notifications.routes";

import adminDashboardRoutes from "./modules/admin/dashboard.routes";
import adminVerifyRoutes from "./modules/admin/verify.routes";
import adminModerationRoutes from "./modules/admin/moderation.routes";
import adminUsersRoutes from "./modules/admin/users.routes";
import adminSvTruongRoutes from "./modules/admin/sv-truong.routes";
import adminComplaintsRoutes from "./modules/admin/complaints.routes";
import adminRefundsRoutes from "./modules/admin/refunds.routes";
import adminRevenueRoutes from "./modules/admin/revenue.routes";
import adminConnectionsRoutes from "./modules/admin/connections.routes";
import adminLogsRoutes from "./modules/admin/logs.routes";
import adminSettingsRoutes from "./modules/admin/settings.routes";
import adminAdminsRoutes from "./modules/admin/admins.routes";
import adminNotificationsRoutes from "./modules/admin/notifications.routes";
import adminJobsRoutes from "./modules/admin/jobs.routes";

import chatbotRoutes from "./modules/chatbot/chatbot.routes";

const IS_PROD = process.env.NODE_ENV === "production";

const app = express();

// ============================================================
// TRUST PROXY — đọc đúng IP khi qua Nginx/Cloudflare
// ============================================================
app.set("trust proxy", 1);

// ============================================================
// SECURITY + BODY
// ============================================================
app.use(
  helmet({
    contentSecurityPolicy: IS_PROD
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", env.WEB_URL],
          },
        }
      : false, // Dev tắt CSP cho dễ debug
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Cho phép serve /uploads cross-origin
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: false,
  })
);
app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ============================================================
// GLOBAL RATE LIMIT — áp cho TOÀN BỘ /api
// ============================================================
app.use("/api", apiLimiter);

// ============================================================
// HEALTH
// ============================================================
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Stujob API dang chay",
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

app.get("/api/db-test", async (_req, res) => {
  try {
    const count = await prisma.sinh_vien.count();
    res.json({
      success: true,
      message: "Ket noi MySQL OK",
      sinhVienCount: count,
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    res.status(500).json({
      success: false,
      message: "Loi DB: " + e.message,
    });
  }
});

// ============================================================
// AUTH LIMITERS — chống brute force (đặt TRƯỚC authRoutes)
// ============================================================
app.use("/api/auth/student/register", registerLimiter);
app.use("/api/auth/employer/register", registerLimiter);
app.use("/api/auth/student/login", authLimiter);
app.use("/api/auth/employer/login", authLimiter);
app.use("/api/auth/admin/login", authLimiter);
app.use("/api/auth/student/forgot", authLimiter);
app.use("/api/auth/employer/forgot", authLimiter);
app.use("/api/auth/admin/forgot", authLimiter);

app.use("/api/auth", authRoutes);

// ============================================================
// STUDENT
// ============================================================
app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/student/certificates", studentCertificatesRoutes);
app.use("/api/student/schedule", studentScheduleRoutes);
app.use("/api/student/jobs", studentJobsRoutes);
app.use("/api/student/applications", studentApplicationsRoutes);
app.use("/api/student/invitations", studentInvitationsRoutes);
app.use("/api/student/tasks", studentTasksRoutes);
app.use("/api/student/wallet", studentWalletRoutes);
app.use("/api/student/chat", studentChatRoutes);
app.use("/api/student/notifications", studentNotificationsRoutes);
app.use("/api/student/verify", heavyLimiter, studentVerifyRoutes);

// ============================================================
// EMPLOYER
// ============================================================
app.use("/api/employer/dashboard", employerDashboardRoutes);
app.use("/api/employer/profile", employerProfileRoutes);
app.use("/api/employer/templates", employerTemplatesRoutes);
app.use("/api/employer/post-job", employerPostJobRoutes);
app.use("/api/employer/my-jobs", employerMyJobsRoutes);
app.use("/api/employer/candidates", employerCandidatesRoutes);
app.use("/api/employer/applications", employerApplicationsRoutes);
app.use("/api/employer/escrow", employerEscrowRoutes);
app.use("/api/employer/acceptance", employerAcceptanceRoutes);
app.use("/api/employer/ratings", employerRatingsRoutes);
app.use("/api/employer/reports", employerReportsRoutes);
app.use("/api/employer/messages", employerMessagesRoutes);
app.use("/api/employer/notifications", employerNotificationsRoutes);

// ============================================================
// ADMIN
// ============================================================
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/verify", adminVerifyRoutes);
app.use("/api/admin/moderation", adminModerationRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/sv-truong", adminSvTruongRoutes);
app.use("/api/admin/complaints", adminComplaintsRoutes);
app.use("/api/admin/refunds", adminRefundsRoutes);
app.use("/api/admin/revenue", adminRevenueRoutes);
app.use("/api/admin/connections", adminConnectionsRoutes);
app.use("/api/admin/logs", adminLogsRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/admins", adminAdminsRoutes);
app.use("/api/admin/notifications", adminNotificationsRoutes);
app.use("/api/admin/jobs", adminJobsRoutes);

// ============================================================
// CHATBOT — áp chatLimiter riêng
// ============================================================
app.use("/api/chatbot", chatLimiter, chatbotRoutes);

// ============================================================
// STATIC UPLOADS
// ============================================================
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "../../../uploads"))
);

// ============================================================
// 404 + ERROR HANDLER (LUÔN Ở CUỐI)
// ============================================================
app.use(notFound);
app.use(errorHandler);

export default app;