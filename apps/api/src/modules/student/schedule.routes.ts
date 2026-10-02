import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireStudent } from "../../middlewares/requireAuth";
import * as ctrl from "./schedule.controller";

const router = Router();

const tmpDir = path.resolve(__dirname, "../../../../uploads/tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const uploadCSV = multer({
  dest: tmpDir,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file CSV"));
    }
  },
});

// Template (public)
router.get("/template", ctrl.downloadTemplate);

// Schedule CRUD
router.get("/", requireStudent, ctrl.getSchedule);
router.post("/", requireStudent, ctrl.createSchedule);
router.delete("/all", requireStudent, ctrl.deleteAllSchedule);
router.delete("/:id", requireStudent, ctrl.deleteSchedule);
router.post(
  "/import",
  requireStudent,
  uploadCSV.single("file"),
  ctrl.importSchedule
);

// Free time
router.get("/free-time", requireStudent, ctrl.getFreeTime);
router.post("/free-time", requireStudent, ctrl.createFreeTime);
router.delete("/free-time/:id", requireStudent, ctrl.deleteFreeTime);

export default router;