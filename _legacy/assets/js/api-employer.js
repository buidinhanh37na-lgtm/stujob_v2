/* ============================================================
   API HELPER CHO NHÀ TUYỂN DỤNG
   ============================================================ */
const API_EMP = {
  auth: '../api/employer/auth.php',
  profile: '../api/employer/profile.php',
  templates: '../api/employer/templates.php',
  postJob: '../api/employer/post-job.php',
  myJobs: '../api/employer/my-jobs.php',
  candidates: '../api/employer/candidates.php',
  applications: '../api/employer/applications.php',
  messages: '../api/employer/messages.php',
  escrow: '../api/employer/escrow.php',
  acceptance: '../api/employer/acceptance.php',
  ratings: '../api/employer/ratings.php',
  reports: '../api/employer/reports.php',
  notifications: '../api/employer/notifications.php',
};

/* ============ FETCH ============ */
const API = {
  async get(url) {
    const r = await fetch(url, { credentials: 'same-origin' });
    if (r.status === 401) {
      // Chỉ đá ra khi xác nhận 100% mất session
      const check = await fetch(API_EMP.auth + '?action=me', { credentials: 'same-origin' });
      const j = await check.json();
      if (!j.success) {
        location.href = 'login.html';
        throw new Error('Not logged in');
      }
    }
    return r.json();
  },
  async post(url, data) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data || {})
    });
    if (r.status === 401) {
      const check = await fetch(API_EMP.auth + '?action=me', { credentials: 'same-origin' });
      const j = await check.json();
      if (!j.success) { location.href = 'login.html'; throw new Error('Not logged in'); }
    }
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
    const r = await fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' });
    return r.json();
  }
};

/* ============ UTILS ============ */
function fmtMoney(n) {
  const num = Math.round(Number(n || 0));
  return num.toLocaleString('vi-VN') + '₫';
}
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('vi-VN');
}
function fmtDateTime(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function thuName(n) {
  return { 2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật' }[n] || '';
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
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
  setTimeout(() => el.remove(), 3000);
}
function renderStars(diem) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    s += `<span class="star ${i <= Math.round(diem) ? '' : 'empty'}">★</span>`;
  }
  return `<span class="stars">${s}</span>`;
}
function paymentLabel(s) {
  return {
    cho_nap: '⏳ Chờ nạp', da_nap: '🔒 Đã ký quỹ',
    cho_nghiem_thu: '⏳ Chờ nghiệm thu', da_giai_ngan: '✅ Đã giải ngân',
    hoan_tien: '↩️ Hoàn tiền',
    cho_ky_quy: '⏳ Chờ ký quỹ', da_ky_quy: '🔒 Đã ký quỹ', huy: '❌ Đã huỷ'
  }[s] || s;
}
function paymentClass(s) {
  return {
    cho_nap: 'cho', cho_ky_quy: 'cho',
    da_nap: 'da_ky', da_ky_quy: 'da_ky', cho_nghiem_thu: 'cho',
    da_giai_ngan: 'giai_ngan',
    hoan_tien: 'huy', huy: 'huy'
  }[s] || 'cho';
}
function appStatusLabel(s) {
  return {
    cho_duyet: '⏳ Chờ duyệt', cho_xu_ly: '⏳ Chờ xử lý',
    da_chap_nhan: '✅ Đã nhận', chap_nhan: '✅ Đã chấp nhận',
    tu_choi: '❌ Từ chối', hoan_thanh: '🎉 Hoàn thành'
  }[s] || s;
}
function appStatusClass(s) {
  return {
    cho_duyet: 'warning', cho_xu_ly: 'warning',
    da_chap_nhan: 'success', chap_nhan: 'success',
    tu_choi: 'danger', hoan_thanh: 'primary'
  }[s] || 'warning';
}