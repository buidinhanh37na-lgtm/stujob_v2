import { recognizeImage } from "./tesseract.client";
import { preprocessImage, cleanupTemp } from "./preprocess";
import {
  parseStudentCard,
  StudentCardParsed,
} from "./parsers/student-card";
import { parseCCCD, CCCDParsed } from "./parsers/cccd";
import {
  parseEmployerDoc,
  EmployerDocParsed,
} from "./parsers/employer-doc";

export { terminateOCRWorker } from "./tesseract.client";

/**
 * Quét thẻ sinh viên
 */
export async function scanStudentCard(
  imagePath: string
): Promise<{ raw: string; parsed: StudentCardParsed }> {
  const tmpPath = await preprocessImage(imagePath);
  try {
    const raw = await recognizeImage(tmpPath);
    return { raw, parsed: parseStudentCard(raw) };
  } finally {
    await cleanupTemp(tmpPath);
  }
}

/**
 * Quét CCCD
 */
export async function scanCCCD(
  imagePath: string
): Promise<{ raw: string; parsed: CCCDParsed }> {
  const tmpPath = await preprocessImage(imagePath);
  try {
    const raw = await recognizeImage(tmpPath);
    return { raw, parsed: parseCCCD(raw) };
  } finally {
    await cleanupTemp(tmpPath);
  }
}

/**
 * Quét giấy tờ employer (CCCD / MST / HKD)
 */
export async function scanEmployerDoc(
  imagePath: string,
  loai: "ca_nhan" | "ho_kinh_doanh" | "doanh_nghiep"
): Promise<{ raw: string; parsed: EmployerDocParsed }> {
  const tmpPath = await preprocessImage(imagePath);
  try {
    const raw = await recognizeImage(tmpPath);
    return { raw, parsed: parseEmployerDoc(raw, loai) };
  } finally {
    await cleanupTemp(tmpPath);
  }
}