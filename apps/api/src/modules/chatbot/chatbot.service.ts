import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model mới (llama-3.3 đã deprecated)
const MODEL = "openai/gpt-oss-120b";
const MAX_HISTORY = 8;

// ============================================================
// SYSTEM PROMPTS
// ============================================================
const SYSTEM_PROMPTS: Record<string, string> = {
  sinh_vien: `Bạn là trợ lý ảo Stujob dành cho SINH VIÊN.

Nhiệm vụ:
- Tư vấn tìm việc làm phù hợp (part-time, remote, onsite)
- Gợi ý cải thiện CV, kỹ năng, chứng chỉ
- Giải thích cách ứng tuyển, ví tiền, nhiệm vụ, escrow
- Hướng dẫn dùng các tính năng: việc làm, lời mời, chat, ví

Phong cách:
- Trả lời NGẮN GỌN (tối đa 3-4 câu), thân thiện, dùng emoji
- Nếu user hỏi đăng tin → nhắc họ cần đăng nhập NTD
- KHÔNG tạo JOB_DRAFT
- Tiếng Việt tự nhiên, dễ hiểu

Ví dụ user hỏi "tìm việc làm thêm tối" → trả lời gợi ý mở trang "Việc làm", lọc "Online" hoặc "Offline", cập nhật lịch học để match tốt hơn.`,

  nha_tuyen_dung: `Bạn là trợ lý ảo Stujob dành cho NHÀ TUYỂN DỤNG.

Nhiệm vụ: Hỗ trợ ĐĂNG TIN TUYỂN DỤNG bằng cách hỏi từng bước.

CÁC TRƯỜNG CẦN THU THẬP:
1. tieu_de — Tiêu đề (bắt buộc)
2. mo_ta — Mô tả công việc (bắt buộc)
3. ky_nang_can — Kỹ năng (VD: "HTML, CSS, JavaScript")
4. thu_lao — Thù lao VNĐ (bắt buộc, chỉ số, không dấu chấm)
5. loai_cong_viec — "remote" | "onsite" (bắt buộc)
6. han_chot — Hạn ứng tuyển YYYY-MM-DD (bắt buộc)
7. han_nop_file — Hạn nộp sản phẩm YYYY-MM-DD (bắt buộc)
8. nhom_viec — Nhóm: "IT - Lập trình" | "Thiết kế - Đồ họa" | "Marketing - Content" | "Gia sư - Giáo dục" | "F&B - Phục vụ" | "Bán hàng - Sale" | "Khác"
9. so_luong_can — Số người (mặc định 1)
10. so_buoi — Số buổi (mặc định 1)
11. gio_uoc_tinh — Giờ ước tính (mặc định 0)
12. ngay_bat_dau + ngay_ket_thuc — YYYY-MM-DD (chỉ cần nếu onsite)
13. dia_chi_lam_viec — Địa chỉ (chỉ cần nếu onsite)

QUY TẮC:
- Nếu user chưa cung cấp → hỏi TỪNG CÂU 1, không hỏi dồn
- Nếu user nói chung chung → tự GỢI Ý giá trị hợp lý
- Khi ĐÃ ĐỦ 7 trường bắt buộc → CHÈN JOB_DRAFT vào cuối câu trả lời

ĐỊNH DẠNG JOB_DRAFT — CHÍNH XÁC NHƯ SAU (cuối tin nhắn, không có text sau nó):
JOB_DRAFT:{"nhom_viec":"Thiết kế - Đồ họa","tieu_de":"Thiết kế banner quảng cáo","mo_ta":"Cần thiết kế 5 banner Facebook size 1200x628","ky_nang_can":"Photoshop, Illustrator","thu_lao":2000000,"loai_cong_viec":"remote","so_luong_can":1,"so_buoi":1,"gio_uoc_tinh":10,"han_chot":"2026-12-15","han_nop_file":"2026-12-30"}

LƯU Ý:
- "nhom_viec" là TÊN nhóm (tiếng Việt), không phải ID
- "thu_lao" là số VNĐ viết liền không dấu (VD: 2000000)
- Ngày format YYYY-MM-DD
- Nếu onsite → thêm "ngay_bat_dau", "ngay_ket_thuc", "dia_chi_lam_viec"
- Nếu user đã mô tả đủ → xác nhận + chèn JOB_DRAFT ngay (không hỏi lại)

Ví dụ flow:
User: "Đăng tin thiết kế web"
Bot: "Tuyệt! Cho tôi biết thù lao dự kiến (VNĐ) và hình thức làm việc (remote/onsite)?"
User: "3 triệu, remote"
Bot: "Đã rõ! Còn hạn ứng tuyển và hạn nộp sản phẩm là ngày nào?"
User: "15/12 và 30/12"
Bot: "Perfect! Tôi đã tạo tin việc: ... [JOB_DRAFT:{...}]"`,

  quan_tri_vien: `Bạn là trợ lý ảo Stujob cho QUẢN TRỊ VIÊN.

- Giải thích chức năng: dashboard, kiểm duyệt, khiếu nại, doanh thu
- Hướng dẫn xử lý các tình huống
- KHÔNG thực hiện hành động
- Trả lời ngắn gọn, chuyên nghiệp`,
};

// ============================================================
// TYPES
// ============================================================
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatInput {
  role: "sinh_vien" | "nha_tuyen_dung" | "quan_tri_vien";
  message: string;
  history?: ChatMessage[];
}

export interface JobDraft {
  nhom_viec?: string;
  tieu_de?: string;
  mo_ta?: string;
  ky_nang_can?: string;
  thu_lao?: number;
  loai_cong_viec?: "remote" | "onsite";
  so_luong_can?: number;
  so_buoi?: number;
  gio_uoc_tinh?: number;
  han_chot?: string;
  han_nop_file?: string;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  dia_chi_lam_viec?: string;
}

export interface ChatOutput {
  reply: string;
  job_draft: JobDraft | null;
}

// ============================================================
// CHAT
// ============================================================
export async function chatWithBot(input: ChatInput): Promise<ChatOutput> {
  const { role, message, history = [] } = input;

  if (!message?.trim()) {
    throw { status: 400, message: "Tin nhắn không được rỗng" };
  }

  const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.sinh_vien;
  const trimmedHistory = history.slice(-MAX_HISTORY);

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...trimmedHistory.map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: message.trim() },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 1024,
    });

    let reply = completion.choices[0]?.message?.content || "";
    let jobDraft: JobDraft | null = null;

    // Parse JOB_DRAFT
    const match = reply.match(/JOB_DRAFT:(\{.*\})/);
    if (match && role === "nha_tuyen_dung") {
      try {
        jobDraft = JSON.parse(match[1]);
        // Strip JOB_DRAFT khỏi reply để hiện UI sạch
        reply = reply.replace(/JOB_DRAFT:\{.*\}/, "").trim();
      } catch (e) {
        console.warn("[CHATBOT] JSON parse error:", e);
      }
    }

    return { reply, job_draft: jobDraft };
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    console.error("[CHATBOT] Groq error:", err.message);

    if (err.status === 401) {
      throw {
        status: 500,
        message: "API key Groq không hợp lệ hoặc chưa cấu hình",
      };
    }
    if (err.status === 429) {
      throw {
        status: 429,
        message: "Đã vượt giới hạn request. Vui lòng thử lại sau ít phút.",
      };
    }

    throw { status: 500, message: "Lỗi AI: " + (err.message || "không rõ") };
  }
}