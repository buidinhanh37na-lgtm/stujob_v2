import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIRS, UPLOAD_ROOT, ensureDir } from "../../config/upload";

export interface PdfPreviewResult {
  previewPath: string;
  totalPages: number;
  previewPages: number;
}

/**
 * Tạo preview PDF: chỉ copy N trang đầu + watermark chéo
 */
export async function makePdfPreview(
  inputPath: string,
  originalName: string,
  maxPages: number = 3
): Promise<PdfPreviewResult> {
  ensureDir(UPLOAD_DIRS.previews);

  const buffer = await fs.readFile(inputPath);
  const srcDoc = await PDFDocument.load(buffer, {
    ignoreEncryption: true,
  });
  const totalPages = srcDoc.getPageCount();
  const previewCount = Math.min(maxPages, totalPages);

  const newDoc = await PDFDocument.create();
  const font = await newDoc.embedFont(StandardFonts.HelveticaBold);

  // Copy N trang đầu
  const pageIndices = Array.from({ length: previewCount }, (_, i) => i);
  const copied = await newDoc.copyPages(srcDoc, pageIndices);
  for (const p of copied) newDoc.addPage(p);

  // Watermark từng trang
  const text = "PREVIEW";
  const fontSize = 60;
  const textWidth = font.widthOfTextAtSize(text, fontSize);

  for (const page of newDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - 20,
      size: fontSize,
      font,
      color: rgb(0.85, 0.85, 0.85),
      opacity: 0.4,
      rotate: degrees(-30),
    });
  }

  const baseName = path.basename(originalName, path.extname(originalName));
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const previewName = `pre_${Date.now()}_${safeBase}.pdf`;
  const previewAbsPath = path.join(UPLOAD_DIRS.previews, previewName);

  const bytes = await newDoc.save();
  await fs.writeFile(previewAbsPath, bytes);

  const repoRoot = path.resolve(UPLOAD_ROOT, "..");
  const relativePath = path.relative(repoRoot, previewAbsPath).replace(/\\/g, "/");

  return {
    previewPath: relativePath,
    totalPages,
    previewPages: previewCount,
  };
}