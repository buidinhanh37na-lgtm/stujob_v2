/* ============================================================
   EMPLOYER DASHBOARD — Main Logic
   ============================================================ */
let EMPLOYER = null;
let JOBS_CACHE = [];
let CHAT_STUDENT = null;
let CURRENT_PAGE = 'dashboard';

/* ============ HELPERS ============ */
/* Escape HTML rồi escape dấu ' để nhét an toàn vào onclick="" */
function escAttr(s) {
  return escapeHtml(String(s == null ? '' : s)).replace(/'/g, "\\'");
}

/* Map trạng thái ứng tuyển — DÙNG CHUNG cho cả renderAppRow & renderAppRowCompact */
function getAppStatus(trangThai) {
  const map = {
    cho_duyet:    { cls: 'warning', label: '⏳ Chờ duyệt' },
    cho_xu_ly:    { cls: 'warning', label: '⏳ Chờ xử lý' },
    da_chap_nhan: { cls: 'success', label: '✅ Đã nhận' },
    chap_nhan:    { cls: 'success', label: '✅ Đã nhận' },
    tu_choi:      { cls: 'danger',  label: '❌ Từ chối' },
    hoan_thanh:   { cls: 'primary', label: '🎉 Hoàn thành' }
  };
  return map[trangThai] || { cls: 'warning', label: trangThai };
}

/* ============ BOOT ============ */
document.addEventListener('DOMContentLoaded', async () => {
  const me = await API.get(API_EMP.auth + '?action=me');
  if (!me.success) { location.href = 'login.html'; return; }
  EMPLOYER = me.nha_tuyen_dung;
  renderUser();
  bindNav();
  bindMenu();
  bindModals();
  bindTabs();
  bindForms();
  await Promise.all([loadDashboard(), loadNotifications(), loadChatPartners()]);
});

function renderUser() {
  const name = EMPLOYER.ten_cong_ty || 'Nhà tuyển dụng';
  const initial = name.charAt(0).toUpperCase();
  document.getElementById('sideName').textContent = name;
  document.getElementById('sideAvatar').textContent = initial;
  const typeMap = { ca_nhan: 'Cá nhân', ho_kinh_doanh: 'Hộ KD', doanh_nghiep: 'Doanh nghiệp' };
  document.getElementById('sideRole').textContent = typeMap[EMPLOYER.loai] || 'NTD';
}

/* ============ NAV ============ */
function bindNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const v = el.dataset.view;
      document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x === el));
      document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
      const view = document.getElementById('view-' + v);
      if (view) view.classList.add('active');
      document.getElementById('pageTitle').textContent = el.textContent.trim().replace(/\s+/g, ' ').replace(/[0-9]+$/, '').trim();
      closeSidebar();
      CURRENT_PAGE = v;
      loadView(v);
    });
  });
}

function loadView(v) {
  if (v === 'dashboard') loadDashboard();
  else if (v === 'profile') loadProfile();
  else if (v === 'post-job') loadJobForm();
  else if (v === 'my-jobs') loadMyJobs();
  else if (v === 'candidates') loadCandidateForm();
  else if (v === 'applications') loadApplications();
  else if (v === 'chat') loadChatPartners();
  else if (v === 'escrow') loadEscrow();
  else if (v === 'acceptance') loadAcceptance();
  else if (v === 'ratings') loadRatings();
  else if (v === 'reports') loadReports();
  else if (v === 'notifications') loadNotifications();
}

/* ============ SIDEBAR ============ */
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
  const m = document.getElementById('modal');
  if (m) m.addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
}

/* ============ TABS ============ */
function bindTabs() {
  document.querySelectorAll('.tab[data-jtab]').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab[data-jtab]').forEach(x => x.classList.toggle('active', x === t));
      const a = document.getElementById('jtab-phuhop');
      const b = document.getElementById('jtab-tatca');
      if (a) a.classList.toggle('hidden', t.dataset.jtab !== 'phuhop');
      if (b) b.classList.toggle('hidden', t.dataset.jtab !== 'tatca');
    };
  });
}

/* ============ FORMS ============ */
function bindForms() {
  // Profile form
  const pf = document.getElementById('profileForm');
  if (pf && !pf._bound) {
    pf._bound = true;
    pf.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await API.postForm(API_EMP.profile, fd);
      toast(r.message || 'OK', r.success ? 'success' : 'error');
      if (r.success) loadProfile();
    });
  }

  // Job form
  const jf = document.getElementById('jobForm');
  if (jf && !jf._bound) {
    jf._bound = true;
    jf.addEventListener('submit', async e => {
      e.preventDefault();

      const type = document.getElementById('j_loai').value;

      // ⭐ Tự build payload — chỉ lấy field của hình thức đang hiển thị
      const payload = {
        nhom_viec_id: document.getElementById('j_nhom_id')?.value || '',
        tieu_de: document.getElementById('j_tieude')?.value.trim() || '',
        mo_ta: document.getElementById('j_mota')?.value || '',
        ky_nang_can: document.getElementById('j_kynang')?.value || '',
        thu_lao: parseFloat(document.getElementById('j_thulao')?.value) || 0,
        loai_cong_viec: type,
        so_luong_can: parseInt(document.getElementById('j_soluong')?.value) || 1,
        so_buoi: parseInt(document.getElementById('j_sobuoi')?.value) || 1,
        gio_uoc_tinh: parseInt(document.getElementById('j_giouoc')?.value) || 0
      };

      if (type === 'remote') {
        payload.han_chot = document.getElementById('j_han')?.value || '';
        payload.han_nop_file = document.getElementById('j_han_nop_r')?.value || '';
        payload.ngay_bat_dau = null;
        payload.ngay_ket_thuc = null;
        payload.dia_chi_lam_viec = '';

        if (!payload.han_chot) return toast('Chọn hạn ứng tuyển', 'error');
        if (!payload.han_nop_file) return toast('Chọn hạn nộp sản phẩm', 'error');
        if (payload.han_nop_file < payload.han_chot) {
          return toast('Hạn nộp phải sau hạn ứng tuyển', 'error');
        }
      } else {
        payload.han_chot = document.getElementById('j_han_onsite')?.value || '';
        payload.ngay_bat_dau = document.getElementById('j_ngay_bd')?.value || '';
        payload.ngay_ket_thuc = document.getElementById('j_ngay_kt')?.value || '';
        payload.han_nop_file = document.getElementById('j_han_nop_o')?.value || '';
        payload.dia_chi_lam_viec = document.getElementById('j_diachi')?.value.trim() || '';

        if (!payload.han_chot) return toast('Chọn hạn ứng tuyển', 'error');
        if (!payload.ngay_bat_dau || !payload.ngay_ket_thuc) {
          return toast('Chọn ngày bắt đầu và kết thúc', 'error');
        }
        if (!payload.han_nop_file) return toast('Chọn hạn nộp sản phẩm', 'error');
        if (!payload.dia_chi_lam_viec) return toast('Nhập địa chỉ làm việc', 'error');

        if (payload.ngay_bat_dau > payload.ngay_ket_thuc) {
          return toast('Ngày kết thúc phải sau ngày bắt đầu', 'error');
        }
        if (payload.han_chot > payload.ngay_bat_dau) {
          return toast('Hạn ứng tuyển phải trước ngày bắt đầu', 'error');
        }
        if (payload.han_nop_file < payload.ngay_ket_thuc) {
          return toast('Hạn nộp phải sau ngày kết thúc', 'error');
        }
      }

      const r = await API.post(API_EMP.postJob, payload);
      toast(r.message, r.success ? 'success' : 'error');
      if (r.success) {
        e.target.reset();
        setTimeout(() => {
          document.querySelector('.nav-item[data-view="my-jobs"]')?.click();
        }, 600);
      }
    });
  }

  // Deposit form
  const df = document.getElementById('depositForm');
  if (df && !df._bound) {
    df._bound = true;
    df.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await API.postForm(API_EMP.escrow + '?action=deposit', fd);
      toast(r.message, r.success ? 'success' : 'error');
      if (r.success) { e.target.reset(); loadEscrow(); }
    });
  }

  // Chat form
  const cf = document.getElementById('chatForm');
  if (cf && !cf._bound) {
    cf._bound = true;
    cf.addEventListener('submit', async e => {
      e.preventDefault();
      const inp = document.getElementById('chatInput');
      const txt = inp.value.trim();
      if (!txt || !CHAT_STUDENT) return;
      inp.value = '';
      const r = await API.post(API_EMP.messages, {
        sinh_vien_id: CHAT_STUDENT.id,
        noi_dung: txt
      });
      if (r.success) loadChatMessages();
      else toast(r.message || 'Lỗi', 'error');
    });
  }
}

/* ============ DASHBOARD ============ */
async function loadDashboard() {
  const [jobs, apps, escrow] = await Promise.all([
    API.get(API_EMP.myJobs),
    API.get(API_EMP.applications),
    API.get(API_EMP.escrow)
  ]);

  JOBS_CACHE = jobs.items || [];
  const appsArr = apps.items || [];

  document.getElementById('statJobs').textContent = JOBS_CACHE.filter(j => j.trang_thai === 'dang_mo').length;
  document.getElementById('statApps').textContent = appsArr.filter(a => a.trang_thai === 'cho_duyet').length;
  document.getElementById('statDeposit').textContent = fmtMoney(escrow.tong_ky_quy || 0);
  document.getElementById('statWorking').textContent = appsArr.filter(a => a.trang_thai === 'da_chap_nhan').length;

  const wrap = document.getElementById('dashApps');
  if (!wrap) return;

  const recent = appsArr.slice(0, 6);
  if (!recent.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-icon">📨</div><p>Chưa có ứng tuyển nào</p></div>`;
    return;
  }
  wrap.innerHTML = `<div class="dash-app-grid">${recent.map(renderAppRowCompact).join('')}</div>`;
}


/* ============ PROFILE ============ */
async function loadProfile() {
  const r = await API.get(API_EMP.profile);
  if (!r.success) return;
  const n = r.nha_tuyen_dung;
  const typeMap = { ca_nhan: 'Cá nhân', ho_kinh_doanh: 'Hộ kinh doanh', doanh_nghiep: 'Doanh nghiệp' };
  const verifyMap = { chua: '🔴 Chưa xác thực', dang_cho: '🟡 Đang chờ', da_xac_thuc: '✅ Đã xác thực' };

  let html = `
    <div class="list-item">
      <div class="li-icon">🏢</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(n.ten_cong_ty)}</div>
        <div class="li-sub">${typeMap[n.loai] || ''} • ${escapeHtml(n.email)}</div>
      </div>
      <span class="verify-badge ${n.trang_thai_xac_thuc}">${verifyMap[n.trang_thai_xac_thuc] || ''}</span>
    </div>`;

  if (n.ma_so_thue) html += `<div class="list-item"><div class="li-icon">🔢</div><div class="li-body"><div class="li-title">Mã số thuế</div><div class="li-sub">${escapeHtml(n.ma_so_thue)}</div></div></div>`;
  if (n.ma_so_hkd) html += `<div class="list-item"><div class="li-icon">🔢</div><div class="li-body"><div class="li-title">Mã số HKD</div><div class="li-sub">${escapeHtml(n.ma_so_hkd)}</div></div></div>`;
  if (n.cccd) html += `<div class="list-item"><div class="li-icon">🆔</div><div class="li-body"><div class="li-title">CCCD</div><div class="li-sub">${escapeHtml(n.cccd)}</div></div></div>`;
  if (n.dia_chi) html += `<div class="list-item"><div class="li-icon">📍</div><div class="li-body"><div class="li-title">Địa chỉ</div><div class="li-sub">${escapeHtml(n.dia_chi)}</div></div></div>`;

  document.getElementById('profileInfo').innerHTML = html;

  // Fill form
  const f = document.getElementById('profileForm');
  if (f) {
    // Email là field disabled — set riêng
    const emailEl = document.getElementById('pf_email');
    if (emailEl) emailEl.value = n.email || '';

    const map = {
      ten_cong_ty: 'pf_ten', nguoi_dai_dien: 'pf_daidien', so_dien_thoai: 'pf_sdt',
      dia_chi: 'pf_diachi', linh_vuc: 'pf_linhvuc', ma_so_thue: 'pf_mst',
      ma_so_hkd: 'pf_hkd', cccd: 'pf_cccd', website: 'pf_website', mo_ta: 'pf_mota'
    };
    for (const [key, id] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) el.value = n[key] || '';
    }
  }

  // Setup OCR verify
  const verifyTitle = document.getElementById('verify_title');
  if (verifyTitle) verifyTitle.textContent = `Upload ảnh ${typeMap[n.loai]} để xác thực`;
  setupVerifyOCR(n.loai);
}

function setupVerifyOCR(loai) {
  const input = document.getElementById('verify_file');
  const status = document.getElementById('verify_status');
  if (!input || !status) return;

  input.onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    status.className = 'ocr-status';
    status.innerHTML = '⏳ Đang quét...';
    try {
      const { parsed } = await OCR.scanEmployer(f, loai, pct => {
        status.innerHTML = `⏳ Đang nhận dạng... ${pct}%`;
      });
      const r = await API.put(API_EMP.profile, {
        cccd: parsed.cccd,
        ma_so_thue: parsed.ma_so_thue,
        ma_so_hkd: parsed.ma_so_hkd
      });
      if (r.match) {
        status.className = 'ocr-status success';
        status.innerHTML = '✅ Xác thực thành công!';
        loadProfile();
      } else {
        status.className = 'ocr-status error';
        status.innerHTML = '❌ ' + r.message;
      }
    } catch (err) {
      status.className = 'ocr-status error';
      status.innerHTML = '❌ Lỗi: ' + err.message;
    }
    input.value = '';
  };
}

/* ============ ĐĂNG TIN ============ */
async function loadJobForm() {
  setupJobTypeToggle();
  const r = await API.get(API_EMP.templates + '?action=categories');
  const sel = document.getElementById('tpl_cat');
  const candSel = document.getElementById('cand_cat');
  if (!r.success) return;

  const opts = r.items.map(c => `<option value="${c.id}">${c.icon || '📁'} ${escapeHtml(c.ten_nhom)}</option>`).join('');
  if (sel) sel.innerHTML = '<option value="">-- Chọn nhóm --</option>' + opts;
  if (candSel) candSel.innerHTML = '<option value="">Tất cả</option>' + opts;

  if (sel) {
    sel.onchange = async () => {
      document.getElementById('j_nhom_id').value = sel.value;
      const tplSel = document.getElementById('tpl_sel');
      tplSel.innerHTML = '<option value="">-- Chọn mẫu --</option>';
      if (!sel.value) return;
      const r2 = await API.get(API_EMP.templates + '?action=templates&nhom_viec_id=' + sel.value);
      if (r2.success) {
        tplSel.innerHTML += r2.items.map(m => `<option value="${m.id}">${escapeHtml(m.ten_mau)}</option>`).join('');
        tplSel._data = r2.items;
      }
    };
  }

  const tplSel = document.getElementById('tpl_sel');
  if (tplSel) {
    tplSel.onchange = function () {
      const m = this._data?.find(x => x.id == this.value);
      if (!m) return;
      document.getElementById('j_tieude').value = m.tieu_de_goi_y || '';
      document.getElementById('j_mota').value = m.mo_ta_goi_y || '';
      document.getElementById('j_kynang').value = m.ky_nang_goi_y || '';
      if (m.luong_min) document.getElementById('j_luong_min').value = m.luong_min;
      if (m.luong_max) document.getElementById('j_luong_max').value = m.luong_max;
      toast('Đã điền mẫu tin', 'success');
    };
  }
}

/* ============ TIN VIỆC CỦA TÔI ============ */
async function loadMyJobs() {
  const r = await API.get(API_EMP.myJobs);
  const el = document.getElementById('jobsList');
  if (!el) return;
  if (!r.items?.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><p>Chưa có tin việc nào</p></div>`;
    return;
  }
  el.innerHTML = r.items.map(j => `
    <div class="list-item">
      <div class="li-icon">📝</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(j.tieu_de)}</div>
        <div class="li-sub">
          ${j.icon || '📁'} ${escapeHtml(j.ten_nhom || 'Khác')} • ${j.so_ung_tuyen || 0} ứng tuyển
          • ${j.trang_thai === 'dang_mo' ? '🟢 Đang mở' : '🔴 Đã đóng'}
          ${j.phi_dich_vu > 0 ? ' • Phí DV: ' + fmtMoney(j.phi_dich_vu) : ''}
        </div>
      </div>
      <div class="li-actions">
        <button type="button" class="btn btn-sm btn-ghost" onclick="toggleJobStatus(${j.id}, '${j.trang_thai === 'dang_mo' ? 'da_dong' : 'dang_mo'}')">
          ${j.trang_thai === 'dang_mo' ? 'Đóng' : 'Mở lại'}
        </button>
        <button type="button" class="icon-btn" onclick="deleteJob(${j.id})" title="Xoá">🗑️</button>
      </div>
    </div>
  `).join('');

  // Reset form khi vào lại
  const jf = document.getElementById('jobForm');
  if (jf) {
    jf.reset();
    document.getElementById('j_loai').value = 'remote';
    updateJobTypeForm();
  }
}

async function toggleJobStatus(id, status) {
  const r = await API.put(API_EMP.myJobs, { id, trang_thai: status });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadMyJobs();
}
async function deleteJob(id) {
  if (!confirm('Xoá tin việc này?')) return;
  const r = await API.del(API_EMP.myJobs + '?id=' + id);
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadMyJobs();
}

/* ============ GỢI Ý ỨNG VIÊN ============ */
async function loadCandidateForm() {
  const r = await API.get(API_EMP.templates + '?action=categories');
  const sel = document.getElementById('cand_cat');
  if (sel && r.success) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">📋 Tất cả nhóm việc</option>' +
      r.items.map(c => `<option value="${c.id}">${c.icon || '📁'} ${escapeHtml(c.ten_nhom)}</option>`).join('');
    sel.value = cur;
    // ⚡ Tự động load lại khi đổi filter
    sel.onchange = () => loadCandidates();
  }

  // Auto-load lần đầu
  await loadCandidates();
}

async function loadCandidates() {
  const cat = document.getElementById('cand_cat')?.value || 0;
  const radius = document.getElementById('cand_radius')?.value || 0;
  const sort = document.getElementById('cand_sort')?.value || 'phu_hop';

  const el = document.getElementById('candList');
  if (!el) return;
  el.innerHTML = '<p class="text-muted" style="padding:14px;">Đang tải sinh viên...</p>';

  try {
    const r = await API.get(`${API_EMP.candidates}?nhom_viec_id=${cat}&ban_kinh=${radius}&sap_xep=${sort}`);

    if (!r.success) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><p>Lỗi: ${escapeHtml(r.message || 'Không tải được')}</p></div>`;
      return;
    }

    if (!r.items || !r.items.length) {
      el.innerHTML = `<div class="empty"><div class="empty-icon">🎯</div>
        <p>Không có sinh viên phù hợp với bộ lọc</p>
        <p class="text-muted" style="font-size:12px;">Thử bỏ bộ lọc hoặc thêm sinh viên mới</p>
      </div>`;
      return;
    }

    // ⚡ Grid 2 cột
    el.innerHTML = `<div class="cand-grid">${r.items.map(c => {
      const cls = c.diem_phu_hop >= 70 ? 'high' : c.diem_phu_hop >= 50 ? 'mid' : 'low';
      const skills = (c.ky_nang || []).slice(0, 3)
        .map(k => `<span class="tag tag-xs">${escapeHtml(k)}</span>`).join('');
      const initial = (c.ho_ten || '?').charAt(0).toUpperCase();

      return `
        <div class="cand-card">
          <div class="cand-head">
            <div class="cand-avatar">${initial}</div>
            <div class="cand-info">
              <div class="cand-name">${escapeHtml(c.ho_ten)}</div>
              <div class="cand-sub">${escapeHtml(c.ma_sinh_vien || '')}</div>
            </div>
            <span class="match-score ${cls}">${c.diem_phu_hop}%</span>
          </div>

          <div class="cand-meta">
            ${renderStarsCompact(c.diem_danh_gia || 0)}
            <span class="text-muted" style="font-size:11px;">(${c.so_lan_danh_gia || 0})</span>
            ${c.gpa ? `<span class="tag tag-xs">GPA ${c.gpa}</span>` : ''}
          </div>

          <div class="cand-school">🏫 ${escapeHtml(c.truong || 'Chưa cập nhật')}</div>

          <div class="cand-skills">${skills || '<span class="text-muted" style="font-size:11px;">Chưa có kỹ năng</span>'}</div>

          <div class="cand-actions">
            <button type="button" class="btn btn-xs btn-ghost" onclick="viewCandidate(${c.id})">👤 Hồ sơ</button>
            <button type="button" class="btn btn-xs btn-emp" onclick="inviteCandidate(${c.id}, '${escAttr(c.ho_ten)}')">✉️ Mời</button>
          </div>
        </div>`;
    }).join('')}</div>`;

  } catch (err) {
    console.error('[Candidates] Error:', err);
    el.innerHTML = `<div class="empty"><div class="empty-icon">❌</div><p>Lỗi: ${escapeHtml(err.message)}</p></div>`;
  }
}

async function viewCandidate(id) {
  try {
    const r = await API.get(API_EMP.applications + '?action=detail&sinh_vien_id=' + id);

    if (!r.success) {
      toast(r.message || 'Không tải được hồ sơ', 'error');
      return;
    }

    const sv = r.sinh_vien;
    const kn = sv.ky_nang || [];
    const cc = sv.chung_chi || [];

    // Map mức độ kỹ năng → tiếng Việt
    const mucDoMap = {
      co_ban: 'Cơ bản',
      trung_binh: 'Trung bình',
      kha: 'Khá',
      gioi: 'Giỏi',
      xuat_sac: 'Xuất sắc'
    };

    // ✅ Kỹ năng — không bao giờ hiện (undefined)
    const skills = kn.length
      ? kn.map(k => {
        const raw = k.muc_do || k.trinh_do || '';
        const lvl = mucDoMap[raw] || raw;
        const lvlHtml = lvl
          ? `<small style="opacity:.75;margin-left:4px;">(${escapeHtml(lvl)})</small>`
          : '';
        return `<span class="tag">${escapeHtml(k.ten_ky_nang || '—')}${lvlHtml}</span>`;
      }).join('')
      : '<span class="text-muted" style="font-size:13px;">Chưa cập nhật kỹ năng</span>';

    // Chứng chỉ
    const certs = cc.length
      ? cc.map(c => `
          <div style="font-size:13px;padding:8px 10px;background:#f8fafc;border-radius:8px;margin-bottom:6px;">
            📄 <b>${escapeHtml(c.ten_chung_chi || c.tieu_de || '—')}</b>
            ${c.to_chuc ? ' • ' + escapeHtml(c.to_chuc) : ''}
            ${c.ngay_cap ? ' • ' + fmtDate(c.ngay_cap) : ''}
            ${c.file_url || c.duong_dan_file ? ` <a href="../${c.file_url || c.duong_dan_file}" target="_blank" style="color:#0ea5e9;margin-left:6px;">[Xem]</a>` : ''}
          </div>`).join('')
      : '<span class="text-muted" style="font-size:13px;">Chưa có chứng chỉ</span>';

    // ✅ Sao — DÙNG renderStarsCompact ĐỂ ĐỒNG BỘ
    const starHtml = renderStarsCompact(sv.diem_danh_gia || 0);
    const ratingCount = sv.so_lan_danh_gia || 0;

    openModal('👤 Hồ sơ sinh viên', `
      <div class="cand-detail">

        <!-- HEADER -->
        <div class="cd-head">
          <div class="cd-avatar">${(sv.ho_ten || '?').charAt(0).toUpperCase()}</div>
          <div class="cd-info">
            <div class="cd-name">${escapeHtml(sv.ho_ten || '—')}</div>
            <div class="cd-code">${escapeHtml(sv.ma_sinh_vien || '')} • ${escapeHtml(sv.truong || 'Chưa cập nhật trường')}</div>
            <div class="cd-rating">
              ${starHtml}
              <span class="cd-rating-count">(${ratingCount} đánh giá)</span>
            </div>
          </div>
        </div>

        <!-- THÔNG TIN CƠ BẢN -->
        <div class="cd-grid">
          <div class="cd-row">
            <span class="cd-icon">📧</span>
            <div><b>Email:</b> ${escapeHtml(sv.email || 'Ẩn')}</div>
          </div>
          <div class="cd-row">
            <span class="cd-icon">📞</span>
            <div><b>SĐT:</b> ${escapeHtml(sv.so_dien_thoai || 'Chưa cập nhật')}</div>
          </div>
          <div class="cd-row">
            <span class="cd-icon">🎓</span>
            <div><b>Khoa:</b> ${escapeHtml(sv.khoa || '—')} • <b>Ngành:</b> ${escapeHtml(sv.chuyen_nganh || '—')}</div>
          </div>
          <div class="cd-row">
            <span class="cd-icon">📚</span>
            <div><b>Năm học:</b> ${sv.nam_hoc || '—'} • <b>GPA:</b> ${sv.gpa ? parseFloat(sv.gpa).toFixed(2) : '—'}</div>
          </div>
        </div>

        <!-- GIỚI THIỆU -->
        ${sv.mo_ta ? `
          <div class="cd-section">
            <div class="cd-section-title">📝 Giới thiệu</div>
            <div class="cd-section-body">${escapeHtml(sv.mo_ta).replace(/\n/g, '<br>')}</div>
          </div>` : ''}

        <!-- KỸ NĂNG -->
        <div class="cd-section">
          <div class="cd-section-title">🛠️ Kỹ năng</div>
          <div class="cd-tags">${skills}</div>
        </div>

        <!-- CHỨNG CHỈ -->
        <div class="cd-section">
          <div class="cd-section-title">📜 Chứng chỉ / Sản phẩm</div>
          <div>${certs}</div>
        </div>
      </div>
    `, `
      <button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>
    `, 'large');

  } catch (err) {
    console.error('viewCandidate error:', err);
    toast('Lỗi: ' + err.message, 'error');
  }
}

async function inviteCandidate(id, name) {
  const r = await API.get(API_EMP.myJobs);
  const openJobs = (r.items || []).filter(j => j.trang_thai === 'dang_mo');
  if (!openJobs.length) {
    toast('Bạn cần có ít nhất 1 tin đang mở', 'error');
    return;
  }

  const opts = openJobs.map(j => `<option value="${j.id}">${escapeHtml(j.tieu_de)}</option>`).join('');
  openModal(`Mời ${name} làm việc`, `
    <div class="form-group">
      <label for="invite_job">Chọn tin việc</label>
      <select id="invite_job" class="form-control">${opts}</select>
    </div>
    <div class="form-group">
      <label for="invite_msg">Lời nhắn (tùy chọn)</label>
      <textarea id="invite_msg" class="form-control" rows="3" placeholder="VD: Chúng tôi rất ấn tượng với hồ sơ của bạn..."></textarea>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-emp" onclick="submitInvite(${id})">✉️ Gửi lời mời</button>
  `);
}

async function submitInvite(svId) {
  const jobId = document.getElementById('invite_job').value;
  const msg = document.getElementById('invite_msg').value;
  const r = await API.post(API_EMP.applications + '?action=invite', {
    sinh_vien_id: svId, viec_lam_id: jobId, loi_nhan: msg
  });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) closeModal();
}

/* ============ ỨNG TUYỂN ============ */
async function loadApplications() {
  const r = await API.get(API_EMP.applications);
  const el = document.getElementById('appsList');
  if (!el) return;
  if (!r.items?.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📨</div><p>Chưa có ứng tuyển</p></div>`;
    return;
  }
  el.innerHTML = r.items.map(renderAppRow).join('');
}

/* Sinh HTML các nút hành động theo trạng thái — DÙNG CHUNG */
function getAppActions(a, compact = false) {
  const status = a.trang_thai;
  const stop = compact ? 'event.stopPropagation(); ' : '';
  const titleAttr = (t) => compact ? ` title="${t}"` : '';
  const nameEsc = escAttr(a.ho_ten);

  if (status === 'cho_duyet' || status === 'cho_xu_ly') {
    return `
      <button type="button" class="btn btn-xs btn-ghost" onclick="${stop}viewCandidate(${a.sinh_vien_id})"${titleAttr('Hồ sơ')}>👤${compact ? '' : ' Hồ sơ'}</button>
      <button type="button" class="btn btn-xs btn-success" onclick="${stop}approveApp(${a.id})"${titleAttr('Duyệt')}>✅${compact ? '' : ' Duyệt'}</button>
      <button type="button" class="btn btn-xs btn-danger" onclick="${stop}rejectApp(${a.id})"${titleAttr('Từ chối')}>❌${compact ? '' : ' Từ chối'}</button>`;
  }
  if (status === 'da_chap_nhan' || status === 'chap_nhan') {
    return `
      <button type="button" class="btn btn-xs btn-ghost" onclick="${stop}viewCandidate(${a.sinh_vien_id})"${titleAttr('Hồ sơ')}>👤${compact ? '' : ' Hồ sơ'}</button>
      <button type="button" class="btn btn-xs btn-emp" onclick="${stop}openChatWith(${a.sinh_vien_id}, '${nameEsc}')"${titleAttr('Chat')}>💬${compact ? '' : ' Chat'}</button>`;
  }
  if (status === 'hoan_thanh') {
    return `
      <button type="button" class="btn btn-xs btn-ghost" onclick="${stop}viewCandidate(${a.sinh_vien_id})"${titleAttr('Hồ sơ')}>👤${compact ? '' : ' Hồ sơ'}</button>
      <button type="button" class="btn btn-xs btn-outline" onclick="${stop}openRateModal(${a.sinh_vien_id}, ${a.viec_lam_id})"${titleAttr('Đánh giá')}>⭐${compact ? '' : ' Đánh giá'}</button>
      ${compact ? '' : `<button type="button" class="btn btn-xs btn-emp" onclick="${stop}openChatWith(${a.sinh_vien_id}, '${nameEsc}')">💬 Chat</button>`}`;
  }
  return '';
}

function renderAppRow(a) {
  const st = getAppStatus(a.trang_thai);
  const skills = (a.ky_nang || []).slice(0, 3)
    .map(k => `<span class="tag tag-xs">${escapeHtml(k.ten_ky_nang)}</span>`).join('');

  const initial = (a.ho_ten || '?').charAt(0).toUpperCase();
  const stars = renderStarsCompact(a.diem_danh_gia || 0);

  return `
    <div class="appl-card">
      <div class="appl-head">
        <div class="appl-avatar">${initial}</div>
        <div class="appl-info">
          <div class="appl-name">${escapeHtml(a.ho_ten)}</div>
          <div class="appl-sub">${escapeHtml(a.ma_sinh_vien || '')} • ${escapeHtml(a.truong || 'Chưa cập nhật')}</div>
          <div class="appl-stars">${stars} <span class="text-muted" style="font-size:11px;">(${a.so_lan_danh_gia || 0})</span></div>
        </div>
        <span class="tag tag-xs ${st.cls}">${st.label}</span>
      </div>

      <div class="appl-job">
        📌 <b>${escapeHtml(a.tieu_de)}</b>
      </div>

      ${skills ? `<div class="appl-skills">${skills}</div>` : ''}

      <div class="appl-actions">${getAppActions(a, false)}</div>
    </div>`;
}

/* ============ RENDER COMPACT CHO DASHBOARD ============ */
function renderAppRowCompact(a) {
  const st = getAppStatus(a.trang_thai);
  const initial = (a.ho_ten || '?').charAt(0).toUpperCase();
  const stars = renderStarsCompact(a.diem_danh_gia || 0);

  return `
    <div class="dash-app-card">
      <div class="dac-avatar">${initial}</div>
      <div class="dac-body">
        <div class="dac-name">${escapeHtml(a.ho_ten)}</div>
        <div class="dac-code">${escapeHtml(a.ma_sinh_vien || '')}</div>
        <div class="dac-stars">${stars}</div>
      </div>
      <div class="dac-right">
        <span class="tag tag-xs ${st.cls}">${st.label}</span>
        <div class="dac-actions">${getAppActions(a, true)}</div>
      </div>
    </div>`;
}

function renderStarsCompact(diem) {
  const n = Math.round(diem || 0);
  let html = '<span class="stars-row">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="s ${i <= n ? '' : 'empty'}">★</span>`;
  }
  html += '</span>';
  return html;
}

async function approveApp(id) {
  if (!confirm('Duyệt ứng viên và kích hoạt bảo đảm thanh toán? Chat sẽ được mở khóa.')) return;
  const r = await API.post(API_EMP.applications + '?action=approve', { ung_tuyen_id: id });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) {
    loadApplications();
    setTimeout(() => document.querySelector('.nav-item[data-view="escrow"]')?.click(), 800);
  }
}
async function rejectApp(id) {
  if (!confirm('Từ chối ứng viên này?')) return;
  const r = await API.post(API_EMP.applications + '?action=reject', { ung_tuyen_id: id });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadApplications();
}

/* ============ CHAT ============ */
async function loadChatPartners() {
  const r = await API.get(API_EMP.messages + '?action=conversations');
  const el = document.getElementById('chatPartners');
  if (!el) return;
  if (!r.items?.length) {
    el.innerHTML = `<div class="empty" style="padding:20px;font-size:13px;"><div class="empty-icon">💬</div>Chưa có cuộc trò chuyện nào</div>`;
    return;
  }
  el.innerHTML = r.items.map(p => `
    <button type="button" class="chat-partner" onclick="openChatWith(${p.sinh_vien_id}, '${escAttr(p.ho_ten)}')">
      <div class="avatar">${(p.ho_ten || '?').charAt(0).toUpperCase()}</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(p.ho_ten)}</div>
        <div class="li-sub">${escapeHtml(p.tin_cuoi || '')}</div>
      </div>
      ${p.chua_doc ? `<span class="badge">${p.chua_doc}</span>` : ''}
    </button>
  `).join('');
}

async function openChatWith(id, name) {
  CHAT_STUDENT = { id, name };
  document.getElementById('chatHeader').textContent = name;
  document.getElementById('chatInput').disabled = false;
  document.getElementById('chatSend').disabled = false;

  document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === 'chat'));
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById('view-chat')?.classList.add('active');
  document.getElementById('pageTitle').textContent = 'Tin nhắn';
  closeSidebar();
  await loadChatMessages();
}

async function loadChatMessages() {
  if (!CHAT_STUDENT) return;
  const body = document.getElementById('chatBody');
  body.innerHTML = '<p class="text-muted" style="padding:20px;">Đang tải...</p>';

  const r = await API.get(API_EMP.messages + '?sinh_vien_id=' + CHAT_STUDENT.id);

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
    body.innerHTML = `<p class="text-muted" style="padding:20px;">${escapeHtml(r.message || 'Lỗi')}</p>`;
    return;
  }

  body.innerHTML = (r.items || []).map(m => `
    <div class="msg ${m.nguoi_gui === 'nha_tuyen_dung' ? 'me' : 'them'}">
      ${escapeHtml(m.noi_dung)}
      <span class="msg-time">${fmtDateTime(m.created_at)}</span>
    </div>
  `).join('');
  body.scrollTop = body.scrollHeight;
}

/* ============ BẢO ĐẢM ============ */
async function loadEscrow() {
  const [w, list] = await Promise.all([
    API.get(API_EMP.escrow + '?action=wallet'),
    API.get(API_EMP.escrow)
  ]);

  document.getElementById('walletBal').textContent = fmtMoney(w.so_du || 0);
  document.getElementById('totalEscrow').textContent = fmtMoney(list.tong_ky_quy || 0);

  const el = document.getElementById('escrowList');
  if (!el) return;
  if (!list.items?.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🛡️</div><p>Chưa có giao dịch bảo đảm</p></div>`;
    return;
  }

  el.innerHTML = list.items.map(e => `
    <div class="list-item">
      <div class="li-icon">🛡️</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(e.ho_ten)} — ${escapeHtml(e.tieu_de)}</div>
        <div class="li-sub">
          Mã: <b>${escapeHtml(e.ma_giao_dich || '')}</b> • 
          Thù lao: <b>${fmtMoney(e.so_tien)}</b>
          ${e.phi_dich_vu > 0 ? ' • Phí: ' + fmtMoney(e.phi_dich_vu) : ''}
        </div>
      </div>
      <span class="badge-payment ${paymentClass(e.trang_thai)}">${paymentLabel(e.trang_thai)}</span>
      <div class="li-actions">
        ${(e.trang_thai === 'cho_nap' || e.trang_thai === 'cho_ky_quy') ? `
          <button type="button" class="btn btn-sm btn-emp" onclick="activateEscrow(${e.id})">🔒 Kích hoạt</button>` : ''}
      </div>
    </div>
  `).join('');
}

async function activateEscrow(id) {
  if (!confirm('Trích tiền từ ví để kích hoạt bảo đảm thanh toán?')) return;
  const r = await API.post(API_EMP.escrow + '?action=activate', { id });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) loadEscrow();
}

/* ============ NGHIỆM THU ============ */
async function loadAcceptance() {
  const r = await API.get(API_EMP.acceptance);
  const el = document.getElementById('acceptList');
  if (!el) return;

  if (!r.items?.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📥</div>
      <p>Chưa có bài nộp nào cần nghiệm thu</p>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="accept-grid">${r.items.map(t => {
    const hasFile = !!t.file_goc;
    const done = t.trang_thai_nv === 'hoan_thanh';
    const initial = (t.ho_ten || '?').charAt(0).toUpperCase();

    return `
      <div class="accept-card ${done ? 'done' : ''}">
        <div class="accept-head">
          <div class="accept-avatar">${initial}</div>
          <div class="accept-info">
            <div class="accept-name">${escapeHtml(t.ho_ten)}</div>
            <div class="accept-code">${escapeHtml(t.ma_sinh_vien || '')}</div>
          </div>
          <span class="tag ${done ? 'success' : 'warning'}">
            ${done ? '✅ Đã nghiệm thu' : '⏳ Chờ nghiệm thu'}
          </span>
        </div>

        <div class="accept-job">
          📌 <b>${escapeHtml(t.ten_nhiem_vu || t.tieu_de || '')}</b>
        </div>

        <div class="accept-meta">
          ${t.han_nop ? `<span>⏰ Hạn: <b>${fmtDate(t.han_nop)}</b></span>` : ''}
          ${t.thu_lao ? `<span>💰 <b>${fmtMoney(t.thu_lao)}</b></span>` : ''}
        </div>

        <div class="accept-actions">
          ${hasFile
        ? `<button type="button" class="btn btn-sm btn-ghost" onclick="viewSubmission(${t.id}, ${done ? 1 : 0})">
                 👁️ Xem ${done ? 'toàn bộ' : '(3 trang)'}
               </button>`
        : '<span class="text-muted" style="font-size:12px;padding:8px;">Chưa có file</span>'}
          ${!done && hasFile
        ? `<button type="button" class="btn btn-sm btn-emp" onclick="openAcceptModal(${t.id})">✅ Nghiệm thu</button>`
        : ''}
        </div>
      </div>`;
  }).join('')}</div>`;
}

function openAcceptModal(id) {
  openModal('Nghiệm thu bài nộp', `
    <div class="form-group">
      <label for="nt_nhanxet">Nhận xét cho sinh viên</label>
      <textarea id="nt_nhanxet" class="form-control" rows="3" placeholder="VD: Sản phẩm đạt yêu cầu, code sạch..."></textarea>
    </div>
    <div class="form-group">
      <label>Quyết định</label>
      <label style="display:flex;gap:8px;align-items:center;">
        <input type="radio" name="nt_chapnhan" value="1" checked> Chấp nhận & giải ngân
      </label>
      <label style="display:flex;gap:8px;align-items:center;">
        <input type="radio" name="nt_chapnhan" value="0"> Yêu cầu chỉnh sửa
      </label>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-emp" onclick="submitAcceptance(${id})">Xác nhận</button>
  `);
}

async function submitAcceptance(id) {
  const chapNhanEl = document.querySelector('input[name="nt_chapnhan"]:checked');
  if (!chapNhanEl) return;

  const chapNhan = chapNhanEl.value;
  const nhanXet = document.getElementById('nt_nhanxet')?.value || '';

  const r = await API.post(API_EMP.acceptance + '?action=accept', {
    nhiem_vu_id: id,
    chap_nhan: chapNhan,
    nhan_xet: nhanXet
  });

  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) {
    closeModal();
    loadAcceptance();
  }
}

async function viewSubmission(id, accepted) {
  openModal(`Bài nộp #${id}`, `
    ${!accepted ? '<div class="canh-bao-preview">⚠️ Đây là bản xem trước (tối đa 3 trang). Nghiệm thu để xem toàn bộ.</div>' : ''}
    <div id="submissionViewer" style="min-height:500px;background:#f8fafc;border-radius:8px;padding:10px;overflow:auto;">
      <p style="padding:40px;text-align:center;color:#6b7280;">⏳ Đang tải...</p>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Đóng</button>
  `, 'large');

  const viewer = document.getElementById('submissionViewer');
  const url = API_EMP.acceptance + '?action=view_file&id=' + id;

  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const blob = await res.blob();

    // ============ PDF ============
    if (ct.includes('pdf')) {
      const buf = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const maxPage = accepted ? pdf.numPages : Math.min(3, pdf.numPages);

      viewer.innerHTML = '';
      for (let p = 1; p <= maxPage; p++) {
        const page = await pdf.getPage(p);
        const vp = page.getViewport({ scale: 1.3 });
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        viewer.appendChild(canvas);
      }

      if (!accepted && pdf.numPages > 3) {
        const note = document.createElement('div');
        note.className = 'preview-note';
        note.textContent = `⚠️ Còn ${pdf.numPages - 3} trang. Nghiệm thu để xem toàn bộ.`;
        viewer.appendChild(note);
      }
    }
    // ============ ẢNH ============
    else if (ct.includes('image')) {
      const objUrl = URL.createObjectURL(blob);
      viewer.innerHTML = `
        <img src="${objUrl}" style="max-width:100%;display:block;margin:0 auto;border-radius:8px;">
        ${!accepted ? '<div class="preview-note">⚠️ Bản xem trước. Nghiệm thu để xem toàn bộ.</div>' : ''}
      `;
    }
    else {
      viewer.innerHTML = `<p style="padding:40px;text-align:center;">Định dạng không hỗ trợ.</p>`;
    }
  } catch (e) {
    viewer.innerHTML = `<p style="padding:40px;text-align:center;color:#991b1b;">❌ Lỗi: ${escapeHtml(e.message)}</p>`;
  }
}

/* ============ ĐÁNH GIÁ ============ */
async function loadRatings() {
  const r = await API.get(API_EMP.ratings);
  const el = document.getElementById('ratingList');
  if (!el) return;

  if (!r.items?.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⭐</div>
      <p>Chưa có đánh giá nào</p>
      <p class="text-muted">Đánh giá SV sau khi nghiệm thu công việc.</p>
    </div>`;
    return;
  }

  el.innerHTML = `<div class="rate-grid">${r.items.map(d => {
    const initial = (d.ho_ten || '?').charAt(0).toUpperCase();
    const stars = renderStarsCompact(d.diem);
    return `
      <div class="rate-card">
        <div class="rate-head">
          <div class="rate-avatar">${initial}</div>
          <div class="rate-info">
            <div class="rate-name">${escapeHtml(d.ho_ten)}</div>
            <div class="rate-code">${escapeHtml(d.ma_sinh_vien || '')}</div>
          </div>
        </div>

        <div class="rate-stars-row">
          <span class="rate-stars">${stars}</span>
          <span class="rate-score">${d.diem}/5</span>
        </div>

        <div class="rate-job">📌 ${escapeHtml(d.tieu_de || '')}</div>

        ${d.nhan_xet ? `
          <div class="rate-comment">
            <span class="rate-quote">"</span>${escapeHtml(d.nhan_xet)}
          </div>` : ''}

        <div class="rate-time">🕒 ${fmtDateTime(d.created_at)}</div>
      </div>`;
  }).join('')}</div>`;
}

function openRateModal(svId, jobId) {
  openModal('Đánh giá sinh viên', `
    <div class="form-group">
      <label for="rate_diem">Điểm (1-5 sao)</label>
      <select id="rate_diem" class="form-control">
        <option value="5">⭐⭐⭐⭐⭐ Xuất sắc</option>
        <option value="4">⭐⭐⭐⭐ Tốt</option>
        <option value="3">⭐⭐⭐ Khá</option>
        <option value="2">⭐⭐ Trung bình</option>
        <option value="1">⭐ Yếu</option>
      </select>
    </div>
    <div class="form-group">
      <label for="rate_nhanxet">Nhận xét</label>
      <textarea id="rate_nhanxet" class="form-control" rows="3" placeholder="Sinh viên làm việc thế nào..."></textarea>
    </div>
  `, `
    <button type="button" class="btn btn-ghost" onclick="closeModal()">Huỷ</button>
    <button type="button" class="btn btn-emp" onclick="submitRating(${svId}, ${jobId})">⭐ Gửi</button>
  `);
}

async function submitRating(svId, jobId) {
  const diem = parseInt(document.getElementById('rate_diem').value);
  const nhanXet = document.getElementById('rate_nhanxet').value;
  const r = await API.post(API_EMP.ratings, {
    sinh_vien_id: svId,
    viec_lam_id: jobId,
    diem,
    nhan_xet: nhanXet
  });
  toast(r.message, r.success ? 'success' : 'error');
  if (r.success) { closeModal(); loadRatings(); }
}

/* ============ BÁO CÁO ============ */
async function loadReports() {
  const fromEl = document.getElementById('rep_from');
  const toEl = document.getElementById('rep_to');
  if (!fromEl || !toEl) return;

  if (!fromEl.value) {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    fromEl.value = first.toISOString().slice(0, 10);
    toEl.value = today.toISOString().slice(0, 10);
  }

  const from = fromEl.value;
  const to = toEl.value;

  const r = await API.get(`${API_EMP.reports}?action=summary&from=${from}&to=${to}`);
  if (!r.success) return;

  document.getElementById('repSummary').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card success emp"><div class="label">Tổng chi</div><div class="value">${fmtMoney(r.tong?.tong || 0)}</div></div>
      <div class="stat-card emp"><div class="label">Số giao dịch</div><div class="value">${r.tong?.so_gd || 0}</div></div>
      <div class="stat-card warning emp"><div class="label">Phí dịch vụ</div><div class="value">${fmtMoney(r.tong?.phi || 0)}</div></div>
      <div class="stat-card emp"><div class="label">Đang giữ escrow</div><div class="value">${fmtMoney(r.dang_giu?.tong || 0)}</div></div>
    </div>`;

  let html = `<thead><tr>
    <th>STT</th><th>Mã GD</th><th>Công việc</th><th>SV</th><th>Thù lao</th><th>Phí</th><th>Trạng thái</th><th>Ngày</th>
  </tr></thead><tbody>`;

  if (!r.chi_tiet?.length) {
    html += `<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:20px;">Không có giao dịch trong khoảng thời gian này</td></tr>`;
  } else {
    r.chi_tiet.forEach((c, i) => {
      html += `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(c.ma_giao_dich || '')}</td>
        <td>${escapeHtml(c.tieu_de || '')}</td>
        <td>${escapeHtml(c.ho_ten || '')} <small>(${escapeHtml(c.ma_sinh_vien || '')})</small></td>
        <td>${fmtMoney(c.so_tien)}</td>
        <td>${fmtMoney(c.phi_dich_vu)}</td>
        <td>${paymentLabel(c.trang_thai)}</td>
        <td>${fmtDate(c.created_at)}</td>
      </tr>`;
    });
  }
  html += '</tbody>';
  document.getElementById('repTable').innerHTML = html;
}

function exportReport() {
  const from = document.getElementById('rep_from')?.value || '';
  const to = document.getElementById('rep_to')?.value || '';
  window.location.href = `${API_EMP.reports}?action=export_csv&from=${from}&to=${to}`;
}

/* ============ THÔNG BÁO ============ */
async function loadNotifications() {
  const r = await API.get(API_EMP.notifications);
  const items = r.items || [];
  const unread = items.filter(x => !+x.da_doc).length;

  const badge = document.getElementById('notiBadge');
  if (badge) {
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  }

  const el = document.getElementById('notiList');
  if (!el) return;
  if (!items.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🔔</div><p>Không có thông báo</p></div>`;
    return;
  }
  el.innerHTML = items.map(n => `
    <div class="list-item ${+n.da_doc === 0 ? 'noti-unread' : ''}">
      <div class="li-icon">${n.loai === 'success' ? '✅' : n.loai === 'escrow' ? '🛡️' : 'ℹ️'}</div>
      <div class="li-body">
        <div class="li-title">${escapeHtml(n.tieu_de)}</div>
        <div class="li-sub">${escapeHtml(n.noi_dung || '')} • ${fmtDateTime(n.ngay_tao)}</div>
      </div>
    </div>
  `).join('');

  if (unread) API.put(API_EMP.notifications, {});
}

/* ============ LOGOUT ============ */
async function logout() {
  if (!confirm('Đăng xuất khỏi tài khoản?')) return;
  await API.post(API_EMP.auth + '?action=logout', {});
  location.href = 'login.html';
}


/* ============================================================
   TOGGLE FORM THEO HÌNH THỨC LÀM VIỆC
   ============================================================ */
function setupJobTypeToggle() {
  const select = document.getElementById('j_loai');
  if (!select || select._bound) return;
  select._bound = true;

  select.addEventListener('change', updateJobTypeForm);
  updateJobTypeForm(); // Chạy lần đầu
}

function updateJobTypeForm() {
  const type = document.getElementById('j_loai')?.value || 'remote';
  const blockRemote = document.getElementById('block-remote');
  const blockOnsite = document.getElementById('block-onsite');
  const hint = document.getElementById('j_loai_hint');

  if (!blockRemote || !blockOnsite) return;
  clearJobFieldRequirements();

  if (type === 'remote') {
    blockRemote.classList.remove('hidden');
    blockOnsite.classList.add('hidden');

    document.getElementById('j_han').required = true;
    document.getElementById('j_han_nop_r').required = true;

    if (hint) hint.textContent = '💻 SV làm online. Cần: Hạn ứng tuyển + Hạn nộp sản phẩm.';
  } else {
    blockRemote.classList.add('hidden');
    blockOnsite.classList.remove('hidden');

    document.getElementById('j_han_onsite').required = true;
    document.getElementById('j_ngay_bd').required = true;
    document.getElementById('j_ngay_kt').required = true;
    document.getElementById('j_han_nop_o').required = true;
    document.getElementById('j_diachi').required = true;

    if (hint) hint.textContent = type === 'onsite'
      ? '🏢 SV làm tại văn phòng. Cần: Hạn ứng tuyển + Thời gian làm + Hạn nộp + Địa chỉ.'
      : '🔀 Kết hợp online + văn phòng. Cần: Hạn ứng tuyển + Thời gian làm + Hạn nộp + Địa chỉ.';
  }
}

/* Xoá required của TẤT CẢ field động (cả remote + onsite) trước khi set lại */
function clearJobFieldRequirements() {
  ['j_han', 'j_han_nop_r', 'j_han_onsite',
    'j_ngay_bd', 'j_ngay_kt', 'j_han_nop_o', 'j_diachi'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.required = false;
    });
}


/* ============================================================
   ĐIỀU HƯỚNG THÔNG BÁO — Khi bấm chuông topbar
   ============================================================ */
function goToNotifications() {
  // 1. Đổi active menu ở sidebar
  document.querySelectorAll('.nav-item').forEach(x => {
    x.classList.toggle('active', x.dataset.view === 'notifications');
  });

  // 2. Ẩn tất cả view, hiện view-notifications
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  const view = document.getElementById('view-notifications');
  if (view) view.classList.add('active');

  // 3. Đổi tiêu đề
  const title = document.getElementById('pageTitle');
  if (title) title.textContent = 'Thông báo';

  // 4. Đóng sidebar nếu đang mở (mobile)
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('show');

  // 5. Load danh sách thông báo
  if (typeof loadNotifications === 'function') {
    loadNotifications();
  }

  // 6. Đánh dấu đã đọc
  if (typeof API !== 'undefined' && typeof API_EMP !== 'undefined') {
    API.put(API_EMP.notifications, {}).catch(() => { });
  }
}