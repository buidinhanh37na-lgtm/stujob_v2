import sharp from "sharp";
import path from "path";
import { UPLOAD_DIRS, UPLOAD_ROOT, ensureDir } from "../../config/upload";

export interface ImagePreviewResult {
  previewPath: string;
  width: number;
  height: number;
  size: number;
}

const MAX_WIDTH = 800;

/**
 * Tạo preview ảnh: resize max 800px + watermark "PREVIEW" chéo
 * @returns previewPath — relative từ repo root: "uploads/previews/pre_xxx.jpg"
 */
export async function makeImagePreview(
  inputPath: string,
  originalName: string
): Promise<ImagePreviewResult> {
  ensureDir(UPLOAD_DIRS.previews);

  const baseName = path.basename(originalName, path.extname(originalName));
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
  const previewName = `pre_${Date.now()}_${safeBase}.jpg`;
  const previewAbsPath = path.join(UPLOAD_DIRS.previews, previewName);

  const image = sharp(inputPath).rotate(); // auto rotate theo EXIF
  const metadata = await image.metadata();
  const origWidth = metadata.width || MAX_WIDTH;
  const targetWidth = Math.min(MAX_WIDTH, origWidth);

  // Watermark SVG chéo
  const watermarkHeight = 240;
  const svgWatermark = `
    <svg width="${targetWidth}" height="${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="50%" font-family="Arial, sans-serif"
        font-size="42" font-weight="bold" fill="rgba(255,255,255,0.55)"
        stroke="rgba(0,0,0,0.15)" stroke-width="1"
        text-anchor="middle" dominant-baseline="middle"
        transform="rotate(-30, ${targetWidth / 2}, ${watermarkHeight / 2})">
        PREVIEW
      </text>
    </svg>
  `;

  const result = await image
    .resize(targetWidth, null, { withoutEnlargement: true })
    .composite([{ input: Buffer.from(svgWatermark), gravity: "center" }])
    .jpeg({ quality: 80, progressive: true })
    .toFile(previewAbsPath);

  const repoRoot = path.resolve(UPLOAD_ROOT, "..");
  const relativePath = path.relative(repoRoot, previewAbsPath).replace(/\\/g, "/");

  return {
    previewPath: relativePath,
    width: result.width,
    height: result.height,
    size: result.size,
  };
}