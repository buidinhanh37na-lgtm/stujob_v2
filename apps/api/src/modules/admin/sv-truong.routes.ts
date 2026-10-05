import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../../middlewares/requireAuth";
import * as ctrl from "./sv-truong.controller";

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

// Template public (đặt trước các route có :id)
router.get("/template", ctrl.downloadTemplate);

router.get("/", requireAdmin, ctrl.list);
router.get("/stats", requireAdmin, ctrl.getStats);
router.post("/", requireAdmin, ctrl.add);
router.post(
  "/import",
  requireAdmin,
  uploadCSV.single("file"),
  ctrl.importCsv
);
router.delete("/:id", requireAdmin, ctrl.deleteSv);

export default router;