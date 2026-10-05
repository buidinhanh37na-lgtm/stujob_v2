import { createWorker, Worker } from "tesseract.js";

let workerCache: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

/**
 * Lazy init + cache worker (load langs 1 lần, dùng nhiều request)
 * Lần đầu mất ~10-20s để download trained data. Sau đó instant.
 */
export async function getOCRWorker(): Promise<Worker> {
  if (workerCache) return workerCache;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    const worker = await createWorker(["vie", "eng"]);
    workerCache = worker;
    return worker;
  })();

  return workerInitPromise;
}

/**
 * Nhận dạng text từ ảnh
 */
export async function recognizeImage(imagePath: string): Promise<string> {
  const worker = await getOCRWorker();
  const { data } = await worker.recognize(imagePath);
  return data.text || "";
}

/**
 * Giải phóng worker (dùng khi shutdown server)
 */
export async function terminateOCRWorker() {
  if (workerCache) {
    await workerCache.terminate();
    workerCache = null;
    workerInitPromise = null;
  }
}