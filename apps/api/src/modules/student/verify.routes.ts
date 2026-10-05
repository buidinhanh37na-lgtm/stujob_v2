import { Router } from "express";
import multer from "multer";
import {
  requireStudent,
} from "../../middlewares/requireAuth";
import {
  UPLOAD_DIRS,
  ensureDir,
  makeFileFilter,
  IMAGE_EXTS,
  IMAGE_MIMES,
} from "../../config/upload";
import * as ctrl from "./verify.controller";

const router = Router();

// Multer instance riêng cho verify (chỉ ảnh, max 8MB)
const uploadVerifyImage = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(UPLOAD_DIRS.tmp);
      cb(null, UPLOAD_DIRS.tmp);
    },
    filename: (_req, file, cb) => {
      const ext = file.originalname.split(".").pop() || "jpg";
      cb(null, `verify_${Date.now()}.${ext}`);
    },
  }),
  fileFilter: makeFileFilter(IMAGE_EXTS, IMAGE_MIMES),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post(
  "/",
  requireStudent,
  uploadVerifyImage.single("image"),
  ctrl.verify
);

export default router;