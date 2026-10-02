/* ============================================================
   AI CHATBOT WIDGET
   ============================================================ */
console.log('[CHATBOT] Script loaded');

(function () {
  const isSubFolder = location.pathname.includes('/employer/') 
                   || location.pathname.includes('/admin/');
  const API_URL = isSubFolder ? '../api/chatbot.php' : 'api/chatbot.php';

  const widgetHtml = `
    <button id="ai-fab" 
      style="position:fixed;bottom:24px;right:24px;width:60px;height:60px;
             border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);
             color:#fff;border:none;font-size:28px;cursor:pointer;z-index:99998;
             box-shadow:0 8px 24px rgba(99,102,241,.4);">🤖</button>
    <div id="ai-window" 
      style="display:none;position:fixed;bottom:96px;right:24px;width:380px;height:540px;
             background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);
             z-index:99999;flex-direction:column;overflow:hidden;">
      <div style="padding:14px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                  color:#fff;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;">🤖</span>
          <div>
            <div style="font-weight:700;font-size:14px;">Trợ lý Stujob</div>
            <div style="font-size:11px;opacity:.85;">Hỏi tôi bất cứ điều gì</div>
          </div>
        </div>
        <button id="ai-close" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">✕</button>
      </div>
      <div id="ai-messages" style="flex:1;padding:14px;overflow-y:auto;background:#f8fafc;
               display:flex;flex-direction:column;gap:10px;"></div>
      <form id="ai-form" style="padding:12px;border-top:1px solid #e2e8f0;display:flex;gap:8px;background:#fff;">
        <input id="ai-input" type="text" placeholder="Nhập câu hỏi..." autocomplete="off"
          style="flex:1;padding:10px 14px;border:2px solid #e2e8f0;border-radius:24px;
                 outline:none;font-size:14px;">
        <button type="submit" style="padding:10px 18px;background:#6366f1;color:#fff;border:none;
                 border-radius:24px;font-weight:600;cursor:pointer;">Gửi</button>
      </form>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', widgetHtml);

  const fab = document.getElementById('ai-fab');
  const win = document.getElementById('ai-window');
  const closeBtn = document.getElementById('ai-close');
  const box = document.getElementById('ai-messages');
  const form = document.getElementById('ai-form');
  const HISTORY = [];
  let greeted = false;

  fab.onclick = function () {
    const isOpen = win.style.display === 'flex';
    win.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen && !greeted) {
      addMsg('assistant', '👋 Xin chào! Tôi là trợ lý ảo Stujob. Bạn cần hỗ trợ gì?');
      greeted = true;
    }
  };

  closeBtn.onclick = function () { win.style.display = 'none'; };

  function addMsg(role, text) {
    const isUser = role === 'user';

    let cleanText = text;
    let jobData = null;
    const match = text.match(/JOB_DRAFT:(\{.*\})/);
    if (match) {
      try {
        jobData = JSON.parse(match[1]);
        cleanText = text.replace(/JOB_DRAFT:\{.*\}/, '').trim();
        console.log('[CHATBOT] Parse JOB_DRAFT:', jobData);
      } catch (e) {
        console.error('[CHATBOT] JSON parse error:', e);
      }
    }

    // Format markdown **bold** thành <b>
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    const div = document.createElement('div');
    div.style.cssText = `display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};`;
    const bubble = document.createElement('div');
    bubble.style.cssText = `max-width:80%;padding:10px 14px;border-radius:14px;
      font-size:14px;line-height:1.5;word-wrap:break-word;
      background:${isUser ? '#6366f1' : '#fff'};color:${isUser ? '#fff' : '#1e293b'};
      ${isUser ? '' : 'border:1px solid #e2e8f0;'}`;
    bubble.innerHTML = cleanText.replace(/\n/g, '<br>');
    div.appendChild(bubble);

    if (jobData) {
      const btn = document.createElement('button');
      btn.innerHTML = '📝 Điền vào form đăng tin';
      btn.style.cssText = `
        display:block;width:100%;margin-top:10px;padding:12px 14px;
        background:linear-gradient(135deg,#10b981,#059669);
        color:#fff;border:none;border-radius:10px;font-size:14px;
        font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,.3);
        transition:transform .2s;`;
      btn.onmouseover = () => btn.style.transform = 'translateY(-2px)';
      btn.onmouseout = () => btn.style.transform = 'translateY(0)';
      btn.onclick = function () { fillJobForm(jobData); };
      div.appendChild(btn);
    }

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function fillJobForm(data) {
    console.log('[CHATBOT] === Điền form ===', data);
    document.getElementById('ai-window').style.display = 'none';

    const navItem = document.querySelector('.nav-item[data-view="post-job"]');
    if (!navItem) { alert('❌ Không tìm thấy tab "Đăng tin việc"!'); return; }
    navItem.click();

    setTimeout(function () {
      // BƯỚC 1: CHỌN NHÓM VIỆC
      const nhom = data.nhom_viec || '';
      const catSel = document.getElementById('tpl_cat');
      let matched = false;

      if (catSel && nhom) {
        let val = '';
        Array.from(catSel.options).forEach(function (opt) {
          const optText = opt.textContent.replace(/^[^\wÀ-ỹ]+/, '').trim().toLowerCase();
          const target = nhom.toLowerCase().trim();
          if (optText === target || optText.includes(target) || target.includes(optText)) val = opt.value;
        });
        if (val) {
          catSel.value = val;
          catSel.dispatchEvent(new Event('change'));
          matched = true;
          console.log('[CHATBOT] ✅ Nhóm:', nhom, '=', val);
        }
      }

      setTimeout(function () {
        const setVal = function (id, v) {
          const el = document.getElementById(id);
          if (el && v !== undefined && v !== null && v !== '') {
            el.value = v;
            console.log('[CHATBOT]   →', id, '=', v);
          }
        };

        setVal('j_tieude', data.tieu_de);
        setVal('j_mota', data.mo_ta);
        setVal('j_kynang', data.ky_nang_can);
        setVal('j_thulao', data.thu_lao);
        if (data.so_luong_can) setVal('j_soluong', data.so_luong_can);
        if (data.so_buoi) setVal('j_sobuoi', data.so_buoi);
        if (data.gio_uoc_tinh) setVal('j_giouoc', data.gio_uoc_tinh);

        // Hình thức
        const typeEl = document.getElementById('j_loai');
        if (typeEl && data.loai_cong_viec) {
          typeEl.value = data.loai_cong_viec;
          typeEl.dispatchEvent(new Event('change'));
        }

        // 4 trường ngày
        if (data.han_chot) {
          setVal('j_han', data.han_chot);
          setVal('j_han_onsite', data.han_chot);
        }
        if (data.han_nop_file) {
          setVal('j_han_nop_r', data.han_nop_file);
          setVal('j_han_nop_o', data.han_nop_file);
        }
        if (data.ngay_bat_dau) setVal('j_ngay_bd', data.ngay_bat_dau);
        if (data.ngay_ket_thuc) setVal('j_ngay_kt', data.ngay_ket_thuc);
        if (data.dia_chi_lam_viec) setVal('j_diachi', data.dia_chi_lam_viec);

        // Thông báo
        let msg = '✅ Đã điền thông tin vào form!\n\n';
        if (matched) msg += '📌 Nhóm: ' + nhom + '\n';
        else msg += '⚠️ Không tự chọn được nhóm. Chọn tay: ' + nhom + '\n';
        if (data.tieu_de) msg += '📌 Tiêu đề: ' + data.tieu_de + '\n';
        if (data.han_chot) msg += '⏰ Hạn ứng tuyển: ' + data.han_chot + '\n';
        if (data.han_nop_file) msg += '📤 Hạn nộp: ' + data.han_nop_file + '\n';
        msg += '\n👉 Kiểm tra và bổ sung các trường còn thiếu!';

        if (typeof toast === 'function') toast('✅ Đã điền vào form!', 'success');
        alert(msg);

        setTimeout(function () {
          const f = document.getElementById('jobForm');
          if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }, 500);
    }, 800);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const inp = document.getElementById('ai-input');
    const msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';

    addMsg('user', msg);
    HISTORY.push({ role: 'user', content: msg });

    const load = document.createElement('div');
    load.id = 'ai-loading';
    load.style.cssText = 'color:#64748b;font-size:13px;padding:6px 12px;';
    load.textContent = '⏳ Đang suy nghĩ...';
    box.appendChild(load);
    box.scrollTop = box.scrollHeight;

    try {
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: HISTORY.slice(-6) })
      });
      const j = await r.json();
      document.getElementById('ai-loading')?.remove();

      if (j.success) {
        addMsg('assistant', j.reply);
        HISTORY.push({ role: 'assistant', content: j.reply });
      } else {
        addMsg('assistant', '❌ ' + j.message);
      }
    } catch (err) {
      document.getElementById('ai-loading')?.remove();
      addMsg('assistant', '❌ Lỗi kết nối. Vui lòng thử lại.');
    }
  });
})();