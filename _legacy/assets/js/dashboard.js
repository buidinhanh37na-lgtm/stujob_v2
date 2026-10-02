/* ============================================================
   STUDENT DASHBOARD — Main JS
   Bao gồm: Tổng quan, Hồ sơ, Chứng chỉ, Lịch học, Lịch rảnh,
   Việc làm (có khóa chat), Ứng tuyển, Nhiệm vụ, Ví, Chat, Thông báo
   ============================================================ */
let CURRENT_USER = null;
let SCHEDULE_CACHE = [];
let JOBS_CACHE = { phu_hop: [], tat_ca: [], da_ung_tuyen: [], trang_thai_ung_tuyen: {} };
let CHAT_PARTNER = null;
let JOB_FILTER = 'all';
/* ============ BOOT ============ */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await API.get('api/auth.php?action=me');
  if (!me.success) { location.href = 'login.html'; return; }

  CURRENT_USER = me.sinh_vien;
  renderUser();
  bindNav();
  bindMenu();
  bindModals();
  bindTabs();
  bindForms();

  // Load dữ liệu lần đầu
  await Promise.all([
    loadDashboard(),
    loadNotifications(),
    loadChatPartners(),
    loadInviteBadge()
  ]);

  // 🔄 Polling tự động refresh mỗi 30 giây
  setInterval(() => {
    if (document.hidden) return;

    // Luôn cập nhật badge
    loadInviteBadge();
    loadNotifications();

    // Refresh theo view đang mở
    const activeView = document.querySelector('.view.active')?.id;

    if (activeView === 'view-invitations') {
      loadInvitations();
    } else if (activeView === 'view-chat') {
      loadChatPartners();
      if (CHAT_PARTNER) loadChatMessages();
    } else if (activeView === 'view-applications') {
      loadApplications();
    } else if (activeView === 'view-tasks') {
      loadTasks();
    }
  }, 30000);
});

function renderUser() {
  const name = CURRENT_USER.ho_ten || 'Sinh viên';
  const initial = name.trim().charAt(0).toUpperCase();
  document.getElementById('sideName').textContent = name;
  document.getElementById('sideAvatar').textContent = initial;
}

/* ============ NAV ============ */
function bindNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const v = el.dataset.view;
      document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x === el));
      document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
      document.getElementById('view-' + v).classList.add('active');
      document.getElementById('pageTitle').textContent = el.textContent.trim().replace(/\s+/g, ' ').replace(/[0-9]+$/, '').trim();
      closeSidebar();
      loadView(v);
    });
  });
}

function loadView(v) {
  if (v === 'dashboard') loadDashboard();
  else if (v === 'profile') loadProfile();
  else if (v === 'certificates') loadCerts();
  else if (v === 'schedule') loadSchedule();
  else if (v === 'jobs') loadJobs();
  else if (v === 'applications') loadApplications();
  else if (v === 'invitations') loadInvitations();
  else if (v === 'tasks') loadTasks();
  else if (v === 'wallet') loadWallet();
  else if (v === 'chat') loadChatPartners();
  else if (v === 'notifications') loadNotifications();
}

/* ============ SIDEBAR MOBILE ============ */
function bindMenu() {
  document.getElementById('menuBtn').onclick = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
  };
  document.getElementById('overlay').onclick = closeSidebar;
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

/* ============ MODAL ============ */
function openModal(title, bodyHtml, footerHtml = '') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalFooter').innerHTML = footerHtml;
  document.getElementById('modal').classList.add('show');
}
function closeModal() { document.getElementById('modal').classList.remove('show'); }
function bindModals() {
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
}

/* ============ TABS ============ */
function bindTabs() {
  document.querySelectorAll('.tab[data-stab]').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab[data-stab]').forEach(x => x.classList.toggle('active', x === t));
      document.getElementById('stab-thoikhoabieu').classList.toggle('hidden', t.dataset.stab !== 'thoikhoabieu');
      document.getElementById('stab-lichranh').classList.toggle('hidden', t.dataset.stab !== 'lichranh');
      if (t.dataset.stab === 'lichranh') loadFreeTime();
    };
  });
  document.querySelectorAll('.tab[data-jtab]').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab[data-jtab]').forEach(x => x.classList.toggle('active', x === t));
      document.getElementById('jtab-phuhop').classList.toggle('hidden', t.dataset.jtab !== 'phuhop');
      document.getElementById('jtab-tatca').classList.toggle('hidden', t.dataset.jtab !== 'tatca');
    };
  });
}

/* ============ FORMS ============ */
function bindForms() {
  // Profile
  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target).entries());
    d.ky_nang = collectSkills();
    const r = await API.post('api/profile.php', d);
    toast(r.message || 'OK', r.success ? 'success' : 'error');
  });

  // Certificate
  const certForm = document.getElementById('certForm');
  if (certForm) {
    certForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await API.postForm('api/certificates.php', fd);
      toast(r.message || 'OK', r.success ? 'success' : 'error');
      if (r.success) { e.target.reset(); loadCerts(); }
    });
  }

  // CSV import
  const csvInput = document.getElementById('csvInput');
  if (csvInput) {
    csvInput.addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      const fd = new FormData(); fd.append('file', f);
      const r = await API.postForm('api/schedule.php?action=import', fd);
      toast(r.message, r.success ? 'success' : 'error');
      if (r.success) loadSchedule();
      e.target.value = '';
    });
  }

  // Chat
  document.getElementById('chatForm').addEventListener('submit', async e => {
    e.preventDefault();
    const inp = document.getElementById('chatInput');
    const txt = inp.value.trim();
    if (!txt || !CHAT_PARTNER) return;
    inp.value = '';
    const r = await API.post('api/chat.php', { nha_tuyen_dung_id: CHAT_PARTNER.id, noi_dung: txt });
    if (r.success) loadChatMessages();
    else toast(r.message || 'Lỗi', 'error');
  });

  // OCR cho chứng chỉ (nếu có trong HTML)
  const ocrCert = document.getElementById('ocr_cert');
  if (ocrCert && window.Tesseract && window.OCR) {
    ocrCert.addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f) return;
      const status = document.getElementById('ocr_cert_status');
      if (!status) return;
      status.className = 'ocr-status';
      status.innerHTML = '⏳ Đang tải công cụ OCR...';
      try {
        const result = await Tesseract.recognize(f, 'vie+eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              status.innerHTML = `⏳ Đang nhận dạng... ${Math.round(m.progress * 100)}%`;
            }
          }
        });
        const parsed = OCR.parseChungChi(result.data.text || '');
        const setIf = (id, val) => {
          if (!val) return false;
          const el = document.getElementById(id);
          if (el && !el.value.trim()) { el.value = val; return true; }
          return false;
        };
        let n = 0;
        if (setIf('cc_ten', parsed.ten_chung_chi)) n++;
        if (setIf('cc_to', parsed.to_chuc)) n++;
        if (setIf('cc_ngay', parsed.ngay_cap)) n++;

        const fileInput = document.getElementById('cc_file');
        if (fileInput) {
          const dt = new DataTransfer();
          dt.items.add(f);
          fileInput.files = dt.files;
        }

        status.className = 'ocr-status success';
        status.innerHTML = n > 0
          ? `✅ Đã điền ${n} trường. Kiểm tra lại trước khi tải lên.`
          : '⚠️ Không nhận diện được. Vui lòng nhập tay.';
      } catch (err) {
        status.className = 'ocr-status error';
        status.innerHTML = '❌ Lỗi OCR: ' + err.message;
      }
    });
  }
}

/* ============ DASHBOARD ============ */
async function loadDashboard() {
  const [j, w, t, a] = await Promise.all([
    API.get('api/jobs.php'),
    API.get('api/wallet.php'),
    API.get('api/tasks.php'),
    API.get('api/applications.php'),
  ]);
  JOBS_CACHE.phu_hop = j.phu_hop || [];
  JOBS_CACHE.tat_ca = j.tat_ca || [];
  JOBS_CACHE.da_ung_tuyen = j.da_ung_tuyen || [];
  JOBS_CACHE.trang_thai_ung_tuyen = j.trang_thai_ung_tuyen || {};

  document.getElementById('statJobs').textContent = JOBS_CACHE.phu_hop.length;
  document.getElementById('statBalance').textContent = fmtMoney(w.so_du || 0);
  document.getElementById('statTasks').textContent = (t.items || []).filter(x => x.trang_thai === 'dang_lam').length;
  document.getElementById('statApplied').textContent = (a.items || []).length;

  const wrap = document.getElementById('dashJobs');
  if (!JOBS_CACHE.phu_hop.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-icon">💼</div><p>Chưa có việc làm phù hợp. Hãy cập nhật lịch học của bạn!</p></div>`;
    return;
  }
  wrap.innerHTML = JOBS_CACHE.phu_hop.slice(0, 4).map(renderJobCard).join('');
}

function renderJobCard(j) {
  const status = (JOBS_CACHE.trang_thai_ung_tuyen || {})[j.id];
  const applied = status !== undefined;
  const canChat = status === 'da_chap_nhan' || status === 'hoan_thanh';

  const skillTags = (j.ky_nang_can || '').split(',').filter(Boolean).slice(0, 4)
    .map(s => `<span class="tag">${escapeHtml(s.trim())}</span>`).join('');

  const dayTags = (j.thu_lam_viec || '').split(',').filter(Boolean)
    .map(d => `<span class="tag primary">${thuName(+d)}</span>`).join('');

  const initial = (j.ten_cong_ty || '?').charAt(0).toUpperCase();
  const jobType = j.loai_cong_viec || 'remote';

  // ============ THỜI GIAN THEO LOẠI ============
  let timeInfo = '';
  if (jobType === 'remote') {
    timeInfo = `
      <span class="tag primary">🌐 Online</span>
      ${j.han_chot ? `<span class="tag">⏰ Hạn ứng tuyển: ${fmtDate(j.han_chot)}</span>` : ''}
      ${j.han_nop_file ? `<span class="tag warning">📤 Hạn nộp: ${fmtDate(j.han_nop_file)}</span>` : ''}
    `;
  } else if (jobType === 'onsite') {
    timeInfo = `
      <span class="tag">🏢 Offline</span>
      ${dayTags}
      ${j.gio_bat_dau ? `<span class="tag">🕒 ${j.gio_bat_dau.slice(0,5)}-${j.gio_ket_thuc.slice(0,5)}</span>` : ''}
      ${j.ngay_bat_dau ? `<span class="tag">📅 ${fmtDate(j.ngay_bat_dau)} → ${fmtDate(j.ngay_ket_thuc)}</span>` : ''}
    `;
  } else {
    timeInfo = `
      <span class="tag">🔀 Kết hợp</span>
      ${dayTags}
      ${j.gio_bat_dau ? `<span class="tag">🕒 ${j.gio_bat_dau.slice(0,5)}-${j.gio_ket_thuc.slice(0,5)}</span>` : ''}
      ${j.ngay_bat_dau ? `<span class="tag">📅 ${fmtDate(j.ngay_bat_dau)} → ${fmtDate(j.ngay_ket_thuc)}</span>` : ''}
      ${j.han_chot ? `<span class="tag">⏰ Hạn ứng tuyển: ${fmtDate(j.han_chot)}</span>` : ''}
      ${j.han_nop_file ? `<span class="tag warning">📤 Hạn nộp: ${fmtDate(j.han_nop_file)}</span>` : ''}
    `;
  }

  // ============ ĐIỂM PHÙ HỢP ============
  let matchBadge = '';
  if (j.diem_phu_hop > 0) {
    const score = j.diem_phu_hop;
    const cls = score >= 80 ? 'high' : score >= 65 ? 'mid' : 'low';
    const icon = score >= 80 ? '🎯' : score >= 65 ? '👍' : '📌';
    let tooltip = '';
    if (j.chi_tiet_diem) {
      tooltip = `Thời gian: ${j.chi_tiet_diem.thoi_gian}/40 | Kỹ năng: ${j.chi_tiet_diem.ky_nang}/35 | Chuyên ngành: ${j.chi_tiet_diem.chuyen_nganh}/25`;
    }
    matchBadge = `<span class="match-score ${cls}" title="${tooltip}">${icon} ${score}% phù hợp</span>`;
  }

  // ============ SỐ TIỀN ============
  const salary = Number(j.luong_min) || 0;
  const salaryText = `${salary.toLocaleString('vi-VN')}${j.don_vi_luong ? ' ' + j.don_vi_luong : 'đ'}`;

  // ============ NÚT HÀNH ĐỘNG ============
  let actionBtn = '';
  if (!applied) {
    actionBtn = `<button type="button" class="btn btn-sm btn-primary" onclick="applyJob(${j.id})">🚀 Ứng tuyển</button>`;
  } else if (status === 'cho_duyet') {
    actionBtn = `<button type="button" class="btn btn-sm btn-ghost" disabled>⏳ Chờ duyệt</button>`;
  } else if (status === 'tu_choi') {
    actionBtn = `<button type="button" class="btn btn-sm btn-ghost" disabled>❌ Đã từ chối</button>`;
  } else if (canChat) {
    actionBtn = `<button type="button" class="btn btn-sm btn-success" disabled>✅ Đã được nhận</button>`;
  }

  const chatBtn = canChat
    ? `<button type="button" class="btn btn-sm btn-primary"
              onclick="openChatWith(${j.nha_tuyen_dung_id}, ${JSON.stringify(j.ten_cong_ty).replace(/"/g, '&quot;')})">
         💬 Chat ngay
       </button>`
    : `<button type="button" class="btn btn-sm btn-ghost" disabled title="Chat mở sau khi được duyệt">🔒 Chat</button>`;

  return `
  <div class="job-card">
    <div class="job-head">
      <div class="job-logo">${initial}</div>
      <div style="flex:1; min-width:0;">
        <div class="job-title">${escapeHtml(j.tieu_de)}</div>
        <div class="job-company">${escapeHtml(j.ten_cong_ty)}</div>
      </div>
      ${matchBadge}
    </div>
    <div class="job-meta">${timeInfo}</div>
    <div class="job-desc">${escapeHtml(j.mo_ta || '')}</div>
    <div class="job-meta">
      ${skillTags}
      <span class="tag success">💵 ${salaryText}</span>
    </div>
    <div class="flex mt-3">
      ${actionBtn}
      ${chatBtn}
    </div>
  </div>`;
}

async function applyJob(id) {
  const r = await API.post('api/applications.php', { viec_lam_id: id });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadDashboard();
}

/* ============ PROFILE ============ */
async function loadProfile() {
  const r = await API.get('api/profile.php');
  if (!r.success) return;
  const sv = r.sinh_vien;
  const f = document.getElementById('profileForm');
  for (const k in sv) { if (f[k]) f[k].value = sv[k] ?? ''; }
  renderSkills(r.ky_nang || []);
}

function renderSkills(items) {
  const el = document.getElementById('skillsList');
  if (!items.length) { el.innerHTML = `<p class="text-muted">Chưa có kỹ năng nào.</p>`; return; }
  el.innerHTML = items.map((k, i) => `
    <div class="list-item" data-skill-idx="${i}">
      <div class="li-icon">🛠️</div>
      <div class="li-body">
        <label for="skill_name_${i}" class="sr-only">Tên kỹ năng</label>
        <input id="skill_name_${i}" class="form-control skill-name" value="${escapeHtml(k.ten_ky_nang)}" style="margin-bottom:6px;" placeholder="Tên kỹ năng">
        <label for="skill_lv_${i}" class="sr-only">Mức độ</label>
        <select id="skill_lv_${i}" class="form-control skill-lv">
          <option value="co_ban" ${k.muc_do === 'co_ban' ? 'selected' : ''}>Cơ bản</option>
          <option value="trung_binh" ${k.muc_do === 'trung_binh' ? 'selected' : ''}>Trung bình</option>
          <option value="kha" ${k.muc_do === 'kha' ? 'selected' : ''}>Khá</option>
          <option value="gioi" ${k.muc_do === 'gioi' ? 'selected' : ''}>Giỏi</option>
          <option value="xuat_sac" ${k.muc_do === 'xuat_sac' ? 'selected' : ''}>Xuất sắc</option>
        </select>
      </div>
      <button type="button" class="icon-btn" onclick="this.closest('.list-item').remove()" title="Xoá">🗑️</button>
    </div>
  `).join('');
}

function addSkill() {
  const wrap = document.getElementById('skillsList');
  if (wrap.querySelector('.text-muted')) wrap.innerHTML = '';
  const idx = Date.now();
  const div = document.createElement('div');
  div.className = 'list-item';
  div.innerHTML = `
    <div class="li-icon">🛠️</div>
    <div class="li-body">
      <label for="new_skill_name_${idx}" class="sr-only">Tên kỹ năng</label>
      <input id="new_skill_name_${idx}" class="form-control skill-name" placeholder="VD: JavaScript">
      <label for="new_skill_lv_${idx}" class="sr-only">Mức độ</label>
      <select id="new_skill_lv_${idx}" class="form-control skill-lv" style="margin-top:6px;">
        <option value="co_ban">Cơ bản</option>
        <option value="trung_binh" selected>Trung bình</option>
        <option value="kha">Khá</option>
        <option value="gioi">Giỏi</option>
        <option value="xuat_sac">Xuất sắc</option>
      </select>
    </div>
    <button type="button" class="icon-btn" onclick="this.closest('.list-item').remove()" title="Xoá">🗑️</button>
  `;
  wrap.appendChild(div);
}

function collectSkills() {
  return Array.from(document.querySelectorAll('#skillsList .list-item')).map(el => ({
    ten_ky_nang: el.querySelector('.skill-name').value.trim(),
    muc_do: el.querySelector('.skill-lv').value
  })).filter(x => x.ten_ky_nang);
}

/* ============ CERTIFICATES ============ */
async function loadCerts() {
  const r = await API.get('api/certificates.php');
  const el = document.getElementById('certList');
  if (!r.success || !r.items.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📜</div><p>Chưa có chứng chỉ nào</p></div>`;
    return;
  }
  el.innerHTML = r.items.map(c => `
    <div class="list-item">
      <div class="li-icon">📄</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(c.ten_chung_chi)}</div>
        <div class="li-sub">${escapeHtml(c.to_chuc || '')} ${c.ngay_cap ? '• ' + fmtDate(c.ngay_cap) : ''}</div>
      </div>
      <div class="li-actions">
        ${c.file_url ? `<a href="${c.file_url}" target="_blank" rel="noopener" class="btn btn-sm btn-ghost">Xem</a>` : ''}
        <button type="button" class="icon-btn" onclick="delCert(${c.id})" title="Xoá">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function delCert(id) {
  if (!confirm('Xoá chứng chỉ này?')) return;
  const r = await API.del('api/certificates.php?id=' + id);
  if (r.success) loadCerts();
}

/* ============ SCHEDULE ============ */
async function loadSchedule() {
  const r = await API.get('api/schedule.php');
  SCHEDULE_CACHE = r.items || [];
  const grid = document.getElementById('scheduleGrid');
  const days = [2, 3, 4, 5, 6, 7, 8];
  let html = `<div class="schedule-grid">`;
  html += `<div class="cell header">Giờ</div>`;
  days.forEach(d => html += `<div class="cell header">${thuName(d)}</div>`);
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  hours.forEach(h => {
    html += `<div class="cell time-col">${h}</div>`;
    days.forEach(d => {
      const evts = SCHEDULE_CACHE.filter(x => +x.thu === d && x.gio_bat_dau <= h + ':00' && x.gio_ket_thuc > h + ':00');
      html += `<div class="cell">`;
      evts.forEach(e => {
        html += `<div class="event">${escapeHtml(e.mon_hoc || '')}<br>${e.gio_bat_dau.slice(0, 5)}-${e.gio_ket_thuc.slice(0, 5)}</div>`;
      });
      html += `</div>`;
    });
  });
  html += `</div>`;
  grid.innerHTML = html;
}

function openAddSchedule() {
  openModal('Thêm lịch học', `
    <div class="form-group">
      <label for="s_thu">Thứ</label>
      <select id="s_thu" class="form-control">
        <option value="2">Thứ 2</option><option value="3">Thứ 3</option>
        <option value="4">Thứ 4</option><option value="5">Thứ 5</option>
        <option value="6">Thứ 6</option><option value="7">Thứ 7</option>
        <option value="8">Chủ nhật</option>
      </select>
    </div>
    <div class="form-group">
      <label for="s_start">Giờ bắt đầu</label>
      <input type="time" id="s_start" class="form-control" value="07:00">
    </div>
    <div class="form-group">
      <label for="s_end">Giờ kết thúc</label>
      <input type="time" id="s_end" class="form-control" value="09:30">
    </div>
    <div class="form-group">
      <label for="s_mon">Môn học</label>
      <input id="s_mon" class="form-control" placeholder="VD: Lập trình Web">
    </div>
    <div class="form-group">
      <label for="s_phong">Phòng học</label>
      <input id="s_phong" class="form-control" placeholder="VD: A101">
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-primary" onclick="saveSchedule()">Lưu</button>
  `);
}

async function saveSchedule() {
  const d = {
    thu: +document.getElementById('s_thu').value,
    gio_bat_dau: document.getElementById('s_start').value,
    gio_ket_thuc: document.getElementById('s_end').value,
    mon_hoc: document.getElementById('s_mon').value,
    phong_hoc: document.getElementById('s_phong').value
  };
  if (!d.gio_bat_dau || !d.gio_ket_thuc) return toast('Nhập đủ giờ', 'error');
  const r = await API.post('api/schedule.php', d);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadSchedule(); }
}

/* ============ FREE TIME ============ */
async function loadFreeTime() {
  const r = await API.get('api/free-time.php');
  if (!r.success) return;

  const grid = document.getElementById('freeAuto');
  const days = [2, 3, 4, 5, 6, 7, 8];
  let html = `<div class="schedule-grid">`;
  html += `<div class="cell header">Giờ</div>`;
  days.forEach(d => html += `<div class="cell header">${thuName(d)}</div>`);
  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  hours.forEach(h => {
    html += `<div class="cell time-col">${h}</div>`;
    days.forEach(d => {
      const evts = r.tu_dong.filter(x => +x.thu === d && x.gio_bat_dau <= h + ':00' && x.gio_ket_thuc > h + ':00');
      html += `<div class="cell">`;
      evts.forEach(e => html += `<div class="event free">Rảnh ${e.gio_bat_dau.slice(0, 5)}-${e.gio_ket_thuc.slice(0, 5)}</div>`);
      html += `</div>`;
    });
  });
  html += `</div>`;
  grid.innerHTML = html;

  const el = document.getElementById('freeManual');
  if (!r.thu_cong.length) {
    el.innerHTML = `<p class="text-muted">Chưa có lịch rảnh thủ công.</p>`;
    return;
  }
  el.innerHTML = r.thu_cong.map(f => `
    <div class="list-item">
      <div class="li-icon">🕒</div>
      <div class="li-body">
        <div class="li-title">${thuName(+f.thu)}</div>
        <div class="li-sub">${f.gio_bat_dau.slice(0, 5)} - ${f.gio_ket_thuc.slice(0, 5)}</div>
      </div>
      <button type="button" class="icon-btn" onclick="delFree(${f.id})" title="Xoá">🗑️</button>
    </div>
  `).join('');
}

function openAddFree() {
  openModal('Thêm lịch rảnh', `
    <div class="form-group">
      <label for="f_thu">Thứ</label>
      <select id="f_thu" class="form-control">
        <option value="2">Thứ 2</option><option value="3">Thứ 3</option>
        <option value="4">Thứ 4</option><option value="5">Thứ 5</option>
        <option value="6">Thứ 6</option><option value="7">Thứ 7</option>
        <option value="8">Chủ nhật</option>
      </select>
    </div>
    <div class="form-group">
      <label for="f_start">Giờ bắt đầu</label>
      <input type="time" id="f_start" class="form-control" value="18:00">
    </div>
    <div class="form-group">
      <label for="f_end">Giờ kết thúc</label>
      <input type="time" id="f_end" class="form-control" value="21:00">
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-primary" onclick="saveFree()">Lưu</button>
  `);
}

async function saveFree() {
  const d = {
    thu: +document.getElementById('f_thu').value,
    gio_bat_dau: document.getElementById('f_start').value,
    gio_ket_thuc: document.getElementById('f_end').value
  };
  const r = await API.post('api/free-time.php', d);
  toast('Đã lưu', r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadFreeTime(); }
}

async function delFree(id) {
  const r = await API.del('api/free-time.php?id=' + id);
  if (r.success) loadFreeTime();
}

/* ============ JOBS ============ */
async function loadJobs() {
  const r = await API.get('api/jobs.php');
  JOBS_CACHE = r;

  setupJobFilter();
  renderJobsFit();

  const all = document.getElementById('jobsAll');
  if (all) {
    all.innerHTML = (r.tat_ca || []).length
      ? r.tat_ca.map(renderJobCard).join('')
      : `<div class="empty"><div class="empty-icon">📢</div><p>Chưa có bài đăng nào.</p></div>`;
  }
}

/* ============ APPLICATIONS ============ */
async function loadApplications() {
  const r = await API.get('api/applications.php');
  const el = document.getElementById('appList');
  if (!r.items.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📨</div><p>Chưa ứng tuyển việc nào</p></div>`;
    return;
  }
  const statusMap = {
    cho_duyet: '⏳ Chờ duyệt',
    da_chap_nhan: '✅ Đã nhận',
    tu_choi: '❌ Từ chối',
    hoan_thanh: '🎉 Hoàn thành'
  };
  const tagClass = { cho_duyet: 'warning', da_chap_nhan: 'success', tu_choi: 'danger', hoan_thanh: 'primary' };
  el.innerHTML = r.items.map(a => `
    <div class="list-item">
      <div class="li-icon">📄</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(a.tieu_de)}</div>
        <div class="li-sub">${escapeHtml(a.ten_cong_ty)} • ${fmtDateTime(a.created_at)}</div>
      </div>
      <span class="tag ${tagClass[a.trang_thai]}">${statusMap[a.trang_thai]}</span>
    </div>
  `).join('');
}

/* ============ TASKS ============ */
async function loadTasks() {
  const r = await API.get('api/tasks.php');
  const el = document.getElementById('taskList');
  if (!r.items.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><p>Chưa có nhiệm vụ nào</p></div>`;
    return;
  }
  const statusMap = { dang_lam: '🔄 Đang làm', cho_duyet: '⏳ Chờ duyệt', hoan_thanh: '✅ Hoàn thành', qua_han: '⚠️ Quá hạn' };
  const tagClass = { dang_lam: 'warning', cho_duyet: 'primary', hoan_thanh: 'success', qua_han: 'danger' };
  el.innerHTML = r.items.map(t => `
    <div class="list-item">
      <div class="li-icon">📌</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(t.ten_nhiem_vu)}</div>
        <div class="li-sub">${t.ten_viec ? '📁 ' + escapeHtml(t.ten_viec) + ' • ' : ''}Hạn: ${t.han_nop ? fmtDateTime(t.han_nop) : 'Không'}</div>
      </div>
      <span class="tag ${tagClass[t.trang_thai]}">${statusMap[t.trang_thai]}</span>
      <div class="li-actions">
        <button type="button" class="btn btn-sm btn-outline" onclick="submitTask(${t.id})">📤 Nộp</button>
        ${t.file_san_pham ? `<a class="btn btn-sm btn-ghost" href="${t.file_san_pham}" target="_blank" rel="noopener">Xem</a>` : ''}
        <button type="button" class="icon-btn" onclick="delTask(${t.id})" title="Xoá">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openAddTask() {
  openModal('Thêm nhiệm vụ', `
    <div class="form-group">
      <label for="t_ten">Tên nhiệm vụ</label>
      <input id="t_ten" class="form-control" placeholder="VD: Hoàn thành báo cáo tuần">
    </div>
    <div class="form-group">
      <label for="t_mo">Mô tả</label>
      <textarea id="t_mo" class="form-control" rows="3" placeholder="Chi tiết nhiệm vụ..."></textarea>
    </div>
    <div class="form-group">
      <label for="t_han">Hạn nộp</label>
      <input type="datetime-local" id="t_han" class="form-control">
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-primary" onclick="saveTask()">Lưu</button>
  `);
}

async function saveTask() {
  const d = {
    ten_nhiem_vu: document.getElementById('t_ten').value.trim(),
    mo_ta: document.getElementById('t_mo').value,
    han_nop: document.getElementById('t_han').value ? document.getElementById('t_han').value.replace('T', ' ') + ':00' : null
  };
  if (!d.ten_nhiem_vu) return toast('Nhập tên nhiệm vụ', 'error');
  const r = await API.post('api/tasks.php', d);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadTasks(); }
}

function submitTask(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.jpg,.jpeg,.png,.webp';

  input.onchange = async () => {
    if (!input.files[0]) return;
    const file = input.files[0];

    if (file.size > 20 * 1024 * 1024) {
      toast('File tối đa 20MB', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('id', id);
    fd.append('file', file);

    const r = await API.postForm('api/tasks.php?action=submit', fd);
    toast(r.message, r.success ? 'success' : 'error');
    if (r.success) loadTasks();
  };

  input.click();
}

async function delTask(id) {
  if (!confirm('Xoá nhiệm vụ này?')) return;
  await API.del('api/tasks.php?id=' + id);
  loadTasks();
}

/* ============ WALLET ============ */
async function loadWallet() {
  const r = await API.get('api/wallet.php');
  document.getElementById('wBalance').textContent = fmtMoney(r.so_du || 0);
  document.getElementById('wThu').textContent = fmtMoney(r.tong_thu || 0);
  document.getElementById('wChi').textContent = fmtMoney(r.tong_chi || 0);

  // Lịch sử giao dịch
  const el = document.getElementById('txList');
  if (!r.items.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">💸</div><p>Chưa có giao dịch</p></div>`;
  } else {
    el.innerHTML = r.items.map(t => {
  const plus = t.loai === 'thu_nhap';
  const phi = parseFloat(t.phi_san || 0);
  const phiHtml = (phi > 0)
    ? `<span style="color:#ef4444;font-size:11px;margin-left:6px;">-${fmtMoney(phi)} phí</span>`
    : '';
  return `<div class="list-item">
    <div class="li-icon ${plus ? 'tx-icon plus' : 'tx-icon minus'}">${plus ? '⬆️' : '⬇️'}</div>
    <div class="li-body">
      <div class="li-title">${escapeHtml(t.mo_ta || (plus ? 'Thu nhập' : 'Rút tiền'))}</div>
      <div class="li-sub">${fmtDateTime(t.created_at)} • ${t.trang_thai}${phiHtml}</div>
    </div>
    <div class="li-amount ${plus ? 'plus' : 'minus'}">${plus ? '+' : '-'}${fmtMoney(t.so_tien)}</div>
  </div>`;
}).join('');
  }

  // Lịch sử rút tiền
  loadWithdrawHistory();
}

async function loadWithdrawHistory() {
  const r = await API.get('api/wallet.php?action=withdraw-history');
  const el = document.getElementById('withdrawList');
  if (!el) return;

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<p class="text-muted" style="padding:14px;">Chưa có yêu cầu rút tiền nào.</p>`;
    return;
  }

  const statusMap = {
    cho_xu_ly: { cls: 'warning', label: '⏳ Chờ admin duyệt' },
    da_duyet: { cls: 'primary', label: '✅ Đã duyệt' },
    da_chuyen: { cls: 'success', label: '💸 Đã chuyển tiền' },
    tu_choi: { cls: 'danger', label: '❌ Bị từ chối' }
  };

  el.innerHTML = r.items.map(it => {
    const st = statusMap[it.trang_thai] || { cls: 'warning', label: it.trang_thai };
    return `
      <div class="list-item">
        <div class="li-icon">${it.trang_thai === 'da_chuyen' ? '✅' : it.trang_thai === 'tu_choi' ? '❌' : '⏳'}</div>
        <div class="li-body">
          <div class="li-title">Rút ${fmtMoney(it.so_tien)}</div>
          <div class="li-sub">
            ${escapeHtml(it.ngan_hang)} • ${escapeHtml(it.so_tai_khoan)} • ${escapeHtml(it.chu_tai_khoan)}
          </div>
          <div class="li-sub">
            ${fmtDateTime(it.created_at)}
            ${it.ly_do_tu_choi ? ' • Lý do: ' + escapeHtml(it.ly_do_tu_choi) : ''}
          </div>
        </div>
        <span class="tag ${st.cls}">${st.label}</span>
      </div>`;
  }).join('');
}

/* ============ CHAT ============ */
async function loadChatPartners() {
  const r = await API.get('api/chat.php?action=partners');
  const el = document.getElementById('chatPartners');
  if (!r.items || !r.items.length) {
    el.innerHTML = `<div class="empty" style="padding:20px; font-size:13px;">
      <div class="empty-icon">💬</div>Chưa có cuộc trò chuyện nào
    </div>`;
    return;
  }
  el.innerHTML = r.items.map(p => `
    <button type="button" class="chat-partner" onclick="openChatWith(${p.id}, ${JSON.stringify(p.ten_cong_ty).replace(/"/g, '&quot;')})">
      <div class="avatar">${(p.ten_cong_ty || '?').charAt(0).toUpperCase()}</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(p.ten_cong_ty)}</div>
        <div class="li-sub">${escapeHtml(p.tin_cuoi || '')}</div>
      </div>
      ${p.chua_doc ? `<span class="badge">${p.chua_doc}</span>` : ''}
    </button>
  `).join('');
}

async function openChatWith(id, name) {
  CHAT_PARTNER = { id, name };
  document.getElementById('chatHeader').textContent = name;
  document.getElementById('chatInput').disabled = false;
  document.getElementById('chatSend').disabled = false;

  document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === 'chat'));
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById('view-chat').classList.add('active');
  closeSidebar();
  await loadChatMessages();
}

async function loadChatMessages() {
  if (!CHAT_PARTNER) return;
  const body = document.getElementById('chatBody');
  body.innerHTML = '<p class="text-muted" style="padding:20px;">Đang tải...</p>';

  const r = await API.get('api/chat.php?nha_tuyen_dung_id=' + CHAT_PARTNER.id);

  // Bị khóa chat
  if (r.locked) {
    body.innerHTML = `
      <div class="empty" style="margin:auto;">
        <div class="empty-icon">🔒</div>
        <p><b>Chat đang bị khóa</b></p>
        <p class="text-muted">${escapeHtml(r.message)}</p>
      </div>`;
    document.getElementById('chatInput').disabled = true;
    document.getElementById('chatSend').disabled = true;
    return;
  }

  if (!r.success) {
    body.innerHTML = `<p class="text-muted" style="padding:20px;">${escapeHtml(r.message || 'Lỗi tải tin nhắn')}</p>`;
    return;
  }

  body.innerHTML = (r.items || []).map(m => `
    <div class="msg ${m.nguoi_gui === 'sinh_vien' ? 'me' : 'them'}">
      ${escapeHtml(m.noi_dung)}
      <span class="msg-time">${fmtDateTime(m.created_at)}</span>
    </div>
  `).join('');
  body.scrollTop = body.scrollHeight;
}

/* ============ NOTIFICATIONS ============ */
async function loadNotifications() {
  const r = await API.get('api/notifications.php');
  const items = r.items || [];
  const unread = items.filter(x => !+x.da_doc).length;

  document.getElementById('topNotiDot').classList.toggle('hidden', unread === 0);
  const badge = document.getElementById('notiBadge');
  badge.textContent = unread;
  badge.classList.toggle('hidden', unread === 0);

  const el = document.getElementById('notiList');
  if (!items.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🔔</div><p>Không có thông báo</p></div>`;
    return;
  }
  el.innerHTML = items.map(n => `
    <div class="list-item ${+n.da_doc === 0 ? 'noti-unread' : ''}">
      <div class="li-icon">${n.loai === 'success' ? '✅' : 'ℹ️'}</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(n.tieu_de)}</div>
        <div class="li-sub">${escapeHtml(n.noi_dung || '')} • ${fmtDateTime(n.created_at)}</div>
      </div>
    </div>
  `).join('');

  // Đánh dấu đã đọc
  // Chỉ đánh dấu đã đọc khi user đang mở VIEW thông báo
  const isViewingNoti = document.getElementById('view-notifications')?.classList.contains('active');
  if (unread && isViewingNoti) {
    API.put('api/notifications.php', {});
  }
}

/* ============ LOGOUT ============ */
async function logout() {
  if (!confirm('Đăng xuất khỏi tài khoản?')) return;
  await API.post('api/auth.php?action=logout', {});
  location.href = 'login.html';
}


/* ============================================================
   LỜI MỜI LÀM VIỆC
   ============================================================ */
async function loadInvitations() {
  const status = document.getElementById('inviteStatus')?.value || 'cho_duyet';
  const r = await API.get(`api/invitations.php?action=list&status=${status}`);
  const el = document.getElementById('invitationsList');
  if (!el) return;

  // Update badge
  updateInviteBadge(r.pending || 0);

  if (!r.success || !r.items?.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📬</div>
      <p>Không có lời mời nào</p>
      <p class="text-muted">Khi NTD mời bạn làm việc, lời mời sẽ xuất hiện ở đây.</p>
    </div>`;
    return;
  }

  const statusMap = {
    cho_duyet: { cls: 'warning', label: '⏳ Chờ bạn trả lời' },
    da_chap_nhan: { cls: 'success', label: '✅ Đã chấp nhận' },
    tu_choi: { cls: 'danger', label: '❌ Đã từ chối' }
  };

  el.innerHTML = r.items.map(it => {
    const st = statusMap[it.trang_thai] || { cls: 'warning', label: it.trang_thai };
    const initial = (it.ten_cong_ty || '?').charAt(0).toUpperCase();
    const salary = it.luong_min
      ? `${fmtMoney(it.luong_min)}${it.luong_max && it.luong_max != it.luong_min ? ' - ' + fmtMoney(it.luong_max) : ''}`
      : 'Thỏa thuận';

    // Hình thức
    const typeLabel = {
      remote: '🌐 Remote',
      onsite: '🏢 Onsite',
      hybrid: '🔀 Hybrid'
    }[it.loai_cong_viec] || '';

    // Thời gian
    let timeInfo = '';
    if (it.loai_cong_viec === 'remote') {
      if (it.han_chot) timeInfo = `⏰ Hạn chót: ${fmtDate(it.han_chot)}`;
    } else {
      if (it.ngay_bat_dau && it.ngay_ket_thuc) {
        timeInfo = `📅 ${fmtDate(it.ngay_bat_dau)} → ${fmtDate(it.ngay_ket_thuc)}`;
      }
    }

    // Buttons
    let actions = '';
    if (it.trang_thai === 'cho_duyet') {
      actions = `
        <button type="button" class="btn btn-sm btn-outline"
                onclick="viewInvitation(${it.id})">👁️ Xem chi tiết</button>
        <button type="button" class="btn btn-sm btn-success"
                onclick="acceptInvitation(${it.id})">✅ Chấp nhận</button>
        <button type="button" class="btn btn-sm btn-danger"
                onclick="rejectInvitation(${it.id})">❌ Từ chối</button>`;
    } else if (it.trang_thai === 'da_chap_nhan') {
      actions = `
        <button type="button" class="btn btn-sm btn-ghost"
                onclick="viewInvitation(${it.id})">👁️ Chi tiết</button>
        <button type="button" class="btn btn-sm btn-primary"
                onclick="openChatWith(${it.ntd_id}, '${escapeHtml(it.ten_cong_ty).replace(/'/g, "\\'")}')">
          💬 Chat NTD
        </button>`;
    } else {
      actions = `<button type="button" class="btn btn-sm btn-ghost"
                onclick="viewInvitation(${it.id})">👁️ Chi tiết</button>`;
    }

    return `
      <div class="invitation-card">
        <div class="invitation-head">
          <div class="invitation-logo">${initial}</div>
          <div class="invitation-info">
            <div class="invitation-company">${escapeHtml(it.ten_cong_ty)}</div>
            <div class="invitation-sub">${escapeHtml(it.linh_vuc || '')}</div>
          </div>
          <span class="tag ${st.cls}">${st.label}</span>
        </div>

        <div class="invitation-title">📌 ${escapeHtml(it.tieu_de)}</div>

        <div class="invitation-meta">
          ${typeLabel ? `<span class="tag">${typeLabel}</span>` : ''}
          <span class="tag success">💰 ${salary}</span>
          ${timeInfo ? `<span class="tag">${timeInfo}</span>` : ''}
        </div>

        ${it.loi_nhan ? `
          <div class="invitation-message">
            <b>💬 Lời nhắn từ NTD:</b>
            <div>${escapeHtml(it.loi_nhan)}</div>
          </div>` : ''}

        <div class="invitation-actions">${actions}</div>
      </div>`;
  }).join('');
}

async function viewInvitation(id) {
  const r = await API.get('api/invitations.php?action=detail&id=' + id);
  if (!r.success) { toast(r.message, 'error'); return; }
  const it = r.invitation;

  const salary = it.luong_min
    ? `${fmtMoney(it.luong_min)}${it.luong_max && it.luong_max != it.luong_min ? ' - ' + fmtMoney(it.luong_max) : ''}`
    : 'Thỏa thuận';

  const typeLabel = {
    remote: '🌐 Remote (làm từ xa)',
    onsite: '🏢 Onsite (tại văn phòng)',
    hybrid: '🔀 Hybrid (kết hợp)'
  }[it.loai_cong_viec] || '';

  // Build time info
  let timeBlock = '';
  if (it.loai_cong_viec === 'remote') {
    timeBlock = `
      <div class="detail-row">
        <span class="detail-icon">⏰</span>
        <div><b>Hạn chót:</b> ${it.han_chot ? fmtDate(it.han_chot) : 'Không giới hạn'}</div>
      </div>`;
  } else {
    timeBlock = `
      <div class="detail-row">
        <span class="detail-icon">📅</span>
        <div>
          <b>Thời gian làm việc:</b><br>
          Từ <b>${it.ngay_bat_dau ? fmtDate(it.ngay_bat_dau) : '?'}</b>
          đến <b>${it.ngay_ket_thuc ? fmtDate(it.ngay_ket_thuc) : '?'}</b>
        </div>
      </div>
      ${it.dia_chi_lam_viec ? `
        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <div><b>Địa chỉ làm việc:</b> ${escapeHtml(it.dia_chi_lam_viec)}</div>
        </div>` : ''}`;
  }

  // Skills
  const skills = (it.ky_nang_can || '').split(',').filter(Boolean)
    .map(s => `<span class="tag">${escapeHtml(s.trim())}</span>`).join('');

  // Days
  const days = (it.thu_lam_viec || '').split(',').filter(Boolean)
    .map(d => `<span class="tag primary">${thuName(+d)}</span>`).join('');

  let actionsHtml = '';
  if (it.trang_thai === 'cho_duyet') {
    actionsHtml = `
      <button type="button" class="btn btn-danger" onclick="rejectInvitation(${it.id})">❌ Từ chối</button>
      <button type="button" class="btn btn-success" onclick="acceptInvitation(${it.id})">✅ Chấp nhận lời mời</button>`;
  } else if (it.trang_thai === 'da_chap_nhan') {
    actionsHtml = `
      <button type="button" class="btn btn-primary"
              onclick="closeModal(); openChatWith(${it.ntd_id}, '${escapeHtml(it.ten_cong_ty).replace(/'/g, "\\'")}')">
        💬 Chat với NTD
      </button>`;
  }

  openModal('📬 Chi tiết lời mời', `
    <div class="inv-detail">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">
        <div class="inv-detail-logo">${(it.ten_cong_ty || '?').charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-size:16px;font-weight:700;">${escapeHtml(it.ten_cong_ty)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(it.linh_vuc || '')}</div>
          ${it.ntd_dia_chi ? `<div style="font-size:12px;color:var(--text-muted);">📍 ${escapeHtml(it.ntd_dia_chi)}</div>` : ''}
        </div>
      </div>

      <h3 style="font-size:17px;margin-bottom:10px;">📌 ${escapeHtml(it.tieu_de)}</h3>

      ${it.loi_nhan ? `
        <div style="background:#f0f9ff;padding:12px;border-radius:10px;margin-bottom:14px;border-left:3px solid #0ea5e9;">
          <b>💬 Lời nhắn từ NTD:</b>
          <div style="margin-top:6px;font-size:13px;">${escapeHtml(it.loi_nhan)}</div>
        </div>` : ''}

      <div class="inv-detail-grid">
        ${timeBlock}
        ${it.gio_bat_dau ? `
          <div class="detail-row">
            <span class="detail-icon">🕒</span>
            <div><b>Giờ làm:</b> ${it.gio_bat_dau.slice(0, 5)} - ${it.gio_ket_thuc.slice(0, 5)}</div>
          </div>` : ''}
        ${days ? `
          <div class="detail-row">
            <span class="detail-icon">📆</span>
            <div><b>Ngày trong tuần:</b> ${days}</div>
          </div>` : ''}
        <div class="detail-row">
          <span class="detail-icon">💰</span>
          <div><b>Thù lao:</b> <span style="color:#10b981;font-weight:700;">${salary}</span></div>
        </div>
        ${it.so_luong_can > 0 ? `
          <div class="detail-row">
            <span class="detail-icon">👥</span>
            <div><b>Số lượng cần:</b> ${it.so_luong_can} người</div>
          </div>` : ''}
        ${it.so_buoi > 0 ? `
          <div class="detail-row">
            <span class="detail-icon">📊</span>
            <div><b>Số buổi:</b> ${it.so_buoi} buổi
            ${it.gio_uoc_tinh > 0 ? ' • ' + it.gio_uoc_tinh + ' giờ ước tính' : ''}</div>
          </div>` : ''}
      </div>

      ${it.mo_ta ? `
        <div style="margin-top:16px;">
          <b>📝 Mô tả công việc:</b>
          <div style="background:#f8fafc;padding:12px;border-radius:10px;margin-top:6px;font-size:13px;line-height:1.6;">
            ${escapeHtml(it.mo_ta).replace(/\n/g, '<br>')}
          </div>
        </div>` : ''}

      ${skills ? `
        <div style="margin-top:14px;">
          <b>🛠️ Kỹ năng yêu cầu:</b>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">${skills}</div>
        </div>` : ''}
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>
    ${actionsHtml}
  `, 'large');
}

async function acceptInvitation(id) {
  if (!confirm('Chấp nhận lời mời này?\nSau khi chấp nhận, NTD sẽ ký quỹ và bạn có thể bắt đầu làm việc.')) return;

  const r = await API.post('api/invitations.php?action=accept', { id });
  toast(r.message, r.success ? 'success' : 'error');

  if (r.success) {
    closeModal();
    loadInvitations();
    loadInviteBadge();
  }
}

async function rejectInvitation(id) {
  const reason = prompt('Lý do từ chối (tùy chọn):');
  if (reason === null) return;

  const r = await API.post('api/invitations.php?action=reject', { id, ly_do: reason });
  toast(r.message, r.success ? 'success' : 'error');

  if (r.success) {
    closeModal();
    loadInvitations();
    loadInviteBadge();
  }
}

async function loadInviteBadge() {
  const r = await API.get('api/invitations.php?action=count');
  if (!r.success) return;
  updateInviteBadge(r.count || 0);
}

function updateInviteBadge(count) {
  const badge = document.getElementById('inviteBadge');
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}


/* ============================================================
   ĐIỀU HƯỚNG THÔNG BÁO
   ============================================================ */
function goToNotifications() {
  // Đổi active menu
  document.querySelectorAll('.nav-item').forEach(x => {
    x.classList.toggle('active', x.dataset.view === 'notifications');
  });
  // Đổi view hiển thị
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById('view-notifications')?.classList.add('active');
  document.getElementById('pageTitle').textContent = 'Thông báo';
  closeSidebar();
  loadNotifications();
}

/* ============ FILTER VIỆC LÀM PHÙ HỢP ============ */
function setupJobFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.onclick = () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      JOB_FILTER = btn.dataset.loai;
      renderJobsFit();
    };
  });
}

function renderJobsFit() {
  const jobs = JOBS_CACHE.phu_hop || [];
  const filtered = JOB_FILTER === 'all'
    ? jobs
    : jobs.filter(j => (j.loai_cong_viec || 'remote') === JOB_FILTER);

  const el = document.getElementById('jobsFit');
  if (!el) return;

  if (!filtered.length) {
    const typeLabel = {
      all: '', remote: 'online',
      onsite: 'offline (làm tại chỗ)', hybrid: 'kết hợp'
    }[JOB_FILTER];
    el.innerHTML = `<div class="empty">
      <div class="empty-icon">${JOB_FILTER === 'all' ? '⭐' : '🔍'}</div>
      <p>Không có việc ${typeLabel} nào phù hợp</p>
      <p class="text-muted">Thử đổi bộ lọc hoặc cập nhật thời khoá biểu</p>
    </div>`;
    return;
  }

  el.innerHTML = filtered.map(renderJobCard).join('');
}

/* ============================================================
   RÚT TIỀN
   ============================================================ */
async function openWithdrawModal() {
  // Lấy số dư mới nhất
  const r = await API.get('api/wallet.php');
  const balance = r.so_du || 0;

  if (balance < 50000) {
    toast('Số dư tối thiểu 50.000đ mới có thể rút', 'error');
    return;
  }

  openModal('💰 Rút tiền', `
    <div class="info-box" style="background:#f0f9ff;padding:12px 14px;border-radius:10px;margin-bottom:14px;border-left:4px solid #0ea5e9;">
      <div style="font-size:12px;color:#6b7280;">Số dư khả dụng</div>
      <div style="font-size:22px;font-weight:800;color:#0ea5e9;">${fmtMoney(balance)}</div>
    </div>

    <div class="form-group">
      <label for="wd_amount">Số tiền muốn rút *</label>
      <input type="number" id="wd_amount" class="form-control" 
             min="50000" max="50000000" step="10000" 
             placeholder="Tối thiểu 50.000đ" required>
      <small class="form-hint">Tối thiểu 50.000đ • Tối đa 50.000.000đ</small>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
        <button type="button" class="btn btn-sm btn-ghost" onclick="setWithdrawAmount(${balance})">Rút hết</button>
        <button type="button" class="btn btn-sm btn-ghost" onclick="setWithdrawAmount(100000)">100K</button>
        <button type="button" class="btn btn-sm btn-ghost" onclick="setWithdrawAmount(500000)">500K</button>
        <button type="button" class="btn btn-sm btn-ghost" onclick="setWithdrawAmount(1000000)">1TR</button>
      </div>
    </div>

    <div class="form-group">
      <label for="wd_bank">Ngân hàng *</label>
      <select id="wd_bank" class="form-control" required>
        <option value="">-- Chọn ngân hàng --</option>
        <option value="Vietcombank">Vietcombank</option>
        <option value="Techcombank">Techcombank</option>
        <option value="BIDV">BIDV</option>
        <option value="VietinBank">VietinBank</option>
        <option value="MB Bank">MB Bank</option>
        <option value="ACB">ACB</option>
        <option value="Sacombank">Sacombank</option>
        <option value="TPBank">TPBank</option>
        <option value="VPBank">VPBank</option>
        <option value="Agribank">Agribank</option>
        <option value="Momo">Ví MoMo</option>
        <option value="ZaloPay">ZaloPay</option>
      </select>
    </div>

    <div class="form-group">
      <label for="wd_account">Số tài khoản *</label>
      <input type="text" id="wd_account" class="form-control" 
             placeholder="VD: 0123456789" required>
    </div>

    <div class="form-group">
      <label for="wd_name">Chủ tài khoản *</label>
      <input type="text" id="wd_name" class="form-control" 
             placeholder="VD: NGUYEN VAN A" 
             style="text-transform:uppercase;" required>
    </div>

    <div style="background:#fef3c7;padding:10px 12px;border-radius:8px;font-size:12px;color:#92400e;border-left:3px solid #f59e0b;">
      ⚠️ Yêu cầu sẽ được admin duyệt trong 1-2 ngày làm việc. Tiền sẽ được chuyển vào tài khoản đã đăng ký.
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-primary" onclick="submitWithdraw()" id="wdBtn">📤 Gửi yêu cầu</button>
  `);
}

function setWithdrawAmount(amount) {
  const el = document.getElementById('wd_amount');
  if (el) el.value = Math.floor(amount);
}

async function submitWithdraw() {
  const amount = parseFloat(document.getElementById('wd_amount').value) || 0;
  const bank = document.getElementById('wd_bank').value;
  const account = document.getElementById('wd_account').value.trim();
  const name = document.getElementById('wd_name').value.trim().toUpperCase();

  if (amount < 50000) { toast('Số tiền tối thiểu 50.000đ', 'error'); return; }
  if (!bank) { toast('Chọn ngân hàng', 'error'); return; }
  if (!account) { toast('Nhập số tài khoản', 'error'); return; }
  if (!name) { toast('Nhập chủ tài khoản', 'error'); return; }

  const btn = document.getElementById('wdBtn');
  btn.disabled = true;
  btn.textContent = 'Đang gửi...';

  const r = await API.post('api/wallet.php?action=withdraw', {
    so_tien: amount,
    ngan_hang: bank,
    so_tai_khoan: account,
    chu_tai_khoan: name
  });

  toast(r.message, r.success ? 'success' : 'error');

  if (r.success) {
    closeModal();
    loadWallet();
  } else {
    btn.disabled = false;
    btn.textContent = '📤 Gửi yêu cầu';
  }
}