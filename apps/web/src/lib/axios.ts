import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// Auto refresh token khi gặp 401
// ============================================================
// QUAN TRỌNG:
// - KHÔNG trigger refresh cho endpoint /auth/* (vì 401 ở đây là bình thường
//   khi user chưa login, hoặc login/register sai thông tin)
// - CHỈ trigger refresh cho các API cần auth thực sự (wallet, jobs, ...)
// ============================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(undefined);
  });
  failedQueue = [];
};

/** Kiểm tra URL có phải endpoint auth hay không */
function isAuthEndpoint(url: string): boolean {
  return url.includes("/api/auth/") || url.startsWith("/api/auth");
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";

    // ============================================================
    // KHÔNG refresh cho endpoint auth
    // (login, register, forgot, reset, logout, me, refresh)
    // → Trả lỗi thẳng cho caller xử lý
    // ============================================================
    if (isAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    // ============================================================
    // Với API khác: nếu 401 → thử refresh (chỉ 1 lần cho mỗi request)
    // ============================================================
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Có request khác đang refresh → xếp hàng chờ
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Thử refresh: role nào có cookie thì thành công
        // (không trigger interceptor cho chính các request refresh này
        //  vì chúng là /auth/* → đã return sớm ở trên)
        let refreshed = false;
        for (const role of ["student", "employer", "admin"]) {
          try {
            await axios.post(
              `${API_URL}/api/auth/${role}/refresh`,
              {},
              { withCredentials: true }
            );
            refreshed = true;
            break;
          } catch {
            // Thử role tiếp theo
          }
        }

        if (!refreshed) throw new Error("Refresh failed");

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;