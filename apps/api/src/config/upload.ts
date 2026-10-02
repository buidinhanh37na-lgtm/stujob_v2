    import multer from "multer";
import path from "path";
import fs from "fs";

// Thư mục gốc uploads (tương đối từ apps/api)
const UPLOAD_ROOT = path.resolve(__dirname, "../../../../uploads");

// Đảm bảo folder tồn tại
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ============================================================
// Storage cho chứng chỉ
// ============================================================
const certificateStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_ROOT, "certificates");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = (_req as any).user?.userId || "anon";
    const filename = `cc_${userId}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// ============================================================
// File filter — chỉ chấp nhận ảnh/PDF
// ============================================================
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.includes(ext) && ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP) hoặc PDF"));
  }
}

// ============================================================
// Export multer instance
// ============================================================
export const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Export đường dẫn uploads root
export { UPLOAD_ROOT };