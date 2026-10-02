import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import studentProfileRoutes from "./modules/student/profile.routes";
import studentCertificatesRoutes from "./modules/student/certificates.routes";
import path from "path";
import studentScheduleRoutes from "./modules/student/schedule.routes";
import studentJobsRoutes from "./modules/student/jobs.routes";
import studentApplicationsRoutes from "./modules/student/applications.routes";
import studentInvitationsRoutes from "./modules/student/invitations.routes";
import studentTasksRoutes from "./modules/student/tasks.routes";


const app = express();

app.use(helmet());
app.use(cors({ origin: env.WEB_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Loi DB: " + err.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/uploads", express.static(path.resolve(__dirname, "../../../uploads")));
app.use("/api/student/schedule", studentScheduleRoutes);
app.use("/api/student/jobs", studentJobsRoutes);
app.use("/api/student/applications", studentApplicationsRoutes);
app.use("/api/student/invitations", studentInvitationsRoutes);
app.use("/api/student/tasks", studentTasksRoutes);
app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/student/certificates", studentCertificatesRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;