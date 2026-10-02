/* ============================================================
   ADMIN DASHBOARD — Main Logic
   ============================================================ */
let ADMIN = null;
let CURRENT_VIEW = 'dashboard';
let CHART_DATA = null;
let CACHE = {
  verifyRequests: [],
  jobs: [],
  users: [],
  complaints: [],
  refunds: [],
  settings: {},
  logs: [],
  notifications: [],
  svTruong: []
};

/* ============ HELPERS ============ */
/* Escape HTML rồi escape dấu ' để nhét an toàn vào onclick="" */
function escAttr(s) {
  return escapeHtml(String(s == null ? '' : s)).replace(/'/g, "\\'");
}

/* Vẽ 5 đường grid ngang + nhãn trục Y */
function buildChartGrid({ W, PAD_L, PAD_R, PAD_T, PAD_B, chartH, maxVal, formatY }) {
  let out = '';
  for (let i = 0; i <= 4; i++) {
    const y = PAD_T + chartH - (chartH * i / 4);
    const val = maxVal * i / 4;
    out += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    out += `<text x="${PAD_L - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#94a3b8">${formatY ? formatY(val) : val}</text>`;
  }
  return out;
}

/* Vẽ nhãn trục X (thưa dần theo bước) */
function buildXLabels(data, toX, maxLabels, yPos) {
  const step = Math.max(1, Math.ceil(data.length / maxLabels));
  let out = '';
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      out += `<text x="${toX(i)}" y="${yPos}" text-anchor="middle" font-size="10" fill="#94a3b8">${d.date}</text>`;
    }
  });
  return out;
}

/* ============ BOOT ============ */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await API.get(API_ADM.auth + '?action=me');
  if (!me.success) { location.href = 'login.html'; return; }
  ADMIN = me.admin;
  renderUser();
  bindNav();
  bindMenu();
  bindModals();
  await Promise.all([loadDashboard(), loadNotifications()]);
  // Realtime badge
  setInterval(loadNotifications, 30000);
});

function renderUser() {
  const name = ADMIN.ho_ten || 'Admin';
  const initial = name.charAt(0).toUpperCase();
  document.getElementById('admSideName').textContent = name;
  document.getElementById('admSideAvatar').textContent = initial;
  document.getElementById('admSideRole').textContent = roleLabel(ADMIN.vai_tro);
}

/* ============ NAV ============ */
function bindNav() {
  document.querySelectorAll('.adm-nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const v = el.dataset.view;
      document.querySelectorAll('.adm-nav-item').forEach(x => x.classList.toggle('active', x === el));
      document.querySelectorAll('.adm-view').forEach(x => x.classList.remove('active'));
      const view = document.getElementById('view-' + v);
      if (view) view.classList.add('active');
      document.getElementById('admPageTitle').textContent =
        el.textContent.trim().replace(/\s+/g, ' ').replace(/[0-9]+$/, '').trim();
      closeSidebar();
      CURRENT_VIEW = v;
      loadView(v);
    });
  });
}

function loadView(v) {
  if (v === 'dashboard') loadDashboard();
  else if (v === 'verify') loadVerify();
  else if (v === 'moderation') loadModeration();
  else if (v === 'keywords') loadKeywords();
  else if (v === 'jobs') loadJobs();
  else if (v === 'users') loadUsers('sinh_vien');
  else if (v === 'complaints') loadComplaints();
  else if (v === 'refunds') loadRefunds();
  else if (v === 'sv-truong') loadSvTruong();
  else if (v === 'settings') loadSettings();
  else if (v === 'logs') loadLogs();
  else if (v === 'notifications') loadNotificationsView();
  else if (v === 'admins') loadAdmins();
  else if (v === 'revenue') loadRevenue();
  else if (v === 'connections') loadConnections();
}

/* ============ SIDEBAR ============ */
function bindMenu() {
  document.getElementById('admMenuBtn').onclick = () => {
    document.getElementById('admSidebar').classList.toggle('open');
    document.getElementById('admOverlay').classList.toggle('show');
  };
  document.getElementById('admOverlay').onclick = closeSidebar;
}
function closeSidebar() {
  document.getElementById('admSidebar').classList.remove('open');
  document.getElementById('admOverlay').classList.remove('show');
}

/* ============ MODAL ============ */
function openModal(title, body, footer = '', size = '') {
  document.getElementById('admModalTitle').textContent = title;
  document.getElementById('admModalBody').innerHTML = body;
  document.getElementById('admModalFooter').innerHTML = footer;
  const m = document.getElementById('admModal');
  m.className = 'adm-modal ' + size;
  document.getElementById('admModalBackdrop').classList.add('show');
}
function closeModal() {
  document.getElementById('admModalBackdrop').classList.remove('show');
}
function bindModals() {
  const bg = document.getElementById('admModalBackdrop');
  if (bg) bg.addEventListener('click', e => { if (e.target.id === 'admModalBackdrop') closeModal(); });
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function loadDashboard() {
  const r = await API.get(API_ADM.dashboard + '?range=30d');
  if (!r.success) { toast('Lỗi tải dashboard', 'error'); return; }
  CHART_DATA = r;

  // Overview stats
  document.getElementById('dashSV').textContent = fmtNumber(r.overview.total_sv);
  document.getElementById('dashNTD').textContent = fmtNumber(r.overview.total_ntd);
  document.getElementById('dashJobs').textContent = fmtNumber(r.overview.total_jobs);
  document.getElementById('dashApps').textContent = fmtNumber(r.overview.total_apps);

  // Match rate
  document.getElementById('dashMatchRate').textContent = r.match_rate.rate + '%';
  document.getElementById('dashMatchSub').textContent = `${r.match_rate.matched}/${r.match_rate.total} ứng tuyển`;

  // Escrow / thanh khoản
  document.getElementById('dashEscrow').textContent = fmtMoney(r.escrow.dang_giu);
  document.getElementById('dashEscrowSub').textContent = `Đã giải ngân: ${fmtMoney(r.escrow.da_giai_ngan)}`;

  // Revenue
  document.getElementById('dashRevenue').textContent = fmtMoney(r.revenue.tong);
  document.getElementById('dashRevenueSub').textContent = `${r.revenue.so_gd} giao dịch`;

  // Wallet
  document.getElementById('dashWallet').textContent = fmtMoney(r.wallets.tong);
  document.getElementById('dashWalletSub').textContent = `NTD: ${fmtMoney(r.wallets.ntd)} • SV: ${fmtMoney(r.wallets.sv)}`;

  // Alerts
  const alertHtml = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      ${r.overview.pending_verify > 0 ? `<span class="adm-badge yellow">📋 ${r.overview.pending_verify} SV chờ xác thực</span>` : ''}
      ${r.overview.pending_complaints > 0 ? `<span class="adm-badge red">🚨 ${r.overview.pending_complaints} khiếu nại cần xử lý</span>` : ''}
      <span class="adm-badge green">📝 ${r.overview.pending_jobs} tin đang mở</span>
    </div>`;
  document.getElementById('dashAlerts').innerHTML = alertHtml;

  // Chart SVG
  drawChart(r.chart);

  // Top NTD
  const topNTDEl = document.getElementById('dashTopNTD');
  if (r.top_ntd && r.top_ntd.length) {
    topNTDEl.innerHTML = r.top_ntd.map((t, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
        <div style="width:26px;height:26px;border-radius:50%;background:#ede9fe;color:#6d28d9;
          display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${i + 1}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(t.ten_cong_ty)}
          </div>
          <div style="font-size:11px;color:var(--text-muted);">${t.so_gd} giao dịch</div>
        </div>
        <div style="font-weight:700;color:#8b5cf6;font-size:13px;">${fmtMoney(t.doanh_thu)}</div>
      </div>
    `).join('');
  } else {
    topNTDEl.innerHTML = `<div class="adm-empty"><div class="icon">📊</div><p>Chưa có dữ liệu</p></div>`;
  }

  // Top SV
  const topSVEl = document.getElementById('dashTopSV');
  if (r.top_sv && r.top_sv.length) {
    topSVEl.innerHTML = r.top_sv.map((t, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
        <div style="width:26px;height:26px;border-radius:50%;background:#dbeafe;color:#1e40af;
          display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">${i + 1}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(t.ho_ten)}
          </div>
          <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(t.ma_sinh_vien)}</div>
        </div>
        <div>${stars(t.diem_danh_gia)} <span style="font-size:11px;">(${t.so_lan_danh_gia})</span></div>
      </div>
    `).join('');
  } else {
    topSVEl.innerHTML = `<div class="adm-empty"><div class="icon">⭐</div><p>Chưa có SV được đánh giá</p></div>`;
  }
}

function drawChart(data) {
  const svg = document.getElementById('admChart');
  if (!svg || !data || !data.length) return;

  const W = svg.clientWidth || 800;
  const H = 220;
  const PAD = 30;
  const maxVal = Math.max(...data.map(d => Math.max(d.giai_ngan, d.nap_vao, d.phi)), 100000);
  const stepX = (W - PAD * 2) / Math.max(1, data.length - 1);

  const toY = v => H - PAD - (v / maxVal) * (H - PAD * 2);
  const toX = i => PAD + i * stepX;

  // Lines
  const lineGiaiNgan = data.map((d, i) => `${toX(i)},${toY(d.giai_ngan)}`).join(' ');
  const lineNapVao = data.map((d, i) => `${toX(i)},${toY(d.nap_vao)}`).join(' ');
  const linePhi = data.map((d, i) => `${toX(i)},${toY(d.phi)}`).join(' ');

  // Y grid lines (không nhãn)
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const y = PAD + (H - PAD * 2) * i / 4;
    grid += `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
  }

  // X labels
  const xLabels = buildXLabels(data, toX, 8, H - 8);

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
    ${grid}
    <polyline points="${lineNapVao}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round"/>
    <polyline points="${lineGiaiNgan}" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linejoin="round"/>
    <polyline points="${linePhi}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 5"/>
    ${xLabels}
    <g transform="translate(${W - 250}, 20)">
      <circle cx="0" cy="0" r="4" fill="#10b981"/><text x="10" y="4" font-size="11" fill="#475569">Nạp vào escrow</text>
      <circle cx="130" cy="0" r="4" fill="#8b5cf6"/><text x="140" y="4" font-size="11" fill="#475569">Đã giải ngân</text>
      <circle cx="0" cy="18" r="4" fill="#f59e0b"/><text x="10" y="22" font-size="11" fill="#475569">Phí dịch vụ</text>
    </g>`;
}

/* ============================================================
   XÁC THỰC SV
   ============================================================ */
async function loadVerify() {
  const status = document.getElementById('verifyStatus')?.value || 'cho_duyet';
  const q = document.getElementById('verifySearch')?.value || '';
  const r = await API.get(`${API_ADM.verify}?action=requests&status=${status}&q=${encodeURIComponent(q)}`);
  const el = document.getElementById('verifyList');
  if (!el) return;

  // Load stats
  const stats = await API.get(API_ADM.verify + '?action=stats');
  if (stats.success) {
    const s = stats.yeu_cau;
    document.getElementById('verifyStatPending').textContent = s.cho_duyet || 0;
    document.getElementById('verifyStatApproved').textContent = s.da_xac_thuc || 0;
    document.getElementById('verifyStatRejected').textContent = s.tu_choi || 0;
  }

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">📋</div><p>Không có yêu cầu nào</p></div>`;
    return;
  }

  const statusMap = {
    cho_duyet: { cls: 'yellow', label: '⏳ Chờ duyệt' },
    da_xac_thuc: { cls: 'green', label: '✅ Đã xác thực' },
    tu_choi: { cls: 'red', label: '❌ Từ chối' }
  };

  el.innerHTML = `
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>MSSV</th><th>Họ tên</th><th>Email</th><th>Trường</th>
            <th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${r.items.map(it => `
            <tr>
              <td><b>${escapeHtml(it.ma_sinh_vien)}</b></td>
              <td>${escapeHtml(it.ho_ten)}</td>
              <td>${escapeHtml(it.email || '')}</td>
              <td>${escapeHtml(it.truong || '')}</td>
              <td>${fmtDateTime(it.created_at)}</td>
              <td><span class="adm-badge ${statusMap[it.trang_thai]?.cls}">${statusMap[it.trang_thai]?.label}</span></td>
              <td>
                <button type="button" class="btn btn-sm btn-ghost" onclick="viewVerifyDetail(${it.id})">🔍 Chi tiết</button>
                ${it.trang_thai === 'cho_duyet' ? `
                  <button type="button" class="btn btn-sm btn-adm" onclick="approveVerify(${it.id})">✅</button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="rejectVerify(${it.id})">❌</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

async function viewVerifyDetail(id) {
  const r = await API.get(API_ADM.verify + '?action=detail&id=' + id);
  if (!r.success) { toast(r.message, 'error'); return; }

  const { yeu_cau: yc, nha_truong: nt, so_khop: sk } = r;

  let compareHtml = '';
  if (sk) {
    const row = (label, data) => `
      <tr>
        <td><b>${label}</b></td>
        <td>${escapeHtml(String(data.he_thong || '—'))}</td>
        <td>${escapeHtml(String(data.nha_truong || '—'))}</td>
        <td>${data.khop ? '<span class="adm-badge green">✅ Khớp</span>' : '<span class="adm-badge red">❌ Khác</span>'}</td>
      </tr>`;
    compareHtml = `
      <h4 style="margin:16px 0 8px;font-size:14px;">🔍 So khớp với DB nhà trường</h4>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr><th>Trường</th><th>Hệ thống</th><th>Nhà trường</th><th>Kết quả</th></tr></thead>
          <tbody>
            ${row('Họ tên', sk.ho_ten)}
            ${row('Chuyên ngành', sk.chuyen_nganh)}
            ${row('Năm học', sk.nam_hoc)}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px;font-size:13px;color:#6b7280;">
        Trạng thái tại trường: <b>${escapeHtml(sk.trang_thai_truong)}</b>
      </div>`;
  } else {
    compareHtml = `<div style="padding:14px;background:#fee2e2;border-radius:10px;color:#991b1b;margin-top:12px;">
      ⚠️ Không tìm thấy MSSV này trong DB nhà trường
    </div>`;
  }

  openModal('Chi tiết yêu cầu xác thực', `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
      <div><small class="text-muted">MSSV</small><div><b>${escapeHtml(yc.ma_sinh_vien)}</b></div></div>
      <div><small class="text-muted">Họ tên</small><div>${escapeHtml(yc.ho_ten)}</div></div>
      <div><small class="text-muted">Email</small><div>${escapeHtml(yc.email)}</div></div>
      <div><small class="text-muted">Trường</small><div>${escapeHtml(yc.truong || '')}</div></div>
      <div><small class="text-muted">Ngày gửi</small><div>${fmtDateTime(yc.created_at)}</div></div>
    </div>
    ${compareHtml}
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>
    ${yc.trang_thai === 'cho_duyet' ? `
      <button type="button" class="btn btn-danger" onclick="rejectVerify(${id})">❌ Từ chối</button>
      <button type="button" class="btn btn-adm" onclick="approveVerify(${id})">✅ Xác thực</button>
    ` : ''}
  `, 'large');
}

async function approveVerify(id) {
  if (!confirm('Xác thực sinh viên này?')) return;
  const note = prompt('Ghi chú (tùy chọn):') || '';
  const r = await API.post(API_ADM.verify + '?action=approve', { id, ghi_chu: note });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadVerify(); }
}

async function rejectVerify(id) {
  const reason = prompt('Lý do từ chối:');
  if (!reason) return;
  const r = await API.post(API_ADM.verify + '?action=reject', { id, ly_do: reason });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadVerify(); }
}

async function autoVerifyAll() {
  if (!confirm('Tự động xác thực TẤT CẢ yêu cầu đang chờ? (chỉ duyệt những SV khớp DB trường)')) return;
  const r = await API.post(API_ADM.verify + '?action=auto-verify');
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadVerify();
}

/* ============================================================
   KIỂM DUYỆT TIN
   ============================================================ */
async function loadModeration() {
  const filter = document.getElementById('modFilter')?.value || 'all';
  const q = document.getElementById('modSearch')?.value || '';
  const r = await API.get(`${API_ADM.moderation}?action=pending&filter=${filter}&q=${encodeURIComponent(q)}`);

  const el = document.getElementById('modList');
  if (!el) return;

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">🛡️</div><p>Không có tin nào cần kiểm duyệt</p></div>`;
    return;
  }

  el.innerHTML = r.items.map(it => {
    const risk = riskLevel(it.diem_rui_ro || 0);
    return `
      <div class="adm-card" style="margin-bottom:12px;border-left:4px solid ${risk.cls === 'high' ? '#ef4444' : risk.cls === 'mid' ? '#f59e0b' : '#10b981'};">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${escapeHtml(it.tieu_de)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">
              🏢 ${escapeHtml(it.ten_cong_ty)} • ${fmtDateTime(it.created_at)}
            </div>
            <div style="font-size:13px;color:var(--text);margin-bottom:6px;">
              ${escapeHtml((it.mo_ta || '').slice(0, 200))}${(it.mo_ta || '').length > 200 ? '...' : ''}
            </div>
            ${it.tu_khoa_phat_hien ? `
              <div style="font-size:12px;color:#dc2626;margin-top:6px;">
                ⚠️ Từ khóa phát hiện: <b>${escapeHtml(it.tu_khoa_phat_hien)}</b>
              </div>
            ` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;">
            <span class="risk-badge ${risk.cls}">${risk.icon} Rủi ro: ${it.diem_rui_ro || 0}/10</span>
            ${it.luong_min ? `<span style="font-size:12px;color:#10b981;font-weight:700;">💰 ${fmtMoney(it.luong_min)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
          <button type="button" class="btn btn-sm btn-ghost" onclick="analyzeJob(${it.id})">🔍 Phân tích</button>
          <button type="button" class="btn btn-sm btn-success" onclick="approveJob(${it.id})">✅ Duyệt</button>
          <button type="button" class="btn btn-sm btn-warning" onclick="warnJob(${it.id}, ${it.diem_rui_ro || 0}, '${escAttr(it.tu_khoa_phat_hien || '')}')">⚠️ Cảnh báo</button>
          <button type="button" class="btn btn-sm btn-danger" onclick="blockJob(${it.id}, ${it.diem_rui_ro || 0}, '${escAttr(it.tu_khoa_phat_hien || '')}')">🚫 Chặn</button>
        </div>
      </div>`;
  }).join('');
}

async function analyzeJob(jobId) {
  const r = await API.get(API_ADM.moderation + '?action=analyze&job_id=' + jobId);
  if (!r.success) { toast(r.message, 'error'); return; }
  const { job, risk } = r;
  openModal('Phân tích rủi ro', `
    <div style="font-size:14px;margin-bottom:12px;">
      <b>${escapeHtml(job.tieu_de)}</b>
    </div>
    <div style="text-align:center;padding:20px;">
      <div style="font-size:48px;font-weight:800;color:${risk.diem >= 8 ? '#dc2626' : risk.diem >= 5 ? '#d97706' : '#10b981'
    };">${risk.diem}/10</div>
      <div style="color:var(--text-muted);margin-top:6px;">Điểm rủi ro</div>
    </div>
    ${risk.tu_khoa.length ? `
      <div style="background:#fee2e2;padding:12px;border-radius:10px;margin-top:12px;">
        <b style="color:#991b1b;">🚨 Từ khóa phát hiện:</b>
        <div style="margin-top:6px;font-size:13px;color:#991b1b;">${risk.tu_khoa.join(', ')}</div>
      </div>
    ` : '<div style="background:#d1fae5;padding:12px;border-radius:10px;color:#065f46;">✅ Không phát hiện từ khóa rủi ro</div>'}
    <div style="margin-top:12px;font-size:13px;color:var(--text-muted);">
      Ngưỡng chặn: <b>${risk.nguong_chan}</b> • Ngưỡng cảnh báo: <b>${risk.nguong_canh_bao}</b>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>
  `);
}

async function approveJob(id) {
  if (!confirm('Duyệt tin này?')) return;
  const r = await API.post(API_ADM.moderation + '?action=approve', { viec_lam_id: id });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadModeration();
}

async function warnJob(id, score, keywords) {
  const reason = prompt('Lý do cảnh báo:', 'Nội dung có dấu hiệu không phù hợp');
  if (!reason) return;
  const r = await API.post(API_ADM.moderation + '?action=warn', {
    viec_lam_id: id, ly_do: reason, diem_rui_ro: score, tu_khoa: keywords
  });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadModeration();
}

async function blockJob(id, score, keywords) {
  const reason = prompt('Lý do chặn:', 'Vi phạm chính sách nội dung');
  if (!reason) return;
  const r = await API.post(API_ADM.moderation + '?action=block', {
    viec_lam_id: id, ly_do: reason, diem_rui_ro: score || 10, tu_khoa: keywords
  });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadModeration();
}

async function autoScanJobs() {
  if (!confirm('Quét tự động toàn bộ tin chưa kiểm duyệt?')) return;
  const r = await API.post(API_ADM.moderation + '?action=auto-scan');
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadModeration();
}

/* ============================================================
   QUẢN LÝ TIN VIỆC
   ============================================================ */
async function loadJobs() {
  const status = document.getElementById('jobStatus')?.value || 'all';
  const q = document.getElementById('jobSearch')?.value || '';
  const r = await API.get(`${API_ADM.jobs}?status=${status}&q=${encodeURIComponent(q)}`);
  const el = document.getElementById('jobsList');
  if (!el) return;

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">📝</div><p>Không có tin nào</p></div>`;
    return;
  }

  const statusMap = {
    dang_mo: { cls: 'green', label: '🟢 Đang mở' },
    da_dong: { cls: 'red', label: '🔴 Đã đóng' }
  };

  el.innerHTML = `
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Tiêu đề</th><th>NTD</th><th>Lương</th><th>Ứng tuyển</th>
            <th>Trạng thái</th><th>Ngày tạo</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${r.items.map(it => `
            <tr>
              <td><b>${escapeHtml(it.tieu_de)}</b></td>
              <td>${escapeHtml(it.ten_cong_ty)}</td>
              <td>${it.luong_min ? fmtMoney(it.luong_min) : '—'}</td>
              <td><span class="adm-badge blue">${it.so_ung_tuyen || 0}</span></td>
              <td><span class="adm-badge ${statusMap[it.trang_thai]?.cls}">${statusMap[it.trang_thai]?.label}</span></td>
              <td>${fmtDate(it.created_at)}</td>
              <td>
                ${it.trang_thai === 'dang_mo' ? `<button type="button" class="btn btn-sm btn-warning" onclick="forceCloseJob(${it.id})">Đóng</button>` : ''}
                <button type="button" class="btn btn-sm btn-danger" onclick="deleteJobAdmin(${it.id})">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

async function forceCloseJob(id) {
  const reason = prompt('Lý do đóng tin:', 'Admin đóng tin');
  if (!reason) return;
  const r = await API.post(API_ADM.jobs + '?action=force-close', { id, ly_do: reason });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadJobs();
}

async function deleteJobAdmin(id) {
  if (!confirm('XÓA VĨNH VIỄN tin này?')) return;
  const r = await API.del(API_ADM.jobs + '?id=' + id);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadJobs();
}

/* ============================================================
   QUẢN LÝ NGƯỜI DÙNG
   ============================================================ */
async function loadUsers(type) {
  const search = document.getElementById('userSearch')?.value || '';
  const r = await API.get(`${API_ADM.users}?type=${type}&q=${encodeURIComponent(search)}`);
  const el = document.getElementById('usersList');
  if (!el) return;

  // Stats
  const stats = await API.get(API_ADM.users + '?action=stats');
  if (stats.success) {
    const s = type === 'sinh_vien' ? stats.sinh_vien : stats.nha_tuyen_dung;
    document.getElementById('userStatTotal').textContent = s.tong;
    document.getElementById('userStatVerified').textContent = s.da_xac_thuc;
    document.getElementById('userStatUnverified').textContent = s.chua_xac_thuc;
    document.getElementById('userStatLocked').textContent = s.bi_khoa;
  }

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">👥</div><p>Không có người dùng nào</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>${type === 'sinh_vien' ? 'MSSV' : 'Loại'}</th>
            <th>Tên</th>
            <th>Email</th>
            <th>${type === 'sinh_vien' ? 'Trường' : 'Ngành'}</th>
            <th>Xác thực</th>
            <th>Ngày tạo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${r.items.map(it => `
            <tr>
              <td><b>${escapeHtml(it.code || it.extra || '')}</b></td>
              <td>${escapeHtml(it.name)}</td>
              <td>${escapeHtml(it.email)}</td>
              <td>${escapeHtml(it.extra || '')}</td>
              <td>
                <span class="adm-badge ${it.verified === 'da_xac_thuc' ? 'green' :
      it.verified === 'chua' ? 'red' : 'yellow'
    }">${it.verified === 'da_xac_thuc' ? '✅' :
      it.verified === 'chua' ? '🔴' : '🟡'
    }</span>
              </td>
              <td>${fmtDate(it.created_at)}</td>
              <td>
                <button type="button" class="btn btn-sm btn-ghost" onclick="viewUser('${type}', ${it.id})">👤</button>
                <button type="button" class="btn btn-sm btn-warning" onclick="toggleUserStatus('${type}', ${it.id})">🔒</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

async function viewUser(type, id) {
  const r = await API.get(API_ADM.users + `?action=detail&type=${type}&id=${id}`);
  if (!r.success) { toast('Lỗi', 'error'); return; }
  const u = r.user;

  let extraHtml = '';
  if (type === 'sinh_vien') {
    extraHtml = `
      <div style="margin-top:12px;">
        <b>🛠️ Kỹ năng:</b>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
          ${u.ky_nang?.length ? u.ky_nang.map(k => `<span class="adm-badge gray">${escapeHtml(k.ten_ky_nang)} (${k.muc_do})</span>`).join('') : '<span class="text-muted">Chưa cập nhật</span>'}
        </div>
      </div>
      <div style="margin-top:12px;">
        <b>📜 Chứng chỉ:</b>
        <div>${u.chung_chi?.length ? u.chung_chi.map(c => `<div style="font-size:13px;padding:4px 0;">• ${escapeHtml(c.ten_chung_chi)}</div>`).join('') : '<span class="text-muted">Chưa có</span>'}</div>
      </div>
      <div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
        <div><small class="text-muted">Ứng tuyển</small><div><b>${u.thong_ke.so_ung_tuyen}</b></div></div>
        <div><small class="text-muted">Việc hoàn thành</small><div><b>${u.thong_ke.so_viec_hoan_thanh}</b></div></div>
        <div><small class="text-muted">Tổng thu nhập</small><div><b>${fmtMoney(u.thong_ke.tong_thu_nhap)}</b></div></div>
      </div>`;
  } else {
    extraHtml = `
      <div style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
        <div><small class="text-muted">Số tin việc</small><div><b>${u.thong_ke.so_tin_viec}</b></div></div>
        <div><small class="text-muted">Tổng đã trả</small><div><b>${fmtMoney(u.thong_ke.tong_da_tra)}</b></div></div>
      </div>`;
  }

  openModal('Chi tiết người dùng', `
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
      <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6366f1);
        display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:700;">
        ${(u.ho_ten || u.ten_cong_ty || '?').charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;">${escapeHtml(u.ho_ten || u.ten_cong_ty)}</div>
        <div style="font-size:13px;color:var(--text-muted);">${escapeHtml(u.email)}</div>
      </div>
    </div>
    <div style="font-size:14px;">
      <div><b>📞 SĐT:</b> ${escapeHtml(u.so_dien_thoai || '—')}</div>
      <div><b>📍 Địa chỉ:</b> ${escapeHtml(u.dia_chi || '—')}</div>
    </div>
    ${extraHtml}
  `, `<button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>`, 'large');
}

async function toggleUserStatus(type, id) {
  const reason = prompt('Lý do (nếu khóa):', '');
  if (reason === null) return;
  const r = await API.post(API_ADM.users + '?action=toggle-status', { type, id, ly_do: reason });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadUsers(type);
}

/* ============================================================
   KHIẾU NẠI
   ============================================================ */
async function loadComplaints() {
  const status = document.getElementById('complStatus')?.value || 'all';
  const priority = document.getElementById('complPriority')?.value || 'all';
  const q = document.getElementById('complSearch')?.value || '';

  const r = await API.get(`${API_ADM.complaints}?action=list&status=${status}&priority=${priority}&q=${encodeURIComponent(q)}`);
  const el = document.getElementById('complaintsList');
  if (!el) return;

  const stats = await API.get(API_ADM.complaints + '?action=stats');
  if (stats.success) {
    document.getElementById('complStatPending').textContent = stats.khieu_nai.cho_xu_ly || 0;
    document.getElementById('complStatProcessing').textContent = stats.khieu_nai.dang_xu_ly || 0;
    document.getElementById('complStatResolved').textContent = stats.khieu_nai.da_giai_quyet || 0;
    document.getElementById('complStatRefunded').textContent = fmtMoney(stats.tong_hoan_tien);
  }

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">🚨</div><p>Không có khiếu nại nào</p></div>`;
    return;
  }

  el.innerHTML = r.items.map(it => {
    const st = statusComplaint(it.trang_thai);
    const pr = priorityLabel(it.uu_tien);
    return `
      <div class="adm-card" style="margin-bottom:12px;border-left:4px solid ${it.uu_tien === 'khan_cap' ? '#ef4444' :
        it.uu_tien === 'cao' ? '#f59e0b' : '#8b5cf6'
      };">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:4px;">${escapeHtml(it.tieu_de)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">
              👤 ${escapeHtml(it.nguoi_gui_ten || '—')} → ${escapeHtml(it.doi_tuong_ten || 'Hệ thống')}
              ${it.ten_viec ? ' • 📌 ' + escapeHtml(it.ten_viec) : ''}
            </div>
            <div style="font-size:13px;color:var(--text);">${escapeHtml((it.noi_dung || '').slice(0, 200))}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <span class="adm-badge ${st.cls}">${st.label}</span>
            <span class="adm-badge ${pr.cls}">${pr.label}</span>
            <span style="font-size:11px;color:var(--text-muted);">${fmtDateTime(it.created_at)}</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
          <button type="button" class="btn btn-sm btn-ghost" onclick="viewComplaint(${it.id})">🔍 Chi tiết</button>
          ${it.trang_thai === 'cho_xu_ly' ? `
            <button type="button" class="btn btn-sm btn-adm" onclick="takeComplaint(${it.id})">📥 Tiếp nhận</button>
          ` : ''}
          ${['cho_xu_ly', 'dang_xu_ly'].includes(it.trang_thai) ? `
            <button type="button" class="btn btn-sm btn-success" onclick="resolveComplaint(${it.id})">⚖️ Hòa giải</button>
            <button type="button" class="btn btn-sm btn-danger" onclick="closeComplaint(${it.id})">🔒 Đóng</button>
          ` : ''}
        </div>
      </div>`;
  }).join('');
}

async function viewComplaint(id) {
  const r = await API.get(API_ADM.complaints + '?action=detail&id=' + id);
  if (!r.success) return;
  const kn = r.khieu_nai;
  const st = statusComplaint(kn.trang_thai);
  const pr = priorityLabel(kn.uu_tien);

  let escrowHtml = '';
  if (r.escrow) {
    escrowHtml = `
      <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:10px;">
        <b>💰 Escrow liên quan:</b>
        <div style="font-size:13px;margin-top:6px;">
          Số tiền: <b>${fmtMoney(r.escrow.so_tien)}</b>
          • Phí DV: <b>${fmtMoney(r.escrow.phi_dich_vu)}</b>
          • Trạng thái: <b>${r.escrow.trang_thai}</b>
        </div>
      </div>`;
  }

  let refundsHtml = '';
  if (r.lich_su_hoan_tien?.length) {
    refundsHtml = `
      <div style="margin-top:16px;">
        <b>↩️ Lịch sử hoàn tiền:</b>
        ${r.lich_su_hoan_tien.map(h => `
          <div style="padding:8px;border-bottom:1px solid var(--border);font-size:13px;">
            ${fmtDateTime(h.created_at)} • ${fmtMoney(h.so_tien)} cho <b>${h.nguoi_nhan_loai}</b>
            <div style="color:var(--text-muted);font-size:12px;">${escapeHtml(h.ly_do || '')}</div>
          </div>
        `).join('')}
      </div>`;
  }

  openModal('Chi tiết khiếu nại #' + id, `
    <div style="display:flex;gap:6px;margin-bottom:12px;">
      <span class="adm-badge ${st.cls}">${st.label}</span>
      <span class="adm-badge ${pr.cls}">${pr.label}</span>
    </div>
    <div style="font-size:16px;font-weight:700;margin-bottom:8px;">${escapeHtml(kn.tieu_de)}</div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
      👤 ${escapeHtml(kn.nguoi_gui_ten)} (${kn.nguoi_gui_loai}) → ${escapeHtml(kn.doi_tuong_ten)}
      ${kn.ten_viec ? '<br>📌 ' + escapeHtml(kn.ten_viec) : ''}
    </div>
    <div style="background:#f8fafc;padding:12px;border-radius:10px;font-size:13px;">
      ${escapeHtml(kn.noi_dung).replace(/\n/g, '<br>')}
    </div>
    ${kn.bang_chung ? `<div style="margin-top:12px;font-size:13px;"><b>📎 Bằng chứng:</b><br>${escapeHtml(kn.bang_chung)}</div>` : ''}
    ${escrowHtml}
    ${refundsHtml}
    ${kn.ket_qua ? `
      <div style="margin-top:16px;padding:12px;background:#d1fae5;border-radius:10px;">
        <b>✅ Kết quả:</b><br>
        <div style="font-size:13px;margin-top:6px;">${escapeHtml(kn.ket_qua)}</div>
        <div style="font-size:12px;color:#065f46;margin-top:6px;">
          Hướng: <b>${kn.huong_xu_ly || '—'}</b> • Hoàn: <b>${fmtMoney(kn.so_tien_hoan)}</b>
        </div>
      </div>
    ` : ''}
  `, `<button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>`, 'large');
}

async function takeComplaint(id) {
  const priority = prompt('Mức ưu tiên (thap/trung_binh/cao/khan_cap):', 'trung_binh');
  if (!priority) return;
  const r = await API.post(API_ADM.complaints + '?action=take', { id, uu_tien: priority });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadComplaints();
}

async function resolveComplaint(id) {
  openModal('Hòa giải khiếu nại #' + id, `
    <div class="form-group">
      <label for="rs_ketqua">Kết quả hòa giải *</label>
      <textarea id="rs_ketqua" class="form-control" rows="4" placeholder="VD: Hai bên đã thống nhất hoàn 50%..."></textarea>
    </div>
    <div class="form-group">
      <label for="rs_huong">Hướng xử lý *</label>
      <select id="rs_huong" class="form-control">
        <option value="hoan_tien_sv">↩️ Hoàn tiền cho Sinh viên</option>
        <option value="hoan_tien_ntd">↩️ Hoàn tiền cho Nhà tuyển dụng</option>
        <option value="chia_doi">⚖️ Chia đôi</option>
        <option value="khong_hoan">❌ Không hoàn</option>
        <option value="khac">Khác</option>
      </select>
    </div>
    <div class="form-group">
      <label for="rs_sotien">Số tiền hoàn (VNĐ)</label>
      <input type="number" id="rs_sotien" class="form-control" value="0" min="0" step="1000">
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-adm" onclick="submitResolve(${id})">⚖️ Xác nhận</button>
  `);
}

async function submitResolve(id) {
  const ketQua = document.getElementById('rs_ketqua').value.trim();
  const huong = document.getElementById('rs_huong').value;
  const soTien = parseFloat(document.getElementById('rs_sotien').value) || 0;

  if (!ketQua) { toast('Vui lòng nhập kết quả', 'error'); return; }

  const r = await API.post(API_ADM.complaints + '?action=resolve', {
    id, ket_qua: ketQua, huong_xu_ly: huong, so_tien_hoan: soTien
  });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadComplaints(); }
}

async function closeComplaint(id) {
  const reason = prompt('Lý do đóng:', 'Đóng khiếu nại');
  if (!reason) return;
  const r = await API.post(API_ADM.complaints + '?action=close', { id, ly_do: reason });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadComplaints();
}

/* ============================================================
   HOÀN TIỀN
   ============================================================ */
async function loadRefunds() {
  const r = await API.get(API_ADM.refunds + '?action=list');
  const el = document.getElementById('refundsList');
  if (!el) return;

  const stats = await API.get(API_ADM.refunds + '?action=stats');
  if (stats.success) {
    document.getElementById('refundTotal').textContent = fmtMoney(stats.tong_hoan);
    document.getElementById('refundSV').textContent = fmtMoney(stats.cho_sv);
    document.getElementById('refundNTD').textContent = fmtMoney(stats.cho_ntd);
    document.getElementById('refundEscrow').textContent = fmtMoney(stats.escrow_dang_giu);
  }

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">↩️</div><p>Chưa có lịch sử hoàn tiền</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr><th>Ngày</th><th>Người nhận</th><th>Loại</th><th>Số tiền</th><th>Lý do</th><th>Admin</th></tr>
        </thead>
        <tbody>
          ${r.items.map(it => `
            <tr>
              <td>${fmtDateTime(it.created_at)}</td>
              <td>${escapeHtml(it.nguoi_nhan_ten || '—')}</td>
              <td><span class="adm-badge ${it.nguoi_nhan_loai === 'sinh_vien' ? 'blue' : 'purple'}">${it.nguoi_nhan_loai}</span></td>
              <td><b>${fmtMoney(it.so_tien)}</b></td>
              <td>${escapeHtml(it.ly_do || '')}</td>
              <td>${escapeHtml(it.admin_name || 'Hệ thống')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ============================================================
   SV TRƯỜNG (DB nhà trường)
   ============================================================ */
async function loadSvTruong() {
  const q = document.getElementById('svtSearch')?.value || '';
  const r = await API.get(`${API_ADM.svTruong}?action=list&q=${encodeURIComponent(q)}`);
  const el = document.getElementById('svTruongList');
  if (!el) return;

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">🏫</div><p>Chưa có dữ liệu</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>MSSV</th><th>Họ tên</th><th>Khoa</th><th>Ngành</th>
            <th>Năm</th><th>Trạng thái</th><th>Đã ĐK</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${r.items.map(it => `
            <tr>
              <td><b>${escapeHtml(it.ma_sinh_vien)}</b></td>
              <td>${escapeHtml(it.ho_ten)}</td>
              <td>${escapeHtml(it.khoa || '')}</td>
              <td>${escapeHtml(it.chuyen_nganh || '')}</td>
              <td>${it.nam_hoc || ''}</td>
              <td><span class="adm-badge ${it.trang_thai === 'dang_hoc' ? 'green' :
      it.trang_thai === 'tot_nghiep' ? 'blue' : 'red'
    }">${it.trang_thai}</span></td>
              <td>${it.da_dang_ky ? '✅' : '—'}</td>
              <td><button type="button" class="btn btn-sm btn-danger" onclick="deleteSvTruong(${it.id})">🗑️</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

async function openAddSvTruong() {
  openModal('Thêm sinh viên nhà trường', `
    <div class="form-2col">
      <div class="form-group"><label for="svt_mssv">MSSV *</label><input id="svt_mssv" class="form-control" required></div>
      <div class="form-group"><label for="svt_ten">Họ tên *</label><input id="svt_ten" class="form-control" required></div>
      <div class="form-group"><label for="svt_ngaysinh">Ngày sinh</label><input type="date" id="svt_ngaysinh" class="form-control"></div>
      <div class="form-group"><label for="svt_khoa">Khoa</label><input id="svt_khoa" class="form-control"></div>
      <div class="form-group"><label for="svt_nganh">Chuyên ngành</label><input id="svt_nganh" class="form-control"></div>
      <div class="form-group"><label for="svt_namhoc">Năm học</label><input type="number" id="svt_namhoc" class="form-control" min="1" max="7"></div>
      <div class="form-group"><label for="svt_lop">Lớp</label><input id="svt_lop" class="form-control"></div>
      <div class="form-group"><label for="svt_trangthai">Trạng thái</label>
        <select id="svt_trangthai" class="form-control">
          <option value="dang_hoc">Đang học</option>
          <option value="tot_nghiep">Tốt nghiệp</option>
          <option value="bi_dinh_chi">Bị đình chỉ</option>
        </select>
      </div>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-adm" onclick="submitAddSvTruong()">➕ Thêm</button>
  `);
}

async function submitAddSvTruong() {
  const d = {
    ma_sinh_vien: document.getElementById('svt_mssv').value.trim(),
    ho_ten: document.getElementById('svt_ten').value.trim(),
    ngay_sinh: document.getElementById('svt_ngaysinh').value,
    khoa: document.getElementById('svt_khoa').value.trim(),
    chuyen_nganh: document.getElementById('svt_nganh').value.trim(),
    nam_hoc: document.getElementById('svt_namhoc').value,
    lop: document.getElementById('svt_lop').value.trim(),
    trang_thai: document.getElementById('svt_trangthai').value
  };
  if (!d.ma_sinh_vien || !d.ho_ten) { toast('Nhập MSSV và họ tên', 'error'); return; }
  const r = await API.post(API_ADM.svTruong + '?action=add', d);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadSvTruong(); }
}

async function deleteSvTruong(id) {
  if (!confirm('Xóa SV khỏi DB nhà trường?')) return;
  const r = await API.del(API_ADM.svTruong + '?action=delete&id=' + id);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadSvTruong();
}

function importSvTruong() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async () => {
    if (!input.files[0]) return;
    const fd = new FormData();
    fd.append('file', input.files[0]);
    const r = await API.postForm(API_ADM.svTruong + '?action=import', fd);
    toast(r.message, r.success ? 'success' : 'error');
    if (r.success) loadSvTruong();
  };
  input.click();
}

/* ============================================================
   CÀI ĐẶT
   ============================================================ */
async function loadSettings() {
  const r = await API.get(API_ADM.settings + '?action=list');
  if (!r.success) return;
  CACHE.settings = r.items;

  const el = document.getElementById('settingsList');
  const infoEl = document.getElementById('systemInfo');

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
      ${Object.keys(r.items).map(k => {
    const it = r.items[k];
    return `
          <div class="form-group">
            <label for="cfg_${k}">${escapeHtml(it.mo_ta || k)} <small class="text-muted">(${k})</small></label>
            <input id="cfg_${k}" data-key="${k}" class="form-control" value="${escapeHtml(it.gia_tri || '')}">
          </div>`;
  }).join('')}
    </div>
    <button type="button" class="btn btn-adm" onclick="saveSettings()" style="margin-top:14px;">💾 Lưu cấu hình</button>
  `;

  // System info
  const info = await API.get(API_ADM.settings + '?action=system-info');
  if (info.success) {
    infoEl.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;font-size:13px;">
        <div><small class="text-muted">PHP Version</small><div><b>${info.php_version}</b></div></div>
        <div><small class="text-muted">MySQL</small><div><b>${info.mysql_version}</b></div></div>
        <div><small class="text-muted">DB Size</small><div><b>${info.db_size_mb} MB</b></div></div>
        <div><small class="text-muted">Tables</small><div><b>${info.tables}</b></div></div>
        <div><small class="text-muted">Uploads</small><div><b>${info.uploads_size_mb} MB</b></div></div>
        <div><small class="text-muted">Server time</small><div><b>${info.server_time}</b></div></div>
      </div>`;
  }
}

async function saveSettings() {
  const items = {};
  document.querySelectorAll('#settingsList [data-key]').forEach(el => {
    items[el.dataset.key] = el.value;
  });
  const r = await API.post(API_ADM.settings + '?action=update', { items });
  toast(r.message, r.success ? 'success' : 'error');
}

/* ============================================================
   NHẬT KÝ
   ============================================================ */
async function loadLogs() {
  const adminId = document.getElementById('logAdmin')?.value || '';
  const actionF = document.getElementById('logAction')?.value || '';
  const q = document.getElementById('logSearch')?.value || '';

  const url = `${API_ADM.logs}?action=list&admin_id=${adminId}&action=${actionF}&q=${encodeURIComponent(q)}`;
  const r = await API.get(url);
  const el = document.getElementById('logsList');
  if (!el) return;

  // Load admins filter
  const admins = await API.get(API_ADM.logs + '?action=admins');
  if (admins.success) {
    const sel = document.getElementById('logAdmin');
    if (sel && sel.options.length <= 1) {
      sel.innerHTML = '<option value="">Tất cả admin</option>' +
        admins.items.map(a => `<option value="${a.id}">${escapeHtml(a.ho_ten)}</option>`).join('');
    }
  }

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">📋</div><p>Không có nhật ký nào</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr><th>Thời gian</th><th>Admin</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th><th>IP</th></tr>
        </thead>
        <tbody>
          ${r.items.map(it => `
            <tr>
              <td style="white-space:nowrap;">${fmtDateTime(it.created_at)}</td>
              <td>${escapeHtml(it.admin_name)}</td>
              <td><span class="adm-badge purple">${escapeHtml(it.hanh_dong)}</span></td>
              <td>${it.doi_tuong_loai ? `${escapeHtml(it.doi_tuong_loai)} #${it.doi_tuong_id || ''}` : '—'}</td>
              <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(it.chi_tiet || '')}</td>
              <td><small>${escapeHtml(it.ip || '')}</small></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="text-align:center;padding:14px;color:var(--text-muted);font-size:13px;">
      Trang ${r.page} / ${r.total_pages}
    </div>`;
}

/* ============================================================
   THÔNG BÁO
   ============================================================ */
async function loadNotifications() {
  const r = await API.get(API_ADM.notifications);
  if (!r.success) return;
  const badge = document.getElementById('notiBadge');
  if (badge) {
    badge.textContent = r.unread;
    badge.classList.toggle('hidden', r.unread === 0);
  }
  CACHE.notifications = r.items;
}

async function loadNotificationsView() {
  const r = await API.get(API_ADM.notifications);
  if (!r.success) return;
  CACHE.notifications = r.items;

  const el = document.getElementById('notificationsList');
  if (!r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">🔔</div><p>Không có thông báo</p></div>`;
    return;
  }

  el.innerHTML = `
    <div style="margin-bottom:12px;">
      <button type="button" class="btn btn-ghost btn-sm" onclick="markAllRead()">✅ Đánh dấu đã đọc tất cả</button>
    </div>
    <div class="adm-noti-list">
      ${r.items.map(n => `
        <div class="adm-noti ${!n.da_doc ? 'unread' : ''}">
          <div class="noti-icon">${n.loai === 'warning' ? '⚠️' : n.loai === 'error' ? '❌' : 'ℹ️'}</div>
          <div class="noti-body">
            <div class="noti-title">${escapeHtml(n.tieu_de)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(n.noi_dung || '')}</div>
            <div class="noti-time">${fmtTimeAgo(n.created_at)}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

async function markAllRead() {
  await API.put(API_ADM.notifications, {});
  loadNotifications();
  loadNotificationsView();
}

/* ============================================================
   ADMIN MANAGEMENT
   ============================================================ */
async function loadAdmins() {
  const r = await API.get(API_ADM.admins + '?action=list');
  const el = document.getElementById('adminsList');
  if (!el) return;

  if (!r.success) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">🔒</div><p>Chỉ Super Admin được xem</p></div>`;
    return;
  }

  el.innerHTML = `
    <div style="margin-bottom:14px;">
      ${ADMIN.vai_tro === 'super_admin' ? `<button type="button" class="btn btn-adm btn-sm" onclick="openAddAdmin()">➕ Thêm admin</button>` : ''}
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Đăng nhập cuối</th>${ADMIN.vai_tro === 'super_admin' ? '<th></th>' : ''}</tr>
        </thead>
        <tbody>
          ${r.items.map(it => `
            <tr>
              <td><b>${escapeHtml(it.ho_ten)}</b></td>
              <td>${escapeHtml(it.email)}</td>
              <td><span class="adm-badge purple">${roleLabel(it.vai_tro)}</span></td>
              <td><span class="adm-badge ${it.trang_thai === 'hoat_dong' ? 'green' : 'red'}">${it.trang_thai}</span></td>
              <td>${it.last_login ? fmtDateTime(it.last_login) : 'Chưa'}</td>
              ${ADMIN.vai_tro === 'super_admin' ? `
                <td>
                  ${it.id !== ADMIN.id ? `<button type="button" class="btn btn-sm btn-danger" onclick="deleteAdmin(${it.id})">🗑️</button>` : ''}
                </td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function openAddAdmin() {
  openModal('Thêm admin mới', `
    <div class="form-group"><label for="adm_ten">Họ tên *</label><input id="adm_ten" class="form-control"></div>
    <div class="form-group"><label for="adm_email">Email *</label><input type="email" id="adm_email" class="form-control"></div>
    <div class="form-group"><label for="adm_pass">Mật khẩu *</label><input type="password" id="adm_pass" class="form-control" minlength="6"></div>
    <div class="form-group"><label for="adm_role">Vai trò</label>
      <select id="adm_role" class="form-control">
        <option value="admin">Admin</option>
        <option value="moderator">Kiểm duyệt viên</option>
        <option value="support">Hỗ trợ</option>
        <option value="super_admin">Super Admin</option>
      </select>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-adm" onclick="submitAddAdmin()">➕ Thêm</button>
  `);
}

async function submitAddAdmin() {
  const d = {
    ho_ten: document.getElementById('adm_ten').value.trim(),
    email: document.getElementById('adm_email').value.trim(),
    mat_khau: document.getElementById('adm_pass').value,
    vai_tro: document.getElementById('adm_role').value
  };
  if (!d.ho_ten || !d.email || !d.mat_khau) { toast('Nhập đủ thông tin', 'error'); return; }
  const r = await API.post(API_ADM.admins + '?action=create', d);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadAdmins(); }
}

async function deleteAdmin(id) {
  if (!confirm('XÓA admin này?')) return;
  const r = await API.del(API_ADM.admins + '?action=delete&id=' + id);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadAdmins();
}

/* ============================================================
   LOGOUT
   ============================================================ */
async function admLogout() {
  if (!confirm('Đăng xuất?')) return;
  await API.post(API_ADM.auth + '?action=logout', {});
  location.href = 'login.html';
}

/* ============================================================
   TỪ KHÓA CHẶN
   ============================================================ */
let ALL_KEYWORDS = [];

async function loadKeywords() {
  await Promise.all([loadKeywordsList(), loadKeywordsStats()]);
  bindKeywordForm();
}

async function loadKeywordsStats() {
  const r = await API.get(API_ADM.moderation + '?action=keywords-stats');
  if (!r.success) return;
  const s = r.stats;
  document.getElementById('kwStatTotal').textContent = s.tong || 0;
  document.getElementById('kwStatBlock').textContent = s.chan || 0;
  document.getElementById('kwStatWarn').textContent = s.canh_bao || 0;
}

async function loadKeywordsList() {
  const r = await API.get(API_ADM.moderation + '?action=keywords');
  const el = document.getElementById('keywordsList');
  if (!el) return;

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">🔑</div><p>Chưa có từ khóa nào</p></div>`;
    return;
  }

  ALL_KEYWORDS = r.items;
  renderKeywords(ALL_KEYWORDS);
}

function renderKeywords(items) {
  const el = document.getElementById('keywordsList');
  if (!items.length) {
    el.innerHTML = `<div class="adm-empty"><div class="icon">🔍</div><p>Không tìm thấy</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="kw-list">
      ${items.map(k => {
    const risk = riskLevel(k.muc_do_rui_ro);
    const actionCls = k.hanh_dong === 'chan' ? 'danger' : 'warning';
    const actionLabel = k.hanh_dong === 'chan' ? '🚫 Chặn' : '⚠️ Cảnh báo';
    const typeLabel = {
      lua_dao: '🚨 Lừa đảo',
      rui_ro: '⚠️ Rủi ro',
      khong_phu_hop: '🚫 Không phù hợp'
    }[k.loai] || k.loai;

    return `
          <div class="kw-item kw-${actionCls}">
            <div class="kw-item-head">
              <div class="kw-item-left">
                <div class="kw-item-keyword">🔑 ${escapeHtml(k.tu_khoa)}</div>
                <div class="kw-item-badges">
                  <span class="adm-badge ${actionCls}">${actionLabel}</span>
                  <span class="risk-badge ${risk.cls}">${risk.icon} ${k.muc_do_rui_ro}/10</span>
                  <span class="adm-badge gray">${typeLabel}</span>
                </div>
              </div>
              <div class="kw-item-actions">
                <button type="button" class="btn btn-sm btn-ghost"
                  onclick="editKeyword(${k.id})" title="Sửa">✏️</button>
                <button type="button" class="btn btn-sm btn-danger"
                  onclick="deleteKeywordItem(${k.id}, '${escAttr(k.tu_khoa)}')" title="Xóa">🗑️</button>
              </div>
            </div>
            ${k.ghi_chu ? `<div class="kw-item-note">📝 ${escapeHtml(k.ghi_chu)}</div>` : ''}
            <div class="kw-item-time">${fmtTimeAgo(k.created_at)}</div>
          </div>`;
  }).join('')}
    </div>`;
}

function filterKeywords() {
  const q = document.getElementById('kwSearch')?.value.toLowerCase().trim() || '';
  if (!q) { renderKeywords(ALL_KEYWORDS); return; }
  const filtered = ALL_KEYWORDS.filter(k =>
    k.tu_khoa.toLowerCase().includes(q) ||
    (k.ghi_chu || '').toLowerCase().includes(q)
  );
  renderKeywords(filtered);
}

function bindKeywordForm() {
  const form = document.getElementById('keywordForm');
  if (!form || form._bound) return;
  form._bound = true;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const keyword = document.getElementById('kw_text').value.trim();
    const score = parseInt(document.getElementById('kw_score').value) || 5;
    const type = document.getElementById('kw_type').value;
    const hanhDong = document.querySelector('input[name="kw_action"]:checked')?.value || 'chan';
    const ghiChu = document.getElementById('kw_note').value.trim();

    if (!keyword) { toast('Nhập từ khóa', 'error'); return; }

    const btn = document.getElementById('kwSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Đang thêm...';

    const r = await API.post(API_ADM.moderation + '?action=add-keyword', {
      tu_khoa: keyword,
      muc_do_rui_ro: score,
      loai: type,
      hanh_dong: hanhDong,
      ghi_chu: ghiChu
    });

    toast(r.message, r.success ? 'success' : 'error');

    if (r.success) {
      form.reset();
      document.getElementById('kw_score').value = '8';
      document.querySelector('input[name="kw_action"][value="chan"]').checked = true;
      await loadKeywords();
    }

    btn.disabled = false;
    btn.textContent = '🚫 Thêm từ khóa chặn';
  });
}

async function editKeyword(id) {
  const kw = ALL_KEYWORDS.find(x => x.id == id);
  if (!kw) return;

  openModal('✏️ Sửa từ khóa', `
    <div class="form-group">
      <label for="edit_kw_text">Từ khóa *</label>
      <input id="edit_kw_text" class="form-control" value="${escapeHtml(kw.tu_khoa)}">
    </div>
    <div class="form-2col">
      <div class="form-group">
        <label for="edit_kw_score">Mức rủi ro</label>
        <input type="number" id="edit_kw_score" class="form-control"
          value="${kw.muc_do_rui_ro}" min="1" max="10">
      </div>
      <div class="form-group">
        <label for="edit_kw_type">Loại</label>
        <select id="edit_kw_type" class="form-control">
          <option value="lua_dao" ${kw.loai === 'lua_dao' ? 'selected' : ''}>🚨 Lừa đảo</option>
          <option value="rui_ro" ${kw.loai === 'rui_ro' ? 'selected' : ''}>⚠️ Rủi ro</option>
          <option value="khong_phu_hop" ${kw.loai === 'khong_phu_hop' ? 'selected' : ''}>🚫 Không phù hợp</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Hành động</label>
      <div class="kw-radio-group">
        <label class="kw-radio">
          <input type="radio" name="edit_kw_action" value="chan" ${kw.hanh_dong === 'chan' ? 'checked' : ''}>
          <span class="kw-radio-content">
            <span class="kw-radio-icon">🚫</span>
            <span class="kw-radio-label">Chặn hoàn toàn</span>
          </span>
        </label>
        <label class="kw-radio">
          <input type="radio" name="edit_kw_action" value="canh_bao" ${kw.hanh_dong === 'canh_bao' ? 'checked' : ''}>
          <span class="kw-radio-content">
            <span class="kw-radio-icon">⚠️</span>
            <span class="kw-radio-label">Chỉ cảnh báo</span>
          </span>
        </label>
      </div>
    </div>
    <div class="form-group">
      <label for="edit_kw_note">Ghi chú</label>
      <textarea id="edit_kw_note" class="form-control" rows="3">${escapeHtml(kw.ghi_chu || '')}</textarea>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-adm" onclick="submitEditKeyword(${id})">💾 Lưu</button>
  `);
}

async function submitEditKeyword(id) {
  const d = {
    id,
    tu_khoa: document.getElementById('edit_kw_text').value.trim(),
    muc_do_rui_ro: parseInt(document.getElementById('edit_kw_score').value) || 5,
    loai: document.getElementById('edit_kw_type').value,
    hanh_dong: document.querySelector('input[name="edit_kw_action"]:checked')?.value || 'chan',
    ghi_chu: document.getElementById('edit_kw_note').value.trim()
  };

  if (!d.tu_khoa) { toast('Nhập từ khóa', 'error'); return; }

  const r = await API.post(API_ADM.moderation + '?action=update-keyword', d);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); await loadKeywords(); }
}

async function deleteKeywordItem(id, keyword) {
  if (!confirm(`Xóa từ khóa "${keyword}"?`)) return;
  const r = await API.del(API_ADM.moderation + '?action=delete-keyword&id=' + id);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) await loadKeywords();
}

/* --- Legacy: dùng prompt() (giữ lại để tương thích, phòng khi HTML còn gọi) --- */
async function manageKeywords() {
  const r = await API.get(API_ADM.moderation + '?action=keywords');
  if (!r.success) return;
  const html = `
    <div style="margin-bottom:14px;">
      <button type="button" class="btn btn-adm btn-sm" onclick="addKeyword()">➕ Thêm từ khóa</button>
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead><tr><th>Từ khóa</th><th>Mức rủi ro</th><th>Loại</th><th></th></tr></thead>
        <tbody>
          ${r.items.map(k => `
            <tr>
              <td><b>${escapeHtml(k.tu_khoa)}</b></td>
              <td><span class="risk-badge ${riskLevel(k.muc_do_rui_ro).cls}">${k.muc_do_rui_ro}/10</span></td>
              <td>${escapeHtml(k.loai)}</td>
              <td>
                <button type="button" class="btn btn-sm btn-danger" onclick="deleteKeyword(${k.id})">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
  openModal('Quản lý từ khóa cấm', html, `<button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>`, 'large');
}

async function addKeyword() {
  const kw = prompt('Từ khóa:');
  if (!kw) return;
  const score = parseInt(prompt('Mức rủi ro (1-10):', '8')) || 8;
  const type = prompt('Loại (lua_dao/rui_ro/khong_phu_hop):', 'lua_dao') || 'lua_dao';
  const r = await API.post(API_ADM.moderation + '?action=add-keyword', { tu_khoa: kw, muc_do_rui_ro: score, loai: type });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) manageKeywords();
}

async function deleteKeyword(id) {
  if (!confirm('Xóa từ khóa này?')) return;
  const r = await API.del(API_ADM.moderation + '?action=delete-keyword&id=' + id);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) manageKeywords();
}

/* ============================================================
   BIỂU ĐỒ KHIẾU NẠI
   ============================================================ */
async function drawComplaintChart() {
  const r = await API.get(API_ADM.complaints + '?action=stats-by-priority');
  if (!r.success) return;

  const p = r.by_priority || {};
  const data = [
    { label: 'Khẩn cấp', value: parseInt(p.khan_cap) || 0, color: '#ef4444', icon: '🚨' },
    { label: 'Cao', value: parseInt(p.cao) || 0, color: '#f59e0b', icon: '⚠️' },
    { label: 'Trung bình', value: parseInt(p.trung_binh) || 0, color: '#3b82f6', icon: '📌' },
    { label: 'Thấp', value: parseInt(p.thap) || 0, color: '#64748b', icon: '🔽' }
  ];

  const svg = document.getElementById('complaintChart');
  if (!svg) return;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    svg.innerHTML = `<text x="400" y="130" text-anchor="middle" font-size="14" fill="#94a3b8">
      Chưa có khiếu nại nào
    </text>`;
    return;
  }

  const W = 800, H = 260;
  const PAD_L = 60, PAD_R = 40, PAD_T = 30, PAD_B = 60;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  // Grid ngang + nhãn trục Y
  const grid = buildChartGrid({ W, PAD_L, PAD_R, PAD_T, PAD_B, chartH, maxVal });

  // Bars
  const barWidth = chartW / data.length * 0.55;
  const barGap = chartW / data.length;
  let bars = '';

  data.forEach((d, i) => {
    const x = PAD_L + i * barGap + (barGap - barWidth) / 2;
    const barH = (d.value / maxVal) * chartH;
    const y = PAD_T + chartH - barH;

    bars += `
      <defs>
        <linearGradient id="grad-${i}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${d.color}"/>
          <stop offset="100%" stop-color="${d.color}cc"/>
        </linearGradient>
      </defs>
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}"
        fill="url(#grad-${i})" rx="6" ry="6"
        style="animation: barGrow .8s ease-out ${i * 0.1}s both; transform-origin: bottom;">
      </rect>
      <text x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle"
        font-size="18" font-weight="800" fill="${d.color}">${d.value}</text>
      <text x="${x + barWidth / 2}" y="${PAD_T + chartH + 24}" text-anchor="middle"
        font-size="13" font-weight="600" fill="#334155">${d.icon} ${d.label}</text>
      <text x="${x + barWidth / 2}" y="${PAD_T + chartH + 44}" text-anchor="middle"
        font-size="11" fill="#94a3b8">${((d.value / total) * 100).toFixed(1)}%</text>
    `;
  });

  // Title
  const title = `<text x="${W / 2}" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="#334155">
    Tổng: ${total} khiếu nại
  </text>`;

  svg.innerHTML = `<style>
    @keyframes barGrow {
      from { transform: scaleY(0); opacity: 0; }
      to { transform: scaleY(1); opacity: 1; }
    }
  </style>${title}${grid}${bars}`;

  // Status bars
  const statusEl = document.getElementById('complaintStatusBars');
  if (statusEl) {
    const statusMap = {
      cho_xu_ly: { label: '⏳ Chờ xử lý', color: '#f59e0b' },
      dang_xu_ly: { label: '🔄 Đang xử lý', color: '#3b82f6' },
      da_giai_quyet: { label: '✅ Đã giải quyết', color: '#10b981' },
      da_dong: { label: '🔒 Đã đóng', color: '#94a3b8' }
    };

    const statusCounts = {};
    (r.by_status || []).forEach(s => { statusCounts[s.trang_thai] = parseInt(s.so_luong) || 0; });

    statusEl.innerHTML = Object.keys(statusMap).map(key => {
      const count = statusCounts[key] || 0;
      const pct = total > 0 ? (count / total * 100) : 0;
      return `
        <div class="status-bar-row">
          <div class="status-bar-label">${statusMap[key].label}</div>
          <div class="status-bar-track">
            <div class="status-bar-fill" style="width:${pct}%;background:${statusMap[key].color}"></div>
          </div>
          <div class="status-bar-count">${count} <small>(${pct.toFixed(0)}%)</small></div>
        </div>`;
    }).join('');
  }
}

/* ============================================================
   DOANH THU (REVENUE)
   ============================================================ */
let REVENUE_DATA = null;

async function loadRevenue() {
  const fromEl = document.getElementById('rev_from');
  const toEl = document.getElementById('rev_to');

  if (!fromEl.value) {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    fromEl.value = first.toISOString().slice(0, 10);
    toEl.value = today.toISOString().slice(0, 10);
  }

  const from = fromEl.value;
  const to = toEl.value;

  try {
    const r = await API.get(`${API_ADM.revenue}?action=summary&from=${from}&to=${to}`);
    if (!r.success) {
      toast(r.message || 'Lỗi tải doanh thu', 'error');
      return;
    }

    REVENUE_DATA = r;

    document.getElementById('revTotal').textContent = fmtMoney(r.total.revenue);
    document.getElementById('revNTD').textContent = fmtMoney(r.total.from_ntd);
    document.getElementById('revNTDSub').textContent = `${r.total.count_ntd} giao dịch`;
    document.getElementById('revSV').textContent = fmtMoney(r.total.from_sv);
    document.getElementById('revSVSub').textContent = `${r.total.count_sv} giao dịch`;
    document.getElementById('revCount').textContent = r.total.count_total;

    drawDailyRevenueChart(r.chart);
    drawMonthlyRevenueChart(r.monthly);

    renderTopList('topNTD', r.top_ntd, 'ten_cong_ty', false);
    renderTopList('topSV', r.top_sv, 'ho_ten', true);

  } catch (err) {
    console.error('[REVENUE] Error:', err);
    toast('Lỗi tải doanh thu: ' + err.message, 'error');
  }
}

function drawDailyRevenueChart(data) {
  const svg = document.getElementById('revenueChart');
  if (!svg) return;

  if (!data || !data.length) {
    svg.innerHTML = `<text x="400" y="130" text-anchor="middle" font-size="14" fill="#94a3b8">Chưa có dữ liệu</text>`;
    return;
  }

  const W = 800, H = 260;
  const PAD_L = 70, PAD_R = 30, PAD_T = 30, PAD_B = 50;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...data.map(d => Math.max(d.ntd, d.sv, d.tong)), 100000);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const toY = v => PAD_T + chartH - (v / maxVal) * chartH;
  const toX = i => PAD_L + i * stepX;

  // Grid + labels
  const grid = buildChartGrid({ W, PAD_L, PAD_R, PAD_T, PAD_B, chartH, maxVal, formatY: fmtMoneyShort });
  const xLabels = buildXLabels(data, toX, 10, H - 20);

  // 3 đường
  const lineNTD = data.map((d, i) => `${toX(i)},${toY(d.ntd)}`).join(' ');
  const lineSV = data.map((d, i) => `${toX(i)},${toY(d.sv)}`).join(' ');
  const lineTong = data.map((d, i) => `${toX(i)},${toY(d.tong)}`).join(' ');

  // Dots
  let dots = '';
  if (data.length <= 30) {
    data.forEach((d, i) => {
      dots += `<circle cx="${toX(i)}" cy="${toY(d.ntd)}" r="3" fill="#0ea5e9"/>`;
      dots += `<circle cx="${toX(i)}" cy="${toY(d.sv)}" r="3" fill="#10b981"/>`;
    });
  }

  svg.innerHTML = `
    ${grid}
    ${xLabels}
    <polyline points="${lineTong}" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${lineNTD}"  fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${lineSV}"   fill="none" stroke="#10b981" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
  `;
}

function drawMonthlyRevenueChart(data) {
  const svg = document.getElementById('revenueChartMonth');
  if (!svg || !data || !data.length) return;

  const W = 800, H = 260;
  const PAD_L = 70, PAD_R = 30, PAD_T = 30, PAD_B = 50;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...data.map(d => d.tong), 100000);
  const barW = (chartW / data.length) * 0.5;
  const gap = chartW / data.length;

  // Grid + labels
  const grid = buildChartGrid({ W, PAD_L, PAD_R, PAD_T, PAD_B, chartH, maxVal, formatY: fmtMoneyShort });

  // Bars (stacked)
  let bars = '';
  data.forEach((d, i) => {
    const x = PAD_L + i * gap + (gap - barW) / 2;
    const hNtd = (d.ntd / maxVal) * chartH;
    const hSv = (d.sv / maxVal) * chartH;

    bars += `<rect x="${x}" y="${PAD_T + chartH - hNtd}" width="${barW}" height="${hNtd}"
                   fill="#0ea5e9" rx="4" ry="4" opacity="0.9"/>`;
    bars += `<rect x="${x}" y="${PAD_T + chartH - hNtd - hSv}" width="${barW}" height="${hSv}"
                   fill="#10b981" rx="4" ry="4" opacity="0.9"/>`;
    bars += `<text x="${x + barW / 2}" y="${H - 20}" text-anchor="middle"
                   font-size="11" fill="#475569" font-weight="600">${d.month}</text>`;
    if (hNtd + hSv > 0) {
      bars += `<text x="${x + barW / 2}" y="${PAD_T + chartH - hNtd - hSv - 8}"
                     text-anchor="middle" font-size="11" fill="#8b5cf6" font-weight="700">
                 ${fmtMoneyShort(d.tong)}
               </text>`;
    }
  });

  svg.innerHTML = `${grid}${bars}`;
}

function fmtMoneyShort(n) {
  n = Number(n || 0);
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

function renderTopList(elId, items, nameKey, isSV = false) {
  const el = document.getElementById(elId);
  if (!el) return;

  if (!items || !items.length) {
    el.innerHTML = `<div class="adm-empty" style="padding:20px;">
      <div class="icon" style="font-size:36px;opacity:.4;">📊</div>
      <p style="font-size:13px;">Chưa có dữ liệu</p>
    </div>`;
    return;
  }

  el.innerHTML = items.map((it, i) => {
    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || (i + 1);
    const name = it[nameKey] || '—';
    const sub = isSV ? (it.ma_sinh_vien || '') : (it.so_gd + ' giao dịch');
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="width:32px;height:32px;border-radius:50%;background:${isSV ? '#dbeafe' : '#ede9fe'};
                    display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;">
          ${medal}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(name)}
          </div>
          <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(sub)}</div>
        </div>
        <div style="font-weight:700;color:${isSV ? '#10b981' : '#8b5cf6'};font-size:14px;">
          ${fmtMoney(it.doanh_thu)}
        </div>
      </div>`;
  }).join('');
}

function exportRevenue() {
  const from = document.getElementById('rev_from').value;
  const to = document.getElementById('rev_to').value;
  window.location.href = `${API_ADM.revenue}?action=export&from=${from}&to=${to}`;
}

/* ============================================================
   KẾT NỐI THÀNH CÔNG (SV ↔ NTD)
   ============================================================ */
let CONN_STATUS = 'all';

async function loadConnections() {
  const search = document.getElementById('connSearch')?.value || '';

  // Load stats
  const statsR = await API.get(API_ADM.connections + '?action=stats');
  if (statsR.success) {
    document.getElementById('connTotal').textContent = statsR.stats.tong || 0;
    document.getElementById('connWorking').textContent = statsR.stats.dang_lam || 0;
    document.getElementById('connDone').textContent = statsR.stats.hoan_thanh || 0;
    document.getElementById('connMoney').textContent = fmtMoney(statsR.money || 0);
  }

  // Load danh sách
  const r = await API.get(
    API_ADM.connections + '?action=list&status=' + CONN_STATUS + '&q=' + encodeURIComponent(search)
  );
  const el = document.getElementById('connectionsList');
  if (!el) return;

  if (!r.success || !r.items || !r.items.length) {
    el.innerHTML = `<div class="adm-empty">
      <div class="icon" style="font-size:44px;opacity:.4;">🔗</div>
      <p>Chưa có kết nối nào</p>
      <p class="text-muted" style="font-size:12px;">Kết nối xuất hiện khi NTD duyệt ứng tuyển của SV</p>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="conn-grid">${r.items.map(renderConnCard).join('')}</div>`;
}

function renderConnCard(it) {
  const svInitial = (it.sv_ten || '?').charAt(0).toUpperCase();
  const ntdInitial = (it.ten_cong_ty || '?').charAt(0).toUpperCase();

  const statusMap = {
    da_chap_nhan: { cls: 'warning', label: '⚙️ Đang làm việc' },
    hoan_thanh: { cls: 'success', label: '🎉 Hoàn thành' }
  };
  const st = statusMap[it.trang_thai] || { cls: 'gray', label: it.trang_thai };

  const salary = it.luong_min && it.luong_max && it.luong_min != it.luong_max
    ? `${fmtMoney(it.luong_min)} - ${fmtMoney(it.luong_max)}`
    : fmtMoney(it.luong_min || it.luong_max || 0);

  const typeLabel = {
    remote: '🌐 Online', onsite: '🏢 Offline', hybrid: '🔀 Kết hợp'
  }[it.loai_cong_viec] || '';

  const rating = it.danh_gia_diem || 0;
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  return `
    <div class="conn-card">
      <div class="conn-head">
        <div class="conn-avatars">
          <div class="conn-av sv-av">${svInitial}</div>
          <div class="conn-link-icon">🔗</div>
          <div class="conn-av ntd-av">${ntdInitial}</div>
        </div>
        <span class="adm-badge ${st.cls}">${st.label}</span>
      </div>

      <div class="conn-pair">
        <div class="conn-side">
          <div class="conn-name">${escapeHtml(it.sv_ten || '—')}</div>
          <div class="conn-sub">${escapeHtml(it.ma_sinh_vien || '')}</div>
          <div class="conn-sub">🏫 ${escapeHtml(it.truong || 'Chưa cập nhật')}</div>
        </div>
        <div class="conn-arrow">↔</div>
        <div class="conn-side conn-side-right">
          <div class="conn-name">${escapeHtml(it.ten_cong_ty || '—')}</div>
          <div class="conn-sub">${escapeHtml(it.ntd_loai || '')}</div>
        </div>
      </div>

      <div class="conn-job">
        📌 <b>${escapeHtml(it.tieu_de || '—')}</b>
      </div>

      <div class="conn-meta">
        ${typeLabel ? `<span class="adm-badge gray">${typeLabel}</span>` : ''}
        <span class="adm-badge purple">💰 ${salary}</span>
        ${it.ngay_giai_ngan ? `<span class="adm-badge success">💸 Đã trả</span>` : ''}
      </div>

      ${rating > 0 ? `
        <div class="conn-rating">
          <span class="conn-stars">${stars}</span>
          <span class="text-muted" style="font-size:12px;">(${it.danh_gia_diem}/5)</span>
        </div>` : ''}

      <div class="conn-time">
        🕒 Kết nối: ${fmtDateTime(it.created_at)}
      </div>

      <button type="button" class="btn btn-sm btn-adm" 
        onclick="viewConnectionDetail(${it.id})" style="width:100%;margin-top:8px;">
        👁️ Xem chi tiết
      </button>
    </div>`;
}

function filterConnections(status) {
  CONN_STATUS = status;
  document.querySelectorAll('[data-conn-status]').forEach(t => {
    t.classList.toggle('active', t.dataset.connStatus === status);
  });
  loadConnections();
}

async function viewConnectionDetail(id) {
  const r = await API.get(API_ADM.connections + '?action=detail&id=' + id);
  if (!r.success) { toast(r.message, 'error'); return; }
  const it = r.item;

  const stMap = {
    da_chap_nhan: '⚙️ Đang làm việc',
    hoan_thanh: '🎉 Hoàn thành',
    cho_duyet: '⏳ Chờ duyệt',
    tu_choi: '❌ Từ chối'
  };

  openModal('🔗 Chi tiết kết nối', `
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border);">
      <div class="avatar" style="width:60px;height:60px;font-size:24px;background:linear-gradient(135deg,#0ea5e9,#6366f1);">
        ${(it.sv_ten || '?').charAt(0).toUpperCase()}
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:700;">${escapeHtml(it.sv_ten)}</div>
        <div style="font-size:13px;color:var(--text-muted);">${escapeHtml(it.ma_sinh_vien || '')} • ${escapeHtml(it.truong || '')}</div>
      </div>
    </div>

    <div style="text-align:center;font-size:24px;margin:10px 0;">🔗</div>

    <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border);">
      <div class="avatar" style="width:60px;height:60px;font-size:24px;background:linear-gradient(135deg,#10b981,#059669);">
        ${(it.ten_cong_ty || '?').charAt(0).toUpperCase()}
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:700;">${escapeHtml(it.ten_cong_ty)}</div>
        <div style="font-size:13px;color:var(--text-muted);">${escapeHtml(it.ntd_email || '')}</div>
      </div>
    </div>

    <div style="display:grid;gap:10px;font-size:14px;">
      <div><b>📌 Công việc:</b> ${escapeHtml(it.tieu_de)}</div>
      <div><b>📝 Mô tả:</b> ${escapeHtml(it.mo_ta || '—')}</div>
      <div><b>💰 Thù lao:</b> ${fmtMoney(it.luong_min)} - ${fmtMoney(it.luong_max)}</div>
      <div><b>🎯 Hình thức:</b> ${escapeHtml(it.loai_cong_viec || '—')}</div>
      <div><b>📊 Trạng thái:</b> ${stMap[it.trang_thai] || it.trang_thai}</div>
      <div><b>💵 Tiền ký quỹ:</b> ${fmtMoney(it.so_tien || 0)} 
        <span class="adm-badge ${it.escrow_trang_thai === 'da_giai_ngan' ? 'success' : 'warning'}" style="margin-left:6px;">
          ${it.escrow_trang_thai || '—'}
        </span>
      </div>
      ${it.ngay_giai_ngan ? `<div><b>💸 Ngày giải ngân:</b> ${fmtDateTime(it.ngay_giai_ngan)}</div>` : ''}
      <div><b>🕒 Ngày kết nối:</b> ${fmtDateTime(it.created_at)}</div>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>
  `, 'large');
}