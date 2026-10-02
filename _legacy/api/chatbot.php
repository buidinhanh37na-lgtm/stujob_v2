<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';

$d = body();
$message = trim($d['message'] ?? '');
$history = $d['history'] ?? [];
if (!$message)
    json_out(['success' => false, 'message' => 'Câu hỏi rỗng']);

/* ============ TỰ PHÁT HIỆN ROLE ============ */
if (!empty($_SESSION['sinh_vien_id'])) {
    $role = 'sinh_vien';
    $userId = $_SESSION['sinh_vien_id'];
} elseif (!empty($_SESSION['nha_tuyen_dung_id'])) {
    $role = 'nha_tuyen_dung';
    $userId = $_SESSION['nha_tuyen_dung_id'];
} elseif (!empty($_SESSION['admin_id'])) {
    $role = 'admin';
    $userId = $_SESSION['admin_id'];
} else {
    $role = 'guest';
    $userId = null;
}

/* ============================================================
   HÀM PHÁT HIỆN NHÓM VIỆC + TẠO JSON MẪU
   ============================================================ */
function detectJobCategory($text) {
    $text = mb_strtolower($text, 'UTF-8');

    $categories = [
        'Gia sư - Giáo dục' => [
            'gia sư','dạy kèm','dạy thêm','gia sư toán','dạy toán','dạy lý','dạy hóa','dạy văn',
            'dạy anh','tiếng anh','trợ giảng','giáo viên','học sinh','lớp','môn học'
        ],
        'IT - Lập trình' => [
            'web','lập trình','code','it','frontend','backend','fullstack','react','php','python',
            'node','developer','dev','software','app','mobile','database','api','html','css','javascript'
        ],
        'Thiết kế - Đồ họa' => [
            'thiết kế','design','designer','poster','logo','banner','photoshop','illustrator',
            'figma','canva','đồ họa','mỹ thuật','đồ hoạ'
        ],
        'Marketing - Content' => [
            'marketing','content','quảng cáo','seo','viết bài','fanpage','social','facebook','tiktok',
            'pr','truyền thông','quảng bá','seeding'
        ],
        'Bán hàng - Sale' => [
            'bán hàng','sale','nhân viên bán','chốt đơn','tư vấn bán','kinh doanh','online sale'
        ],
        'F&B - Phục vụ' => [
            'phục vụ','cafe','cà phê','trà sữa','nhà hàng','quán','bếp','đầu bếp','order',
            'pha chế','barista','f&b','food'
        ],
        'Giao hàng - Vận chuyển' => [
            'giao hàng','ship','vận chuyển','shipper','chạy xe','giao nhận','tài xế'
        ],
    ];

    foreach ($categories as $catName => $keywords) {
        foreach ($keywords as $kw) {
            if (mb_strpos($text, $kw) !== false) {
                return $catName;
            }
        }
    }
    return null;
}

/* ⭐ Phát hiện ý định đăng tin chung chung */
function detectJobIntent($text) {
    $text = mb_strtolower($text, 'UTF-8');
    $patterns = '/(gợi ý|điền form|điền giúp|đăng tin|tạo tin|mẫu tin|viết tin|soạn tin|post tin|tạo mẫu|cho mẫu|gợi ý tin|tạo form|đăng bài|tạo bài)/ui';
    return preg_match($patterns, $text) === 1;
}

function detectJobType($text) {
    $text = mb_strtolower($text, 'UTF-8');
    // Onsite
    if (preg_match('/(tại chỗ|onsite|tại văn phòng|đến văn phòng|lên công ty|tại nhà|tại quán|trực tiếp)/ui', $text)) {
        return 'onsite';
    }
    // Hybrid
    if (preg_match('/(hybrid|kết hợp|linh hoạt)/ui', $text)) {
        return 'hybrid';
    }
    // Remote (default)
    return 'remote';
}

function buildJobDraft($categoryName, $userMessage, $jobType) {
    // Template theo nhóm việc
    $templates = [
        'Gia sư - Giáo dục' => [
            'tieu_de' => 'Gia sư dạy kèm',
            'mo_ta' => 'Dạy kèm cho học sinh, 2 buổi/tuần. Yêu cầu kiên nhẫn và có phương pháp sư phạm.',
            'ky_nang_can' => 'Sư phạm, Giao tiếp, Kiến thức chuyên môn',
            'thu_lao' => 1200000,
            'so_buoi' => 8,
            'gio_uoc_tinh' => 2
        ],
        'IT - Lập trình' => [
            'tieu_de' => 'Lập trình viên Part-time',
            'mo_ta' => 'Xây dựng và phát triển ứng dụng web. Làm việc theo sprint.',
            'ky_nang_can' => 'HTML, CSS, JavaScript, React',
            'thu_lao' => 2000000,
            'so_buoi' => 10,
            'gio_uoc_tinh' => 4
        ],
        'Thiết kế - Đồ họa' => [
            'tieu_de' => 'Designer thiết kế ấn phẩm',
            'mo_ta' => 'Thiết kế poster, banner, social media cho shop. Có portfolio là lợi thế.',
            'ky_nang_can' => 'Photoshop, Illustrator, Canva',
            'thu_lao' => 1500000,
            'so_buoi' => 6,
            'gio_uoc_tinh' => 3
        ],
        'Marketing - Content' => [
            'tieu_de' => 'Content Marketing Part-time',
            'mo_ta' => 'Viết bài cho blog và fanpage, lên kế hoạch nội dung hàng tuần.',
            'ky_nang_can' => 'Content, SEO, Mạng xã hội',
            'thu_lao' => 1500000,
            'so_buoi' => 8,
            'gio_uoc_tinh' => 3
        ],
        'Bán hàng - Sale' => [
            'tieu_de' => 'Nhân viên bán hàng online',
            'mo_ta' => 'Tư vấn khách hàng qua fanpage, chốt đơn hàng online.',
            'ky_nang_can' => 'Giao tiếp, Bán hàng, Chăm sóc khách hàng',
            'thu_lao' => 1200000,
            'so_buoi' => 10,
            'gio_uoc_tinh' => 4
        ],
        'F&B - Phục vụ' => [
            'tieu_de' => 'Nhân viên phục vụ',
            'mo_ta' => 'Phục vụ khách tại quán, order và dọn dẹp. Ca làm linh hoạt.',
            'ky_nang_can' => 'Giao tiếp, Nhanh nhẹn, Trung thực',
            'thu_lao' => 1000000,
            'so_buoi' => 12,
            'gio_uoc_tinh' => 4
        ],
        'Giao hàng - Vận chuyển' => [
            'tieu_de' => 'Nhân viên giao hàng',
            'mo_ta' => 'Giao hàng trong khu vực nội thành. Có xe máy và bằng lái.',
            'ky_nang_can' => 'Chạy xe, Đúng giờ, Trung thực',
            'thu_lao' => 1500000,
            'so_buoi' => 15,
            'gio_uoc_tinh' => 5
        ],
        'Khác' => [
            'tieu_de' => 'Công việc Part-time',
            'mo_ta' => 'Công việc bán thời gian cho sinh viên.',
            'ky_nang_can' => 'Chăm chỉ, Trách nhiệm',
            'thu_lao' => 1500000,
            'so_buoi' => 8,
            'gio_uoc_tinh' => 3
        ]
    ];

    $tpl = $templates[$categoryName] ?? $templates['Khác'];

    // Nếu user nói cụ thể tiêu đề → dùng câu user
    $tieuDe = $tpl['tieu_de'];
    if (preg_match('/(tuyển|tìm|cần)\s+(.{5,60})/ui', $userMessage, $m)) {
        $raw = trim($m[2]);
        // Giới hạn độ dài
        if (mb_strlen($raw) > 10 && mb_strlen($raw) < 80) {
            $tieuDe = mb_convert_case(mb_substr($raw, 0, 70), MB_CASE_TITLE, 'UTF-8');
        }
    }

    // Tính ngày
    $today = new DateTime();
    $hanChot = (clone $today)->modify('+14 days')->format('Y-m-d');
    $hanNop = (clone $today)->modify('+65 days')->format('Y-m-d');
    $ngayBD = (clone $today)->modify('+20 days')->format('Y-m-d');
    $ngayKT = (clone $today)->modify('+60 days')->format('Y-m-d');

    $draft = [
        'nhom_viec' => $categoryName,
        'tieu_de' => $tieuDe,
        'mo_ta' => $tpl['mo_ta'],
        'ky_nang_can' => $tpl['ky_nang_can'],
        'thu_lao' => $tpl['thu_lao'],
        'loai_cong_viec' => $jobType,
        'so_luong_can' => 1,
        'so_buoi' => $tpl['so_buoi'],
        'gio_uoc_tinh' => $tpl['gio_uoc_tinh'],
        'han_chot' => $hanChot,
        'han_nop_file' => $hanNop,
        'ngay_bat_dau' => ($jobType === 'remote') ? null : $ngayBD,
        'ngay_ket_thuc' => ($jobType === 'remote') ? null : $ngayKT,
    ];

    return $draft;
}

/* ============================================================
   XỬ LÝ CHO NTD
   ============================================================ */
if ($role === 'nha_tuyen_dung') {
    $st = $pdo->prepare("SELECT ten_cong_ty, loai FROM nha_tuyen_dung WHERE id=?");
    $st->execute([$userId]);
    $ntd = $st->fetch();

    // Bước 1: Phát hiện nhóm việc cụ thể trong câu user
    $category = detectJobCategory($message);
    $hasIntent = detectJobIntent($message);

    // Bước 2: Nếu có nhóm CỤ THỂ hoặc có ý định đăng tin chung → tạo JSON mẫu
    if ($category || $hasIntent) {
        // Nếu chỉ có ý định mà không có nhóm cụ thể → dùng nhóm mặc định
        if (!$category) {
            $category = 'IT - Lập trình';
        }

        $jobType = detectJobType($message);
        $draft = buildJobDraft($category, $message, $jobType);

        $reply = "Đã soạn mẫu tin cho nhóm **{$category}** ({$jobType})!\n";
        $reply .= "Nhấn nút bên dưới để điền vào form nhé! 🚀\n\n";
        $reply .= "JOB_DRAFT:" . json_encode($draft, JSON_UNESCAPED_UNICODE);

        json_out(['success' => true, 'reply' => $reply, 'role' => $role]);
    }

    // Nếu không match nhóm → gọi AI cho câu hỏi thông thường
    $systemPrompt = "Bạn là 'Trợ lý Stujob' — trợ lý ảo của sàn việc làm sinh viên Stujob.\n";
    $systemPrompt .= "Bạn đang hỗ trợ nhà tuyển dụng: {$ntd['ten_cong_ty']}.\n\n";
    $systemPrompt .= "QUY TẮC:\n";
    $systemPrompt .= "- Trả lời ngắn gọn 2-3 câu, dùng emoji\n";
    $systemPrompt .= "- Nếu NTD hỏi về đăng tin/gợi ý tin → hướng dẫn họ mô tả công việc cụ thể\n";
    $systemPrompt .= "- KHÔNG trả về HTML/CSS/JS\n\n";
    $systemPrompt .= "KIẾN THỨC:\n";
    $systemPrompt .= "- 8 nhóm việc: Gia sư - Giáo dục, F&B - Phục vụ, IT - Lập trình, Thiết kế - Đồ họa, Marketing - Content, Bán hàng - Sale, Giao hàng - Vận chuyển, Khác\n";
    $systemPrompt .= "- Phí đăng tin: 5 tin đầu MIỄN PHÍ, từ tin 6 phí 10% thù lao\n";
    $systemPrompt .= "- Ký quỹ escrow trước khi giao việc\n";
    $systemPrompt .= "- Nghiệm thu sản phẩm rồi mới giải ngân\n";
    $systemPrompt .= "- Hình thức: Remote (từ xa) / Onsite (tại chỗ) / Hybrid (kết hợp)\n";

} else if ($role === 'sinh_vien') {
    $st = $pdo->prepare("SELECT ho_ten, chuyen_nganh, gpa FROM sinh_vien WHERE id=?");
    $st->execute([$userId]);
    $sv = $st->fetch();
    $systemPrompt = "Bạn là 'Trợ lý Stujob' — trợ lý ảo của sàn việc làm sinh viên Stujob.\n";
    $systemPrompt .= "Bạn đang hỗ trợ sinh viên: {$sv['ho_ten']}, ngành {$sv['chuyen_nganh']}, GPA {$sv['gpa']}.\n\n";
    $systemPrompt .= "NHIỆM VỤ:\n";
    $systemPrompt .= "- Gợi ý việc làm phù hợp với kỹ năng & lịch học\n";
    $systemPrompt .= "- Hướng dẫn ứng tuyển, chat với NTD, nộp bài (chỉ PDF/ảnh)\n";
    $systemPrompt .= "- Giải thích ví tiền, cách rút tiền (tối thiểu 50.000đ)\n";
    $systemPrompt .= "- Phí: 10 đơn đầu MIỄN PHÍ, từ đơn 11 phí 3%\n";
    $systemPrompt .= "- Trả lời ngắn gọn 2-4 câu, dùng emoji\n";

} else if ($role === 'admin') {
    $systemPrompt = "Bạn là 'Trợ lý Stujob' — trợ lý của admin.\n";
    $systemPrompt .= "Trả lời ngắn gọn về: xác thực SV, kiểm duyệt tin, khiếu nại, báo cáo thống kê.\n";
    $systemPrompt .= "2-4 câu, dùng emoji.\n";
} else {
    $systemPrompt = "Bạn là 'Trợ lý Stujob'. Trả lời ngắn gọn 2-3 câu bằng tiếng Việt.\n";
}

/* ============ GỌI GROQ API ============ */
$apiKey = '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';
$model = 'openai/gpt-oss-120b';

$messages = [['role' => 'system', 'content' => $systemPrompt]];
foreach (array_slice($history, -6) as $h) {
    $messages[] = ['role' => $h['role'], 'content' => $h['content']];
}
$messages[] = ['role' => 'user', 'content' => $message];

$payload = [
    'model' => $model,
    'messages' => $messages,
    'temperature' => 0.5,
    'max_tokens' => 500
];

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false
]);

$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

if ($httpCode !== 200) {
    json_out([
        'success' => false,
        'message' => 'AI đang bận. Thử lại sau.',
        'debug' => [
            'http_code' => $httpCode,
            'curl_error' => $curlError,
            'api_response' => substr($res, 0, 500)
        ]
    ]);
}

$result = json_decode($res, true);
$reply = $result['choices'][0]['message']['content'] ?? 'Xin lỗi, mình chưa trả lời được.';

json_out(['success' => true, 'reply' => $reply, 'role' => $role]);