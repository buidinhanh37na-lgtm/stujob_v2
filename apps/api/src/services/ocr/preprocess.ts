import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIRS, ensureDir } from "../../config/upload";

/**
 * Tiền xử lý ảnh trước khi OCR:
 * - Resize min 2000px width
 * - Grayscale
 * - Normalize contrast
 * - Sharpen nhẹ
 * Trả về path file PNG tạm
 */
export async function preprocessImage(inputPath: string): Promise<string> {
  ensureDir(UPLOAD_DIRS.tmp);

  const outPath = path.join(
    UPLOAD_DIRS.tmp,
    `ocr_${Date.now()}_${path.basename(inputPath, path.extname(inputPath))}.png`
  );

  const meta = await sharp(inputPath).metadata();
  const origWidth = meta.width || 0;
  const targetWidth = Math.max(2000, origWidth);

  await sharp(inputPath)
    .rotate() // auto EXIF
    .resize(targetWidth, null, { withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1 })
    .png({ compressionLevel: 6 })
    .toFile(outPath);

  return outPath;
}

/**
 * Xóa file tạm sau khi OCR xong
 */
export async function cleanupTemp(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}