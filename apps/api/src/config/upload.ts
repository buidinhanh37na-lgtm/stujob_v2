import multer from "multer";
import path from "path";
import fs from "fs";

// ============================================================
// PATHS
// ============================================================
export const UPLOAD_ROOT = path.resolve(__dirname, "../../../../uploads");

export const UPLOAD_DIRS = {
  certificates: path.join(UPLOAD_ROOT, "certificates"),
  submissions: path.join(UPLOAD_ROOT, "submissions"),
  previews: path.join(UPLOAD_ROOT, "previews"),
  avatars: path.join(UPLOAD_ROOT, "avatars"),
  logos: path.join(UPLOAD_ROOT, "logos"),
  tmp: path.join(UPLOAD_ROOT, "tmp"),
};

// ============================================================
// HELPERS
// ============================================================
export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Tự tạo tất cả folder khi import
Object.values(UPLOAD_DIRS).forEach(ensureDir);

// ============================================================
// MIME / EXT ALLOWLIST
// ============================================================
export const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
export const PDF_EXTS = [".pdf"];
export const PDF_MIMES = ["application/pdf"];
export const ALLOWED_EXTS = [...IMAGE_EXTS, ...PDF_EXTS];
export const ALLOWED_MIMES = [...IMAGE_MIMES, ...PDF_MIMES];

// ============================================================
// FILTER + STORAGE FACTORIES
// ============================================================
export function makeFileFilter(allowedExts: string[], allowedMimes: string[]) {
  return (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Định dạng file không được hỗ trợ"));
    }
  };
}

export function makeDiskStorage(dir: string, prefix: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const userId = (_req as { user?: { userId?: number } }).user?.userId || "anon";
      cb(null, `${prefix}_${userId}_${Date.now()}${ext}`);
    },
  });
}

// ============================================================
// PRESET MULTER INSTANCES
// ============================================================
export const uploadCertificate = multer({
  storage: makeDiskStorage(UPLOAD_DIRS.certificates, "cc"),
  fileFilter: makeFileFilter(ALLOWED_EXTS, ALLOWED_MIMES),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadSubmission = multer({
  storage: makeDiskStorage(UPLOAD_DIRS.submissions, "sp"),
  fileFilter: makeFileFilter(ALLOWED_EXTS, ALLOWED_MIMES),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

export const uploadAvatar = multer({
  storage: makeDiskStorage(UPLOAD_DIRS.avatars, "avt"),
  fileFilter: makeFileFilter(IMAGE_EXTS, IMAGE_MIMES),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadLogo = multer({
  storage: makeDiskStorage(UPLOAD_DIRS.logos, "logo"),
  fileFilter: makeFileFilter(IMAGE_EXTS, IMAGE_MIMES),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadCSV = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(UPLOAD_DIRS.tmp);
      cb(null, UPLOAD_DIRS.tmp);
    },
    filename: (_req, file, cb) => {
      cb(null, `csv_${Date.now()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file CSV"));
    }
  },
});