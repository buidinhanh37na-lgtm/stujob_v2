/* ============================================================
   API ADMIN HELPER
   ============================================================ */
const API_ADM = {
  auth: '../api/admin/auth.php',
  dashboard: '../api/admin/dashboard.php',
  verify: '../api/admin/verify-student.php',
  moderation: '../api/admin/moderation.php',
  jobs: '../api/admin/jobs.php',
  users: '../api/admin/users.php',
  complaints: '../api/admin/complaints.php',
  refunds: '../api/admin/refunds.php',
  settings: '../api/admin/settings.php',
  logs: '../api/admin/logs.php',
  notifications: '../api/admin/notifications.php',
  admins: '../api/admin/admins.php',
  svTruong: '../api/admin/sv-truong.php',
  revenue: '../api/admin/revenue.php',
  connections: '../api/admin/connections.php',
};

/* ============ FETCH WRAPPER ============ */
const API = {
  async get(url) {
    const r = await fetch(url, { credentials: 'same-origin' });
    if (!r.ok && r.status === 401) { location.href = 'login.html'; }
    return r.json();
  },
  async post(url, data) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data || {})
    });
    if (r.status === 401) { location.href = 'login.html'; }
    return r.json();
  },
  async put(url, data) {
    const r = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data || {})
    });
    return r.json();
  },
  async del(url) {
    const r = await fetch(url, { method: 'DELETE', credentials: 'same-origin' });
    return r.json();
  },
  async postForm(url, fd) {
    const r = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      body: fd
    });
    return r.json();
  }
};

/* ============ UTILS ============ */
function fmtMoney(n) {
  return Math.round(Number(n || 0)).toLocaleString('vi-VN') + '₫';
}
function fmtNumber(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('vi-VN');
}
function fmtDateTime(s) {
  if (!s) return '';
  return new Date(s).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}
function fmtTimeAgo(s) {
  if (!s) return '';
  const diff = (Date.now() - new Date(s).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
  return fmtDate(s);
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[m]));
}
function toast(msg, type = 'success') {
  let wrap = document.getElementById('toasts');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toasts';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
function stars(diem) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += `<span style="color:${i <= Math.round(diem) ? '#fbbf24' : '#d1d5db'};">★</span>`;
  }
  return s;
}
function riskLevel(score) {
  if (score >= 8) return { cls: 'high', label: 'Cao', icon: '🚨' };
  if (score >= 5) return { cls: 'mid', label: 'Trung bình', icon: '⚠️' };
  return { cls: 'low', label: 'Thấp', icon: '✅' };
}
function roleLabel(r) {
  return {
    super_admin: 'Super Admin',
    admin: 'Admin',
    moderator: 'Kiểm duyệt viên',
    support: 'Hỗ trợ'
  }[r] || r;
}
function statusComplaint(s) {
  return {
    cho_xu_ly: { cls: 'yellow', label: '⏳ Chờ xử lý' },
    dang_xu_ly: { cls: 'blue', label: '🔄 Đang xử lý' },
    da_giai_quyet: { cls: 'green', label: '✅ Đã giải quyết' },
    da_dong: { cls: 'gray', label: '🔒 Đã đóng' }
  }[s] || { cls: 'gray', label: s };
}
function priorityLabel(p) {
  return {
    khan_cap: { cls: 'red', label: '🚨 Khẩn cấp' },
    cao: { cls: 'yellow', label: '⚠️ Cao' },
    trung_binh: { cls: 'blue', label: 'Trung bình' },
    thap: { cls: 'gray', label: 'Thấp' }
  }[p] || { cls: 'gray', label: p };
}