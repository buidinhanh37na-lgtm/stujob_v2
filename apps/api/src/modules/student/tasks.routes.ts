import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./tasks.controller";

const router = Router();

const SUBMIT_DIR = path.resolve(__dirname, "../../../../uploads/submissions");
if (!fs.existsSync(SUBMIT_DIR)) fs.mkdirSync(SUBMIT_DIR, { recursive: true });

const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const uploadSubmission = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, SUBMIT_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const userId = (_req as any).user?.userId || "anon";
      cb(null, `sp_${userId}_${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext) && ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG, WEBP)"));
    }
  },
});

router.get("/", requireStudent, ctrl.listTasks);
router.post("/", requireStudent, ctrl.createTask);
router.post(
  "/:id/submit",
  requireStudent,
  uploadSubmission.single("file"),
  ctrl.submitTask
);
router.delete("/:id", requireStudent, ctrl.deleteTask);

export default router;