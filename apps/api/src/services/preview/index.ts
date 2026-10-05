import path from "path";
import { makeImagePreview } from "./image.processor";
import { makePdfPreview } from "./pdf.processor";
import { IMAGE_EXTS, PDF_EXTS } from "../../config/upload";

export { makeImagePreview, makePdfPreview };

export interface PreviewResult {
  previewPath: string | null;
  kind: "image" | "pdf" | "none";
  totalPages?: number;
  previewPages?: number;
  error?: string;
}

/**
 * Universal preview dispatcher — tự detect loại file
 */
export async function makePreview(
  inputPath: string,
  originalName: string
): Promise<PreviewResult> {
  const ext = path.extname(originalName).toLowerCase();

  try {
    if (IMAGE_EXTS.includes(ext)) {
      const r = await makeImagePreview(inputPath, originalName);
      return { previewPath: r.previewPath, kind: "image" };
    }

    if (PDF_EXTS.includes(ext)) {
      const r = await makePdfPreview(inputPath, originalName, 3);
      return {
        previewPath: r.previewPath,
        kind: "pdf",
        totalPages: r.totalPages,
        previewPages: r.previewPages,
      };
    }

    return {
      previewPath: null,
      kind: "none",
      error: "Định dạng không hỗ trợ preview",
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[PREVIEW] Error:", err.message);
    return {
      previewPath: null,
      kind: "none",
      error: err.message || "Lỗi tạo preview",
    };
  }
}